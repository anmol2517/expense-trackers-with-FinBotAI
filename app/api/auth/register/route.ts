import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { registerSchema } from '@/lib/validations'
import { createToken, setAuthCookie } from '@/lib/auth'
import { logError } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data

    await connectDB()

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Create user
    const user = await User.create({ name, email, password })

    // Create token and set cookie
    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    })
    await setAuthCookie(token)

    return NextResponse.json({
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    const err = error as Error
    logError(err, 'api/auth/register')
    // Handle specific error types
    if (err.message.includes('MONGODB_URI') || err.message.includes('MongoDB')) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 503 }
      )
    }
    
    if (err.message.includes('JWT_SECRET')) {
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }
    
    // Mongoose duplicate key error
    if (err.message.includes('duplicate key') || err.message.includes('E11000')) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
