import { SignJWT, jwtVerify, errors } from 'jose'
import { cookies } from 'next/headers'

const TOKEN_NAME = 'expense-tracker-token'
const TOKEN_EXPIRY = '7d'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters for security')
  }
  return new TextEncoder().encode(secret)
}

export interface JWTPayload {
  userId: string
  email: string
  name: string
  iat?: number
  exp?: number
}

export async function createToken(payload: JWTPayload): Promise<string> {
  const secret = getJwtSecret()
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    
    // Check if token is expired (jose handles this, but we double-check)
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null
    }
    
    return payload as unknown as JWTPayload
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof errors.JWTExpired) {
      return null // Token expired
    }
    if (error instanceof errors.JWTInvalid) {
      return null // Invalid token
    }
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_NAME)
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_NAME)?.value
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthToken()
  if (!token) return null
  return verifyToken(token)
}
