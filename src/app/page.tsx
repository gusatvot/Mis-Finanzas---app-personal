'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { TransactionFormDialog } from '@/components/transaction-form-dialog'
import { TransactionList } from '@/components/transaction-list'
import { DashboardStats } from '@/components/dashboard-stats'
import { CategoryManager } from '@/components/category-manager'
import { useFinanceData } from '@/hooks/use-finance-data'
import { useToast } from '@/hooks/use-toast'
import { monthKey, monthLabel } from '@/lib/format'
import type { Transaction } from '@/lib/types'
import {
  Plus,
  Wallet,
  LayoutDashboard,
  Receipt,
  Tags,
  AlertCircle,
  Sparkles,
  Trash2,
} from 'lucide-react'

const MONTH_OPTIONS = (() => {
  const arr: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    arr.push({
      value: monthKey(d),
      label: monthLabel(d),
    })
  }
  return arr
})()

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState(monthKey())
  const [tab, setTab] = useState('dashboard')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const { toast } = useToast()

  const { categories, transactions, stats, loading, error, reload } =
    useFinanceData(selectedMonth)

  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return key === selectedMonth
    })
  }, [transactions, selectedMonth])

  const handleEdit = (t: Transaction) => {
    setEditingTx(t)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setEditingTx(null)
    setDialogOpen(true)
  }

  const handleSeed = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || err.error || 'Error al sembrar')
      }
      toast({
        title: 'Datos de ejemplo cargados',
        description: 'Se crearon categorías y transacciones de demostración.',
      })
      reload()
    } catch (err) {
      toast({
        title: 'No se pudo sembrar',
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold leading-tight">Mis Finanzas</h1>
              <p className="text-xs text-muted-foreground leading-tight">
                Contabilidad personal
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[160px] sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleNew} size="sm" className="hidden sm:inline-flex">
              <Plus className="mr-2 h-4 w-4" />
              Nueva
            </Button>
            <Button onClick={handleNew} size="icon" className="sm:hidden">
              <Plus className="h-4 w-4" />
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto flex-1 px-4 py-6">
        {error ? (
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div>
                <p className="font-medium">No se pudieron cargar los datos</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={reload} variant="outline" size="sm">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <LoadingState />
        ) : categories.length === 0 ? (
          <EmptyState onSeed={handleSeed} />
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Resumen</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Transacciones</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
                <Tags className="h-4 w-4" />
                <span className="hidden sm:inline">Categorías</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 outline-none">
              <DashboardStats stats={stats} />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6 outline-none">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Transacciones de {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {monthTransactions.length} registros
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionList
                    transactions={monthTransactions}
                    categories={categories}
                    onEdit={handleEdit}
                    onDeleted={reload}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6 outline-none">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gestión de categorías</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryManager categories={categories} onSaved={reload} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          Mis Finanzas · Hecho para llevar tu contabilidad personal · Los datos se guardan localmente
        </div>
      </footer>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingTx(null)
        }}
        categories={categories}
        editingTransaction={editingTx}
        onSaved={reload}
      />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[340px] rounded-xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  )
}

function EmptyState({ onSeed }: { onSeed: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div className="max-w-md space-y-1">
          <h2 className="text-xl font-bold">¡Bienvenido a Mis Finanzas!</h2>
          <p className="text-sm text-muted-foreground">
            Para empezar, puedes cargar tus propias categorías desde la pestaña
            “Categorías”, o crear datos de ejemplo para ver cómo funciona la app.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onSeed}>
            <Sparkles className="mr-2 h-4 w-4" />
            Crear datos de ejemplo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
