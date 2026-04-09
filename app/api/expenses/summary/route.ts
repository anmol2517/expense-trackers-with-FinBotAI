import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import Expense from '@/models/Expense'
import { getCurrentUser } from '@/lib/auth'
import { logError } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    await connectDB()

    // Build date filter
    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.$gte = new Date(startDate)
    if (endDate) dateFilter.$lte = new Date(endDate)

    const matchStage: Record<string, unknown> = { user: new mongoose.Types.ObjectId(user.userId) }
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter
    }

    // Aggregate by category
    const categoryData = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ])

    // Aggregate by month
    const monthlyData = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ])

    // Total summary
    const totalSummary = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' },
        },
      },
    ])

    // Recent expenses for trend
    const recentExpenses = await Expense.find({ user: new mongoose.Types.ObjectId(user.userId) })
      .sort({ date: -1 })
      .limit(30)
      .lean()

    return NextResponse.json({
      categoryData: categoryData.map((c) => ({
        category: c._id,
        total: c.total,
        count: c.count,
      })),
      monthlyData: monthlyData.map((m) => ({
        year: m._id.year,
        month: m._id.month,
        total: m.total,
        count: m.count,
      })),
      summary: totalSummary[0] || {
        totalAmount: 0,
        totalCount: 0,
        avgAmount: 0,
        maxAmount: 0,
        minAmount: 0,
      },
      recentExpenses: recentExpenses.map((e) => ({
        _id: e._id.toString(),
        amount: e.amount,
        category: e.category,
        date: e.date,
        description: e.description,
      })),
    })
  } catch (error) {
    logError(error, 'api/expenses/summary')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
