export type TransactionType = 'INCOME' | 'EXPENSE'

export interface Category {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
  createdAt: string
  updatedAt: string
  _count?: { transactions: number }
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  date: string
  categoryId: string
  createdAt: string
  updatedAt: string
  category: Category
}

export interface CategoryStat {
  name: string
  color: string
  icon: string
  type: TransactionType
  total: number
  count: number
}

export interface MonthlyTrendItem {
  label: string
  year: number
  month: number
  income: number
  expense: number
}

export interface Stats {
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
  byCategory: CategoryStat[]
  monthlyTrend: MonthlyTrendItem[]
}
