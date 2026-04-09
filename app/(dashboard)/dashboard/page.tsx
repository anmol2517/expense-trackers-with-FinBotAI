'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { ExpenseForm } from '@/components/expense-form'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer } from 'recharts'
import { PlusIcon, TrendingUpIcon, TrendingDownIcon, WalletIcon, CalendarIcon, TargetIcon, ArrowRightIcon } from 'lucide-react'

interface CategoryData {
  category: string
  total: number
  count: number
}

interface MonthlyData {
  year: number
  month: number
  total: number
  count: number
}

interface Summary {
  totalAmount: number
  totalCount: number
  avgAmount: number
  maxAmount: number
  minAmount: number
}

interface RecentExpense {
  _id: string
  amount: number
  category: string
  date: string
  description: string
}

interface SummaryResponse {
  categoryData: CategoryData[]
  monthlyData: MonthlyData[]
  summary: Summary
  recentExpenses: RecentExpense[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const CATEGORY_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#84cc16',
]

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function DashboardPage() {
  const [formOpen, setFormOpen] = useState(false)
  const { data, error, isLoading, mutate } = useSWR<SummaryResponse>('/api/expenses/summary', fetcher)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })
  }

  const pieData = data?.categoryData.map((item, index) => ({
    name: item.category,
    value: item.total,
    fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  })) || []

  const barData = data?.monthlyData.map((item) => ({
    month: MONTH_NAMES[item.month - 1],
    total: item.total,
    year: item.year,
  })).slice(-6) || []

  const lineData = data?.recentExpenses
    .slice()
    .reverse()
    .reduce((acc: { date: string; total: number }[], expense) => {
      const dateKey = formatDate(expense.date)
      const existing = acc.find((item) => item.date === dateKey)
      if (existing) {
        existing.total += expense.amount
      } else {
        acc.push({ date: dateKey, total: expense.amount })
      }
      return acc
    }, [])
    .slice(-10) || []

  const pieConfig = pieData.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  const barConfig = {
    total: { label: 'Spending', color: 'hsl(var(--chart-1))' },
  }

  const lineConfig = {
    total: { label: 'Daily Spending', color: 'hsl(var(--chart-2))' },
  }

  const currentMonthTotal = barData[barData.length - 1]?.total || 0
  const prevMonthTotal = barData[barData.length - 2]?.total || 0
  const monthChange = prevMonthTotal ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-destructive mb-4">Failed to load dashboard data</p>
          <Button onClick={() => mutate()}>Retry</Button>
        </Card>
      </div>
    )
  }

  const summary = data?.summary || { totalAmount: 0, totalCount: 0, avgAmount: 0, maxAmount: 0, minAmount: 0 }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your spending habits</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Expense</CardTitle>
            <TargetIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.avgAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthTotal)}</div>
            <div className="flex items-center text-xs">
              {monthChange >= 0 ? (
                <TrendingUpIcon className="h-3 w-3 text-destructive mr-1" />
              ) : (
                <TrendingDownIcon className="h-3 w-3 text-green-500 mr-1" />
              )}
              <span className={monthChange >= 0 ? 'text-destructive' : 'text-green-500'}>
                {Math.abs(monthChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Highest Expense</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.maxAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Single transaction
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Distribution of expenses across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer config={pieConfig} className="h-[300px]">
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />}
                  />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No expense data to display
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
            <CardDescription>Your spending over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ChartContainer config={barConfig} className="h-[300px]">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <ChartTooltip
                    content={<ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />}
                  />
                  <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No monthly data to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Spending Trend</CardTitle>
            <CardDescription>Your recent daily spending pattern</CardDescription>
          </CardHeader>
          <CardContent>
            {lineData.length > 0 ? (
              <ChartContainer config={lineConfig} className="h-[300px]">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <ChartTooltip
                    content={<ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b' }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend data to display
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Your latest transactions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/expenses">
                View All
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data?.recentExpenses && data.recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {data.recentExpenses.slice(0, 5).map((expense) => (
                  <div key={expense._id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {expense.category} - {formatDate(expense.date)}
                      </p>
                    </div>
                    <span className="text-sm font-medium ml-4">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground">
                <p className="mb-4">No expenses yet</p>
                <Button onClick={() => setFormOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Your First Expense
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => mutate()}
      />
    </div>
  )
}