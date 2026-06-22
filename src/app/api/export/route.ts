import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/export?month=YYYY-MM
// Returns CSV with all transactions for the given month (or all if no month)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')

    const where: Record<string, unknown> = {}
    if (month) {
      const [year, mon] = month.split('-').map(Number)
      const startDate = new Date(year, mon - 1, 1)
      const endDate = new Date(year, mon, 0, 23, 59, 59, 999)
      where.date = { gte: startDate, lte: endDate }
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { category: true, account: true },
    })

    const headers = [
      'Fecha',
      'Tipo',
      'Monto',
      'Categoria',
      'Cuenta',
      'Descripcion',
    ]

    const escapeCsv = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return ''
      const s = String(val)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }

    const rows = transactions.map((t) => {
      const date = new Date(t.date).toLocaleDateString('es-AR')
      const type = t.type === 'INCOME' ? 'Ingreso' : 'Gasto'
      const amount = t.amount.toFixed(2)
      const category = t.category?.name ?? ''
      const account = t.account?.name ?? ''
      const description = t.description ?? ''
      return [date, type, amount, category, account, description]
        .map(escapeCsv)
        .join(',')
    })

    const csv = [headers.join(','), ...rows].join('\r\n')

    const fileName = month
      ? `transacciones_${month}.csv`
      : `transacciones_${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse('\ufeff' + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json(
      { error: 'Error al exportar CSV' },
      { status: 500 }
    )
  }
}
