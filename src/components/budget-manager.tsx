'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { CategoryIcon } from '@/components/category-icon'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, monthLabel } from '@/lib/format'
import type { Budget, Category } from '@/lib/types'
import { Plus, Pencil, Trash2, Target, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Props {
  budgets: Budget[]
  categories: Category[]
  month: string
  onSaved: () => void
}

export function BudgetManager({ budgets, categories, month, onSaved }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [toDelete, setToDelete] = useState<Budget | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState(0)

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE')

  const openCreate = () => {
    setEditing(null)
    setCategoryId(expenseCategories[0]?.id ?? '')
    setAmount(0)
    setOpen(true)
  }

  const openEdit = (b: Budget) => {
    setEditing(b)
    setCategoryId(b.categoryId)
    setAmount(b.amount)
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!categoryId) {
      toast({ title: 'Selecciona una categoría', variant: 'destructive' })
      return
    }
    if (amount <= 0) {
      toast({ title: 'El monto debe ser positivo', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, month, amount: Number(amount) }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }
      toast({
        title: editing ? 'Presupuesto actualizado' : 'Presupuesto creado',
      })
      onSaved()
      setOpen(false)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/budgets/${toDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast({ title: 'Presupuesto eliminado' })
      onSaved()
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

  // Update category when opening edit
  useEffect(() => {
    if (editing) {
      setCategoryId(editing.categoryId)
      setAmount(editing.amount)
    }
  }, [editing])

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0)
  const pctTotal = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Presupuestos de {monthLabel(new Date(month + '-01'))}
          </p>
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{formatCurrency(totalSpent)}</span>
            {' / '}
            <span className="font-semibold text-foreground">{formatCurrency(totalBudget)}</span>
          </p>
        </div>
        <Button onClick={openCreate} size="sm" disabled={expenseCategories.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo presupuesto
        </Button>
      </div>

      {expenseCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Target className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No hay categorías de gasto</p>
              <p className="text-sm text-muted-foreground">
                Primero crea categorías de gasto en la pestaña Categorías.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Target className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No hay presupuestos para este mes</p>
              <p className="text-sm text-muted-foreground">
                Crea un presupuesto para cada categoría de gasto y controla cuánto llevas gastado.
              </p>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Crear primer presupuesto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Overall progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progreso total del mes</span>
                <span className="tabular-nums text-muted-foreground">
                  {pctTotal.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={pctTotal}
                className="mt-2 h-2"
                indicatorColor={
                  pctTotal >= 100
                    ? 'bg-rose-500'
                    : pctTotal >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }
              />
            </CardContent>
          </Card>

          {/* Per-category budgets */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {budgets.map((b) => {
              const spent = b.spent ?? 0
              const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0
              const remaining = b.amount - spent
              const over = spent > b.amount
              return (
                <Card key={b.id} className="group">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${b.category.color}20`, color: b.category.color }}
                      >
                        <CategoryIcon name={b.category.icon} className="h-4 w-4" />
                      </span>
                      <div>
                        <CardTitle className="text-sm">{b.category.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {over ? (
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                              Excedido por {formatCurrency(spent - b.amount)}
                            </span>
                          ) : (
                            <>Quedan {formatCurrency(remaining)}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(b)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setToDelete(b)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm tabular-nums">
                        <span className={over ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'font-semibold'}>
                          {formatCurrency(spent)}
                        </span>
                        <span className="text-muted-foreground"> / {formatCurrency(b.amount)}</span>
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          over
                            ? 'border-rose-300 text-rose-600 dark:border-rose-800 dark:text-rose-400'
                            : pct >= 80
                            ? 'border-amber-300 text-amber-600 dark:border-amber-800 dark:text-amber-400'
                            : 'border-emerald-300 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400'
                        }
                      >
                        {over ? (
                          <>
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {pct.toFixed(0)}%
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {pct.toFixed(0)}%
                          </>
                        )}
                      </Badge>
                    </div>
                    <Progress
                      value={Math.min(pct, 100)}
                      className="mt-2 h-1.5"
                      indicatorColor={
                        over
                          ? 'bg-rose-500'
                          : pct >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Define cuánto planeás gastar en una categoría este mes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-md"
                          style={{ backgroundColor: `${c.color}20`, color: c.color }}
                        >
                          <CategoryIcon name={c.icon} className="h-3.5 w-3.5" />
                        </span>
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editing && (
                <p className="text-xs text-muted-foreground">
                  No se puede cambiar la categoría de un presupuesto existente.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-amount">Monto presupuestado</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  $
                </span>
                <Input
                  id="budget-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="pl-7 text-lg font-semibold"
                  autoFocus
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Crear presupuesto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el presupuesto de &ldquo;{toDelete?.category?.name}&rdquo; para este mes.
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
