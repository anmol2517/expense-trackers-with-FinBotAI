import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import Expense from '@/models/Expense'
import { getCurrentUser } from '@/lib/auth'
import { logError } from '@/lib/logger'
import { expenseUpdateSchema } from '@/lib/validations'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const expense = await Expense.findOne({ _id: id, user: new mongoose.Types.ObjectId(user.userId) }).lean()
    
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({
      expense: {
        ...expense,
        _id: expense._id.toString(),
        user: expense.user.toString(),
      },
    })
  } catch (error) {
    logError(error, 'api/expenses/[id] GET')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const result = expenseUpdateSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    await connectDB()

    const expense = await Expense.findOneAndUpdate(
      { _id: id, user: new mongoose.Types.ObjectId(user.userId) },
      result.data,
      { new: true, runValidators: true }
    ).lean()

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({
      expense: {
        ...expense,
        _id: expense._id.toString(),
        user: expense.user.toString(),
      },
    })
  } catch (error) {
    logError(error, 'api/expenses/[id] PUT')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const expense = await Expense.findOneAndDelete({ _id: id, user: new mongoose.Types.ObjectId(user.userId) })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logError(error, 'api/expenses/[id] DELETE')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
