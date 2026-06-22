import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stats - returns dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const month = searchParams.get('month') // YYYY-MM

    let startDate: Date | undefined
    let endDate: Date | undefined

    if (month) {
      const [year, mon] = month.split('-').map(Number)
      startDate = new Date(year, mon - 1, 1)
      endDate = new Date(year, mon, 0, 23, 59, 59, 999)
    } else {
      if (from) startDate = new Date(from)
      if (to) endDate = new Date(to)
    }

    const where: Record<string, unknown> = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, unknown>).gte = startDate
      if (endDate) (where.date as Record<string, unknown>).lte = endDate
    }

    const [transactions, allTransactions, accounts] = await Promise.all([
      db.transaction.findMany({
        where,
        include: { category: true, account: true },
        orderBy: { date: 'desc' },
      }),
      db.transaction.findMany({ select: { amount: true, type: true, date: true } }),
      db.account.findMany({
        include: {
          transactions: { select: { type: true, amount: true } },
        },
      }),
    ])

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpense

    // Group by category for the pie chart
    const categoryMap = new Map<
      string,
      { name: string; color: string; icon: string; type: string; total: number; count: number }
    >()

    for (const t of transactions) {
      const key = t.categoryId
      const existing = categoryMap.get(key)
      if (existing) {
        existing.total += t.amount
        existing.count += 1
      } else {
        categoryMap.set(key, {
          name: t.category.name,
          color: t.category.color,
          icon: t.category.icon,
          type: t.type,
          total: t.amount,
          count: 1,
        })
      }
    }

    const byCategory = Array.from(categoryMap.values()).sort(
      (a, b) => b.total - a.total
    )

    // Build monthly trend for the last 6 months
    const now = new Date()
    const months: { label: string; year: number; month: number; income: number; expense: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: d.toLocaleDateString('es-AR', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        income: 0,
        expense: 0,
      })
    }

    for (const t of allTransactions) {
      const tDate = new Date(t.date)
      const m = months.find(
        (mo) => mo.year === tDate.getFullYear() && mo.month === tDate.getMonth()
      )
      if (m) {
        if (t.type === 'INCOME') m.income += t.amount
        else m.expense += t.amount
      }
    }

    // Compute balance per account (lifetime, not month-scoped)
    const byAccount = accounts.map((a) => {
      const income = a.transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((s, t) => s + t.amount, 0)
      const expense = a.transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((s, t) => s + t.amount, 0)
      return {
        name: a.name,
        color: a.color,
        type: a.type,
        income,
        expense,
        balance: a.initialBalance + income - expense,
      }
    })

    return NextResponse.json({
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions.length,
      byCategory,
      monthlyTrend: months,
      byAccount,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
