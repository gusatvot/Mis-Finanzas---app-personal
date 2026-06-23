import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// GET /api/recurring
export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const recurring = await db.recurringTransaction.findMany({
      where: { userId },
      orderBy: [{ active: 'desc' }, { nextDue: 'asc' }],
      include: { category: true, account: true },
    })

    const result = recurring.map((r) => ({
      ...r,
      amount: Number(r.amount),
      account: r.account
        ? { ...r.account, initialBalance: Number(r.account.initialBalance) }
        : null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching recurring transactions:', error)
    return NextResponse.json(
      { error: 'Error al obtener transacciones recurrentes' },
      { status: 500 }
    )
  }
}

// POST /api/recurring
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const {
      type,
      amount,
      description,
      categoryId,
      accountId,
      frequency,
      dayOfMonth,
      dayOfWeek,
      startDate,
      endDate,
    } = body

    if (!type || !amount || !categoryId || !frequency || !startDate) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo debe ser INCOME o EXPENSE' },
        { status: 400 }
      )
    }

    if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Frecuencia inválida' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser positivo' },
        { status: 400 }
      )
    }

    // Verify the category belongs to the user
    const category = await db.category.findFirst({
      where: { id: categoryId, userId },
    })
    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 400 }
      )
    }

    // Verify the account if provided
    if (accountId) {
      const account = await db.account.findFirst({
        where: { id: accountId, userId },
      })
      if (!account) {
        return NextResponse.json(
          { error: 'Cuenta no encontrada' },
          { status: 400 }
        )
      }
    }

    const start = new Date(startDate)
    const nextDue = computeNextDue(start, frequency, dayOfMonth, dayOfWeek)

    const recurring = await db.recurringTransaction.create({
      data: {
        type,
        amount,
        description: (description || '').trim(),
        categoryId,
        accountId: accountId || null,
        frequency,
        dayOfMonth: dayOfMonth ?? null,
        dayOfWeek: dayOfWeek ?? null,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        nextDue,
        active: true,
        userId,
      },
      include: { category: true, account: true },
    })

    const result = {
      ...recurring,
      amount: Number(recurring.amount),
      account: recurring.account
        ? { ...recurring.account, initialBalance: Number(recurring.account.initialBalance) }
        : null,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating recurring transaction:', error)
    return NextResponse.json(
      { error: 'Error al crear transacción recurrente' },
      { status: 500 }
    )
  }
}

function computeNextDue(
  from: Date,
  frequency: string,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null
): Date {
  const d = new Date(from)
  if (frequency === 'DAILY') {
    d.setDate(d.getDate() + 1)
  } else if (frequency === 'WEEKLY') {
    d.setDate(d.getDate() + 7)
    if (dayOfWeek != null) {
      const cur = d.getDay()
      let diff = (dayOfWeek - cur + 7) % 7
      d.setDate(d.getDate() + diff)
    }
  } else if (frequency === 'MONTHLY') {
    d.setMonth(d.getMonth() + 1)
    if (dayOfMonth != null) {
      d.setDate(Math.min(dayOfMonth, 28))
    }
  } else if (frequency === 'YEARLY') {
    d.setFullYear(d.getFullYear() + 1)
    if (dayOfMonth != null) {
      d.setDate(Math.min(dayOfMonth, 28))
    }
  }
  return d
}
