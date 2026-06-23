'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryIcon } from '@/components/category-icon'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDateInput } from '@/lib/format'
import type { Account, Category, Transaction, TransactionType } from '@/lib/types'
import { TrendingUp, TrendingDown, Loader2, Wallet } from 'lucide-react'

const schema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  description: z.string().max(200).optional().default(''),
  date: z.string().min(1, 'La fecha es obligatoria'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  accountId: z.string().optional().default(''),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  accounts: Account[]
  editingTransaction?: Transaction | null
  onSaved: () => void
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  accounts,
  editingTransaction,
  onSaved,
}: Props) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'EXPENSE',
      amount: 0,
      description: '',
      date: formatDateInput(new Date()),
      categoryId: '',
      accountId: '',
    },
  })

  const currentType = watch('type')
  const currentAmount = watch('amount')
  const currentCategoryId = watch('categoryId')
  const currentAccountId = watch('accountId')

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === currentType),
    [categories, currentType]
  )

  useEffect(() => {
    if (editingTransaction) {
      setValue('type', editingTransaction.type)
      setValue('amount', editingTransaction.amount)
      setValue('description', editingTransaction.description)
      setValue('date', formatDateInput(editingTransaction.date))
      setValue('categoryId', editingTransaction.categoryId)
      setValue('accountId', editingTransaction.accountId ?? '')
    } else {
      reset({
        type: 'EXPENSE',
        amount: 0,
        description: '',
        date: formatDateInput(new Date()),
        categoryId: '',
        accountId: '',
      })
    }
  }, [editingTransaction, setValue, reset])

  // Reset categoryId when type changes and current category is not in the filtered list
  useEffect(() => {
    const stillValid = filteredCategories.some((c) => c.id === currentCategoryId)
    if (!stillValid && currentCategoryId) {
      setValue('categoryId', '')
    }
  }, [filteredCategories, currentCategoryId, setValue])

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const url = editingTransaction
        ? `/api/transactions/${editingTransaction.id}`
        : '/api/transactions'
      const method = editingTransaction ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          amount: Number(data.amount),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }

      toast({
        title: editingTransaction ? 'Transacción actualizada' : 'Transacción creada',
        description: `${data.type === 'INCOME' ? 'Ingreso' : 'Gasto'} de ${formatCurrency(Number(data.amount))} registrado correctamente.`,
      })

      onSaved()
      onOpenChange(false)
      reset()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? 'Editar transacción' : 'Nueva transacción'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editingTransaction
              ? 'Modifica los datos de la transacción seleccionada.'
              : 'Completa los datos para registrar una nueva transacción.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Tabs
              value={currentType}
              onValueChange={(v) => setValue('type', v as TransactionType)}
            >
              <TabsList className="grid w-full grid-cols-2 bg-muted/60">
                <TabsTrigger
                  value="EXPENSE"
                  className="gap-2 text-rose-600/80 hover:text-rose-700 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-rose-950/50 dark:data-[state=active]:text-rose-300 dark:text-rose-400/80"
                >
                  <TrendingDown className="h-4 w-4" />
                  Gasto
                </TabsTrigger>
                <TabsTrigger
                  value="INCOME"
                  className="gap-2 text-emerald-600/80 hover:text-emerald-700 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-emerald-950/50 dark:data-[state=active]:text-emerald-300 dark:text-emerald-400/80"
                >
                  <TrendingUp className="h-4 w-4" />
                  Ingreso
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                className="pl-7 text-lg font-semibold"
                {...register('amount')}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
            {currentAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                = {formatCurrency(Number(currentAmount))}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoría</Label>
            <Select
              value={currentCategoryId}
              onValueChange={(v) => setValue('categoryId', v)}
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No hay categorías de este tipo. Crea una primero.
                  </div>
                ) : (
                  filteredCategories.map((c) => (
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
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">Cuenta (opcional)</Label>
            <Select
              value={currentAccountId}
              onValueChange={(v) => setValue('accountId', v === '__none__' ? '' : v)}
            >
              <SelectTrigger id="accountId">
                <SelectValue placeholder="Sin cuenta específica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin cuenta específica</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-md"
                        style={{ backgroundColor: `${a.color}20`, color: a.color }}
                      >
                        <Wallet className="h-3.5 w-3.5" />
                      </span>
                      <span>{a.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {accounts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No tienes cuentas creadas. Puedes crearlas en la pestaña Cuentas.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Ej. Compra en supermercado"
              rows={2}
              {...register('description')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTransaction ? 'Guardar cambios' : 'Agregar transacción'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
