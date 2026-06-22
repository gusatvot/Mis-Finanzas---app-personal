'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Account, Budget, Category, RecurringTransaction, Transaction, Stats } from '@/lib/types'

export function useFinanceData(month: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        catsRes,
        accsRes,
        txRes,
        statsRes,
        budgetsRes,
        recurringRes,
      ] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/accounts'),
        fetch('/api/transactions'),
        fetch(`/api/stats?month=${month}`),
        fetch(`/api/budgets?month=${month}`),
        fetch('/api/recurring'),
      ])

      if (!catsRes.ok || !txRes.ok || !statsRes.ok) {
        throw new Error('Error al cargar los datos principales')
      }

      const [cats, accs, txs, st] = await Promise.all([
        catsRes.json(),
        accsRes.json(),
        txRes.json(),
        statsRes.json(),
      ])
      const bgs = budgetsRes.ok ? await budgetsRes.json() : []
      const recs = recurringRes.ok ? await recurringRes.json() : []

      setCategories(cats)
      setAccounts(accs)
      setTransactions(txs)
      setStats(st)
      setBudgets(bgs)
      setRecurring(recs)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  return {
    categories,
    accounts,
    transactions,
    stats,
    budgets,
    recurring,
    loading,
    error,
    reload: loadAll,
  }
}
