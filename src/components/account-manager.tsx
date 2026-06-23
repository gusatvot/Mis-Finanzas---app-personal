'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/format'
import type { Account, AccountType } from '@/lib/types'
import {
  Plus,
  Pencil,
  Trash2,
  Banknote,
  Landmark,
  CreditCard,
  Wallet,
  Loader2,
} from 'lucide-react'

interface Props {
  accounts: Account[]
  onSaved: () => void
}

const PRESET_COLORS = [
  '#10b981', '#14b8a6', '#0ea5e9', '#6366f1',
  '#a855f7', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#06b6d4', '#64748b',
]

const ACCOUNT_TYPE_META: Record<AccountType, { label: string; icon: typeof Banknote }> = {
  CASH: { label: 'Efectivo', icon: Banknote },
  BANK: { label: 'Banco', icon: Landmark },
  CARD: { label: 'Tarjeta', icon: CreditCard },
}

export function AccountManager({ accounts, onSaved }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [toDelete, setToDelete] = useState<Account | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('CASH')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [initialBalance, setInitialBalance] = useState(0)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setType('CASH')
    setColor(PRESET_COLORS[0])
    setInitialBalance(0)
    setOpen(true)
  }

  const openEdit = (a: Account) => {
    setEditing(a)
    setName(a.name)
    setType(a.type)
    setColor(a.color)
    setInitialBalance(a.initialBalance)
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'El nombre es obligatorio', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const url = editing ? `/api/accounts/${editing.id}` : '/api/accounts'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          color,
          initialBalance: Number(initialBalance),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }
      toast({
        title: editing ? 'Cuenta actualizada' : 'Cuenta creada',
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
      const res = await fetch(`/api/accounts/${toDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar')
      }
      toast({ title: 'Cuenta eliminada' })
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

  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {accounts.length} cuenta(s) · Saldo total:{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(totalBalance)}
            </span>
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nueva cuenta
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No tienes cuentas creadas</p>
              <p className="text-sm text-muted-foreground">
                Crea una cuenta de efectivo, banco o tarjeta para asociar tus transacciones.
              </p>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Crear primera cuenta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => {
            const Icon = ACCOUNT_TYPE_META[a.type]?.icon ?? Wallet
            const isPositive = (a.balance ?? 0) >= 0
            return (
              <Card
                key={a.id}
                className="group relative overflow-hidden transition-shadow hover:shadow-md"
              >
                <div
                  className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full opacity-20 blur-2xl"
                  style={{ backgroundColor: a.color }}
                />
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${a.color}20`, color: a.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <CardTitle className="text-base">{a.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {ACCOUNT_TYPE_META[a.type]?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(a)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setToDelete(a)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">Saldo actual</div>
                  <div
                    className={`text-2xl font-bold tabular-nums ${
                      isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCurrency(a.balance ?? 0)}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Saldo inicial: {formatCurrency(a.initialBalance)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar cuenta' : 'Nueva cuenta'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editing ? 'Modifica los datos de la cuenta.' : 'Crea una nueva cuenta para asociar a tus transacciones.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de cuenta</Label>
              <Tabs value={type} onValueChange={(v) => setType(v as AccountType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="CASH" className="gap-1.5">
                    <Banknote className="h-3.5 w-3.5" />
                    Efectivo
                  </TabsTrigger>
                  <TabsTrigger value="BANK" className="gap-1.5">
                    <Landmark className="h-3.5 w-3.5" />
                    Banco
                  </TabsTrigger>
                  <TabsTrigger value="CARD" className="gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    Tarjeta
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="acc-name">Nombre</Label>
              <Input
                id="acc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'CASH' ? 'Ej. Billetera' : type === 'BANK' ? 'Ej. Cuenta sueldo' : 'Ej. Visa'}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acc-balance">Saldo inicial</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  $
                </span>
                <Input
                  id="acc-balance"
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(Number(e.target.value))}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Para tarjetas podés usar un valor negativo para representar deuda.
              </p>
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Crear cuenta'}
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
            <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la cuenta &ldquo;{toDelete?.name}&rdquo;. Las transacciones asociadas
              quedarán sin cuenta (no se borran).
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
