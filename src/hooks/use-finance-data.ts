'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Category, Transaction, Stats } from '@/lib/types'

export function useFinanceData(month: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [catsRes, txRes, statsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/transactions'),
        fetch(`/api/stats?month=${month}`),
      ])

      if (!catsRes.ok || !txRes.ok || !statsRes.ok) {
        throw new Error('Error al cargar los datos')
      }

      const [cats, txs, st] = await Promise.all([
        catsRes.json(),
        txRes.json(),
        statsRes.json(),
      ])

      setCategories(cats)
      setTransactions(txs)
      setStats(st)
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
    transactions,
    stats,
    loading,
    error,
    reload: loadAll,
  }
}
