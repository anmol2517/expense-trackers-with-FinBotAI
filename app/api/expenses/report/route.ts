import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import Expense from '@/models/Expense'
import { getCurrentUser } from '@/lib/auth'
import { logError } from '@/lib/logger'
import { jsPDF } from 'jspdf'

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

    const dateFilter: Record<string, Date> = {}
    if (startDate) dateFilter.$gte = new Date(startDate)
    if (endDate) dateFilter.$lte = new Date(endDate)

    const matchStage: Record<string, unknown> = { user: new mongoose.Types.ObjectId(user.userId) }
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter
    }

    const expenses = await Expense.find(matchStage).sort({ date: -1 }).lean()

    const categoryTotals = await Expense.aggregate([
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

    const overallStats = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          avgExpense: { $avg: '$amount' },
          maxExpense: { $max: '$amount' },
        },
      },
    ])

    const stats = overallStats[0] || { totalSpent: 0, totalCount: 0, avgExpense: 0, maxExpense: 0 }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let yPos = 20

    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('Expense Report', pageWidth / 2, yPos, { align: 'center' })
    yPos += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated for: ${user.name}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5

    const dateRange = startDate && endDate
      ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
      : 'All Time'
    doc.text(`Period: ${dateRange}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 15

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', 14, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Spent: ₹${stats.totalSpent?.toFixed(2) || '0.00'}`, 14, yPos)
    yPos += 6
    doc.text(`Total Transactions: ${stats.totalCount || 0}`, 14, yPos)
    yPos += 6
    doc.text(`Average Expense: ₹${stats.avgExpense?.toFixed(2) || '0.00'}`, 14, yPos)
    yPos += 6
    doc.text(`Highest Expense: ₹${stats.maxExpense?.toFixed(2) || '0.00'}`, 14, yPos)
    yPos += 15

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Spending by Category', 14, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    if (categoryTotals.length > 0) {
      categoryTotals.forEach((cat) => {
        const percentage = stats.totalSpent ? ((cat.total / stats.totalSpent) * 100).toFixed(1) : '0'
        doc.text(`${cat._id}: ₹${cat.total.toFixed(2)} (${percentage}%)`, 14, yPos)
        yPos += 6
      })
    } else {
      doc.text('No expenses in this period', 14, yPos)
      yPos += 6
    }
    yPos += 10

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Expense Details', 14, yPos)
    yPos += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Date', 14, yPos)
    doc.text('Description', 45, yPos)
    doc.text('Category', 120, yPos)
    doc.text('Amount', 165, yPos)
    yPos += 6

    doc.setDrawColor(200)
    doc.line(14, yPos - 2, pageWidth - 14, yPos - 2)

    doc.setFont('helvetica', 'normal')

    expenses.forEach((expense) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }

      const date = new Date(expense.date).toLocaleDateString()
      const description = expense.description.length > 35
        ? expense.description.substring(0, 32) + '...'
        : expense.description
      const category = expense.category.length > 15
        ? expense.category.substring(0, 12) + '...'
        : expense.category

      doc.text(date, 14, yPos)
      doc.text(description, 45, yPos)
      doc.text(category, 120, yPos)
      doc.text(`₹${expense.amount.toFixed(2)}`, 165, yPos)
      yPos += 6
    })

    if (expenses.length === 0) {
      doc.text('No expenses found for this period', 14, yPos)
    }

    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text(
        `Page ${i} of ${totalPages} - ExpenseTrack Report`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="expense-report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    logError(error, 'api/expenses/report')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}