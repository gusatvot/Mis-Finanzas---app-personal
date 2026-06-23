'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CategoryIcon } from '@/components/category-icon'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Category, Transaction } from '@/lib/types'
import { Search, Pencil, Trash2, TrendingUp, TrendingDown, Inbox, Wallet } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'

interface Props {
  transactions: Transaction[]
  categories: Category[]
  onEdit: (t: Transaction) => void
  onDeleted: () => void
}

export function TransactionList({ transactions, categories, onEdit, onDeleted }: Props) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [toDelete, setToDelete] = useState<Transaction | null>(null)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false
      if (categoryFilter !== 'ALL' && t.categoryId !== categoryFilter) return false
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [transactions, search, typeFilter, categoryFilter])

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/transactions/${toDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast({ title: 'Transacción eliminada' })
      onDeleted()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="INCOME">Ingresos</SelectItem>
            <SelectItem value="EXPENSE">Gastos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No hay transacciones</p>
            <p className="text-sm text-muted-foreground">
              {transactions.length === 0
                ? 'Agrega tu primera transacción para comenzar.'
                : 'Ningún resultado coincide con los filtros.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="max-h-[640px] overflow-y-auto pr-1 -mr-1 space-y-2 custom-scroll">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${t.category.color}20`,
                  color: t.category.color,
                }}
              >
                <CategoryIcon name={t.category.icon} className="h-5 w-5" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {t.description || t.category.name}
                  </p>
                  <Badge variant="outline" className="hidden sm:inline-flex text-xs">
                    {t.category.name}
                  </Badge>
                  {t.account && (
                    <Badge
                      variant="outline"
                      className="hidden md:inline-flex text-xs gap-1"
                      style={{ color: t.account.color, borderColor: `${t.account.color}40` }}
                    >
                      <Wallet className="h-3 w-3" />
                      {t.account.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <span
                    className={`flex items-center gap-1 font-semibold tabular-nums ${
                      t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {t.type === 'INCOME' ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {t.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </span>
                </div>

                <div className="flex flex-col gap-1 sm:flex-row sm:gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-60 group-hover:opacity-100"
                    onClick={() => onEdit(t)}
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive opacity-60 group-hover:opacity-100 hover:text-destructive"
                    onClick={() => setToDelete(t)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente{' '}
              {toDelete?.description ? `"${toDelete.description}"` : 'la transacción'} de{' '}
              {toDelete && formatCurrency(toDelete.amount)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
