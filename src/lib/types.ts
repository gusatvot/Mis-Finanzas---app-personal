export type TransactionType = 'INCOME' | 'EXPENSE'

export type AccountType = 'CASH' | 'BANK' | 'CARD'

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

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

export interface Account {
  id: string
  name: string
  type: AccountType
  color: string
  initialBalance: number
  createdAt: string
  updatedAt: string
  _count?: { transactions: number }
  balance?: number // computed: initialBalance + income - expense
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  date: string
  categoryId: string
  accountId: string | null
  createdAt: string
  updatedAt: string
  category: Category
  account: Account | null
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
  byAccount: { name: string; color: string; type: string; income: number; expense: number; balance: number }[]
}

export interface Budget {
  id: string
  categoryId: string
  month: string
  amount: number
  category: Category
  spent?: number
}

export interface RecurringTransaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  categoryId: string
  accountId: string | null
  frequency: RecurringFrequency
  dayOfMonth: number | null
  dayOfWeek: number | null
  startDate: string
  endDate: string | null
  lastPosted: string | null
  nextDue: string
  active: boolean
  category: Category
  account: Account | null
}
