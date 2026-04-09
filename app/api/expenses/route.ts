import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import Expense from '@/models/Expense'
import { getCurrentUser } from '@/lib/auth'
import { logError } from '@/lib/logger'
import { expenseSchema, expenseQuerySchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryResult = expenseQuerySchema.safeParse(Object.fromEntries(searchParams))
    
    if (!queryResult.success) {
      return NextResponse.json(
        { error: queryResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { page, limit, category, startDate, endDate, sortBy, sortOrder } = queryResult.data

    await connectDB()

    // Build filter
    const filter: Record<string, unknown> = { user: new mongoose.Types.ObjectId(user.userId) }
    
    if (category) {
      filter.category = category
    }
    
    if (startDate || endDate) {
      filter.date = {}
      if (startDate) {
        (filter.date as Record<string, Date>).$gte = new Date(startDate)
      }
      if (endDate) {
        (filter.date as Record<string, Date>).$lte = new Date(endDate)
      }
    }

    // Build sort
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    }

    // Execute query with pagination
    const skip = (page - 1) * limit
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Expense.countDocuments(filter),
    ])

    return NextResponse.json({
      expenses: expenses.map((e) => ({
        ...e,
        _id: e._id.toString(),
        user: e.user.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logError(error, 'api/expenses GET')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = expenseSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    await connectDB()

    const expense = await Expense.create({
      ...result.data,
      user: user.userId,
    })

    return NextResponse.json({
      expense: {
        ...expense.toObject(),
        _id: expense._id.toString(),
        user: expense.user.toString(),
      },
    })
  } catch (error) {
    logError(error, 'api/expenses POST')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
