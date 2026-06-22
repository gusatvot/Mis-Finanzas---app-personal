'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryIcon } from '@/components/category-icon'
import { formatCurrency, formatCurrencyShort } from '@/lib/format'
import type { Stats } from '@/lib/types'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Inbox } from 'lucide-react'

interface Props {
  stats: Stats | null
}

export function DashboardStats({ stats }: Props) {
  const expenseByCategory = useMemo(
    () => stats?.byCategory.filter((c) => c.type === 'EXPENSE') ?? [],
    [stats]
  )
  const incomeByCategory = useMemo(
    () => stats?.byCategory.filter((c) => c.type === 'INCOME') ?? [],
    [stats]
  )

  const trendData = useMemo(
    () =>
      (stats?.monthlyTrend ?? []).map((m) => ({
        label: m.label,
        Ingresos: m.income,
        Gastos: m.expense,
        Balance: m.income - m.expense,
      })),
    [stats]
  )

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.transactionCount} transacciones en el período
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-rose-200 bg-gradient-to-br from-rose-50 to-white dark:border-rose-900/50 dark:from-rose-950/30 dark:to-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gastos
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40">
              <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 tabular-nums">
              {formatCurrency(stats.totalExpense)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {expenseByCategory.length} categorías distintas
            </p>
          </CardContent>
        </Card>

        <Card
          className={`overflow-hidden border-2 ${
            stats.balance >= 0
              ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-800 dark:from-emerald-950/30 dark:to-card'
              : 'border-rose-300 bg-gradient-to-br from-rose-50 to-white dark:border-rose-800 dark:from-rose-950/30 dark:to-card'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                stats.balance >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/40'
                  : 'bg-rose-100 dark:bg-rose-900/40'
              }`}
            >
              <Wallet
                className={`h-4 w-4 ${
                  stats.balance >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold tabular-nums ${
                stats.balance >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {formatCurrency(stats.balance)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.balance >= 0 ? 'Superávit' : 'Déficit'} en el período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PiggyBank className="h-4 w-4 text-primary" />
            Tendencia de los últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  className="text-xs"
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  className="text-xs"
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrencyShort(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Area
                  type="monotone"
                  dataKey="Ingresos"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="Gastos"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryBreakdown
          title="Gastos por categoría"
          data={expenseByCategory}
          total={stats.totalExpense}
          emptyText="Sin gastos registrados"
        />
        <CategoryBreakdown
          title="Ingresos por categoría"
          data={incomeByCategory}
          total={stats.totalIncome}
          emptyText="Sin ingresos registrados"
        />
      </div>
    </div>
  )
}

function CategoryBreakdown({
  title,
  data,
  total,
  emptyText,
}: {
  title: string
  data: Stats['byCategory']
  total: number
  emptyText: string
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="mx-auto h-[180px] w-[180px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(v: number) => formatCurrency(v)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2">
            {data.slice(0, 6).map((c) => {
              const pct = total > 0 ? (c.total / total) * 100 : 0
              return (
                <div key={c.name} className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${c.color}20`, color: c.color }}
                  >
                    <CategoryIcon name={c.icon ?? 'Wallet'} className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{c.name}</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(c.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: c.color,
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
