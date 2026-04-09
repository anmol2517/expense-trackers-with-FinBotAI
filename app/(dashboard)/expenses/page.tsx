'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpenseForm } from '@/components/expense-form'
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon, DownloadIcon } from 'lucide-react'
import { toast } from 'sonner'

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Other',
] as const
type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

interface Expense {
  _id: string
  amount: number
  category: ExpenseCategory
  description: string
  date: string
  createdAt: string
}

interface ExpensesResponse {
  expenses: Expense[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ExpensesPage() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const queryParams = new URLSearchParams()
  queryParams.set('page', page.toString())
  queryParams.set('limit', '10')
  if (category && category !== 'all') queryParams.set('category', category)
  if (startDate) queryParams.set('startDate', startDate)
  if (endDate) queryParams.set('endDate', endDate)

  const { data, error, isLoading, mutate } = useSWR<ExpensesResponse>(
    `/api/expenses?${queryParams.toString()}`,
    fetcher
  )

  const handleSuccess = useCallback(() => {
    mutate()
    toast.success(editingExpense ? 'Expense updated!' : 'Expense added!')
    setEditingExpense(null)
  }, [mutate, editingExpense])

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteExpense) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/expenses/${deleteExpense._id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        mutate()
        toast.success('Expense deleted!')
      } else {
        toast.error('Failed to delete expense')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsDeleting(false)
      setDeleteExpense(null)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingExpense(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Manage and track all your expenses</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams()
              if (startDate) params.set('startDate', startDate)
              if (endDate) params.set('endDate', endDate)
              window.open(`/api/expenses/report?${params.toString()}`, '_blank')
            }}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter expenses by category and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                <SelectTrigger>
                  <SearchIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-auto"
              />
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-auto"
              />
            </div>
            {(category !== 'all' || startDate || endDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setCategory('all')
                  setStartDate('')
                  setEndDate('')
                  setPage(1)
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive">
              Failed to load expenses. Please try again.
            </div>
          ) : !data?.expenses?.length ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No expenses found</p>
              <Button onClick={() => setFormOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.expenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(expense.date)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
                          {expense.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(expense)}
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteExpense(expense)}
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.pagination.total)} of {data.pagination.total} expenses
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page === data.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ExpenseForm
        open={formOpen}
        onOpenChange={handleOpenChange}
        expense={editingExpense}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={!!deleteExpense} onOpenChange={(open) => !open && setDeleteExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}