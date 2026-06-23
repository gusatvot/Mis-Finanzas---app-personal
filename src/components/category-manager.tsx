'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryIcon, AVAILABLE_ICONS } from '@/components/category-icon'
import { useToast } from '@/hooks/use-toast'
import type { Category, TransactionType } from '@/lib/types'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'

interface Props {
  categories: Category[]
  onSaved: () => void
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#6366f1',
  '#a855f7', '#ec4899', '#64748b',
]

export function CategoryManager({ categories, onSaved }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [toDelete, setToDelete] = useState<Category | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('EXPENSE')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [icon, setIcon] = useState('Wallet')
  const [submitting, setSubmitting] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setType('EXPENSE')
    setColor(PRESET_COLORS[0])
    setIcon('Wallet')
    setOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setName(c.name)
    setType(c.type)
    setColor(c.color)
    setIcon(c.icon)
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'El nombre es obligatorio', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const url = editing ? `/api/categories/${editing.id}` : '/api/categories'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type, color, icon }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }
      toast({
        title: editing ? 'Categoría actualizada' : 'Categoría creada',
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
      const res = await fetch(`/api/categories/${toDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar')
      }
      toast({ title: 'Categoría eliminada' })
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

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE')
  const incomeCategories = categories.filter((c) => c.type === 'INCOME')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} categorías en total
        </p>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900/30">
                <Tag className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              </span>
              Gastos
              <Badge variant="secondary" className="ml-auto">{expenseCategories.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseCategories.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay categorías de gastos.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {expenseCategories.map((c) => (
                  <CategoryCard
                    key={c.id}
                    category={c}
                    onEdit={() => openEdit(c)}
                    onDelete={() => setToDelete(c)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <Tag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </span>
              Ingresos
              <Badge variant="secondary" className="ml-auto">{incomeCategories.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeCategories.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay categorías de ingresos.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {incomeCategories.map((c) => (
                  <CategoryCard
                    key={c.id}
                    category={c}
                    onEdit={() => openEdit(c)}
                    onDelete={() => setToDelete(c)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar categoría' : 'Nueva categoría'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
                <TabsList className="grid w-full grid-cols-2 bg-muted/60">
                  <TabsTrigger
                    value="EXPENSE"
                    className="text-rose-600/80 hover:text-rose-700 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-rose-950/50 dark:data-[state=active]:text-rose-300 dark:text-rose-400/80"
                  >
                    Gasto
                  </TabsTrigger>
                  <TabsTrigger
                    value="INCOME"
                    className="text-emerald-600/80 hover:text-emerald-700 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-emerald-950/50 dark:data-[state=active]:text-emerald-300 dark:text-emerald-400/80"
                  >
                    Ingreso
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-name">Nombre</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Suscripciones"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-110 border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ícono</Label>
              <div className="grid max-h-32 grid-cols-7 gap-1 overflow-y-auto rounded border p-2 custom-scroll sm:grid-cols-9">
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
                      icon === ic ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                    title={ic}
                  >
                    <CategoryIcon name={ic} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">Vista previa</div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  <CategoryIcon name={icon} className="h-4 w-4" />
                </span>
                <span className="font-medium">{name || 'Nombre de la categoría'}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {editing ? 'Guardar cambios' : 'Crear categoría'}
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
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?._count?.transactions
                ? `Esta categoría tiene ${toDelete._count.transactions} transacciones asociadas y no se puede eliminar.`
                : `Se eliminará permanentemente "${toDelete?.name}". Esta acción no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!toDelete?._count?.transactions}
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

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border bg-card p-2.5 transition-colors hover:bg-accent/40">
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${category.color}20`, color: category.color }}
      >
        <CategoryIcon name={category.icon} className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{category.name}</span>
        {category._count && (
          <span className="text-xs text-muted-foreground">
            {category._count.transactions} transacciones
          </span>
        )}
      </div>
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={onDelete}
          disabled={!!category._count?.transactions}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
