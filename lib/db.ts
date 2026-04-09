import { logInfo } from '@/lib/logger'
import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

/**
 * Validates and sanitizes MongoDB connection string
 * Handles special characters in passwords by URL encoding them
 */
function getConnectionString(): string {
  const uri = process.env.MONGODB_URI
  
  if (!uri) {
    throw new Error(
      'Please define the MONGODB_URI environment variable in your project settings'
    )
  }

  // Check for common connection string issues
  try {
    // Parse the connection string to validate it
    const url = new URL(uri)
    
    // If password contains special characters, they should be URL encoded
    // This helps catch issues like unencoded @ symbols
    if (url.password && url.password.includes('@')) {
      logInfo(
        'Warning: Your MongoDB password contains special characters. ' +
        'Make sure they are URL-encoded (e.g., @ should be %40)'
      )
    }
    
    return uri
  } catch {
    // If URL parsing fails, check for common issues
    if (uri.match(/:.*@.*@/)) {
      throw new Error(
        'Invalid MongoDB URI: Your password appears to contain an unencoded "@" symbol. ' +
        'Please URL-encode special characters in your password (e.g., replace @ with %40). ' +
        'Update your MONGODB_URI in project settings (Settings > Vars).'
      )
    }
    
    throw new Error(
      'Invalid MongoDB URI format. Please check your MONGODB_URI environment variable. ' +
      'Expected format: mongodb+srv://username:password@cluster.mongodb.net/database'
    )
  }
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const connectionString = getConnectionString()
    
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    cached.promise = mongoose.connect(connectionString, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    const error = e as Error
    
    // Provide helpful error messages for common issues
    if (error.message.includes('MongoParseError')) {
      throw new Error(
        'Failed to parse MongoDB connection string. ' +
        'If your password contains special characters like @, #, %, encode them ' +
        '(e.g., @ becomes %40). Update MONGODB_URI in Settings > Vars.'
      )
    }
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      throw new Error(
        'Could not connect to MongoDB Atlas. Please check your cluster hostname ' +
        'and ensure your IP address is whitelisted in MongoDB Atlas Network Access.'
      )
    }
    
    if (error.message.includes('Authentication failed')) {
      throw new Error(
        'MongoDB authentication failed. Please verify your username and password ' +
        'in the MONGODB_URI environment variable.'
      )
    }
    
    throw e
  }

  return cached.conn
}
