import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { loginSchema } from '@/lib/validations'
import { createToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate input
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    await connectDB()

    // Find user with password field
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await user.comparePassword(password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

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
    
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
