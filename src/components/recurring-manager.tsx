'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { formatCurrency, formatDate, formatDateInput } from '@/lib/format'
import type { Account, Category, RecurringFrequency, RecurringTransaction, TransactionType } from '@/lib/types'
import {
  Plus,
  Pencil,
  Trash2,
  Repeat,
  Loader2,
  Play,
  Pause,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

interface Props {
  recurring: RecurringTransaction[]
  categories: Category[]
  accounts: Account[]
  onSaved: () => void
}

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
}

const WEEKDAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function RecurringManager({ recurring, categories, accounts, onSaved }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringTransaction | null>(null)
  const [toDelete, setToDelete] = useState<RecurringTransaction | null>(null)
  const [posting, setPosting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // form state
  const [type, setType] = useState<TransactionType>('EXPENSE')
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY')
  const [dayOfMonth, setDayOfMonth] = useState<number | ''>('')
  const [dayOfWeek, setDayOfWeek] = useState<number | ''>('')
  const [startDate, setStartDate] = useState(formatDateInput(new Date()))
  const [endDate, setEndDate] = useState('')

  const filteredCategories = categories.filter((c) => c.type === type)

  const resetForm = () => {
    setType('EXPENSE')
    setAmount(0)
    setDescription('')
    setCategoryId('')
    setAccountId('')
    setFrequency('MONTHLY')
    setDayOfMonth('')
    setDayOfWeek('')
    setStartDate(formatDateInput(new Date()))
    setEndDate('')
  }

  const openCreate = () => {
    setEditing(null)
    resetForm()
    setOpen(true)
  }

  const openEdit = (r: RecurringTransaction) => {
    setEditing(r)
    setType(r.type)
    setAmount(r.amount)
    setDescription(r.description)
    setCategoryId(r.categoryId)
    setAccountId(r.accountId ?? '')
    setFrequency(r.frequency)
    setDayOfMonth(r.dayOfMonth ?? '')
    setDayOfWeek(r.dayOfWeek ?? '')
    setStartDate(formatDateInput(r.startDate))
    setEndDate(r.endDate ? formatDateInput(r.endDate) : '')
    setOpen(true)
  }

  // Reset category when type changes
  useEffect(() => {
    const stillValid = filteredCategories.some((c) => c.id === categoryId)
    if (!stillValid) setCategoryId('')
  }, [type, filteredCategories, categoryId])

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toast({ title: 'El monto debe ser positivo', variant: 'destructive' })
      return
    }
    if (!categoryId) {
      toast({ title: 'Selecciona una categoría', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: Number(amount),
          description,
          categoryId,
          accountId: accountId || null,
          frequency,
          dayOfMonth: dayOfMonth === '' ? null : Number(dayOfMonth),
          dayOfWeek: dayOfWeek === '' ? null : Number(dayOfWeek),
          startDate,
          endDate: endDate || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }
      toast({
        title: 'Transacción recurrente creada',
        description: 'Se procesará automáticamente según la frecuencia configurada.',
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

  const handleToggle = async (r: RecurringTransaction) => {
    try {
      const res = await fetch(`/api/recurring/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !r.active }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      toast({
        title: r.active ? 'Recurrente pausada' : 'Recurrente reactivada',
      })
      onSaved()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/recurring/${toDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast({ title: 'Transacción recurrente eliminada' })
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

  const handlePostDue = async () => {
    setPosting(true)
    try {
      const res = await fetch('/api/recurring/post-due', { method: 'POST' })
      if (!res.ok) throw new Error('Error al procesar')
      const data = await res.json()
      toast({ title: 'Procesado', description: data.message })
      onSaved()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: 'destructive',
      })
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {recurring.length} transacción(es) recurrente(s) ·{' '}
          {recurring.filter((r) => r.active).length} activa(s)
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePostDue} disabled={posting}>
            {posting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Procesar pendientes
          </Button>
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nueva recurrente
          </Button>
        </div>
      </div>

      {recurring.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Repeat className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No tienes transacciones recurrentes</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Automatiza ingresos o gastos que se repiten (salario, alquiler, suscripciones, etc.).
                Se procesarán automáticamente cuando llegue la fecha.
              </p>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Crear primera recurrente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recurring.map((r) => (
            <Card key={r.id} className="group">
              <CardContent className="flex items-center gap-3 p-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                    r.type === 'INCOME'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-rose-100 dark:bg-rose-900/30'
                  }`}
                >
                  {r.type === 'INCOME' ? (
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {r.description || r.category.name}
                    </span>
                    <Badge variant="outline" className="hidden sm:inline-flex text-xs gap-1">
                      <CategoryIcon name={r.category.icon} className="h-3 w-3" />
                      {r.category.name}
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Repeat className="h-3 w-3" />
                      {FREQUENCY_LABELS[r.frequency]}
                    </Badge>
                    {r.account && (
                      <Badge variant="outline" className="hidden md:inline-flex text-xs">
                        {r.account.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Próxima: {formatDate(r.nextDue)}
                    </span>
                    {r.endDate && (
                      <span>Hasta: {formatDate(r.endDate)}</span>
                    )}
                    {!r.active && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Pausada
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`font-semibold tabular-nums ${
                      r.type === 'INCOME'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {r.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(r.amount)}
                  </span>
                  <div className="flex gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleToggle(r)}
                      title={r.active ? 'Pausar' : 'Reactivar'}
                    >
                      {r.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(r)}
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setToDelete(r)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar recurrente' : 'Nueva transacción recurrente'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Configura un ingreso o gasto que se repite automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="EXPENSE" className="gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Gasto
                  </TabsTrigger>
                  <TabsTrigger value="INCOME" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Ingreso
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="r-amount">Monto</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    $
                  </span>
                  <Input
                    id="r-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="pl-7 font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-cat">Categoría</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="r-cat">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-account">Cuenta (opcional)</Label>
              <Select
                value={accountId}
                onValueChange={(v) => setAccountId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger id="r-account">
                  <SelectValue placeholder="Sin cuenta específica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin cuenta específica</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="r-desc">Descripción (opcional)</Label>
              <Input
                id="r-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Sueldo mensual"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Diaria</SelectItem>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="MONTHLY">Mensual</SelectItem>
                    <SelectItem value="YEARLY">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {frequency === 'MONTHLY' || frequency === 'YEARLY' ? (
                <div className="space-y-2">
                  <Label htmlFor="r-day">Día del mes</Label>
                  <Input
                    id="r-day"
                    type="number"
                    min="1"
                    max="28"
                    placeholder="Ej. 1, 15"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              ) : frequency === 'WEEKLY' ? (
                <div className="space-y-2">
                  <Label>Día de la semana</Label>
                  <Select
                    value={dayOfWeek === '' ? '' : String(dayOfWeek)}
                    onValueChange={(v) => setDayOfWeek(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cualquiera" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAY_LABELS.map((d, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="r-start">Fecha de inicio</Label>
                <Input
                  id="r-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-end">Fecha fin (opcional)</Label>
                <Input
                  id="r-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
              {editing ? 'Guardar cambios' : 'Crear recurrente'}
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
            <AlertDialogTitle>¿Eliminar recurrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la transacción recurrente &ldquo;{toDelete?.description || toDelete?.category?.name}&rdquo;.
              Las transacciones ya generadas no se verán afectadas.
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
