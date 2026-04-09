import mongoose, { Schema, Document, Model } from 'mongoose'

export const EXPENSE_CATEGORIES = [
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

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  amount: number
  category: ExpenseCategory
  description: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

const expenseSchema = new Schema<IExpense>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be at least 0.01'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: EXPENSE_CATEGORIES,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient queries
expenseSchema.index({ user: 1, date: -1 })
expenseSchema.index({ user: 1, category: 1 })

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', expenseSchema)

export default Expense
