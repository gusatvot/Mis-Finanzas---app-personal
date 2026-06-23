import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// GET /api/accounts - list all accounts with computed balance
export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const accounts = await db.account.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: {
        transactions: { select: { type: true, amount: true } },
        _count: { select: { transactions: true } },
      },
    })

    const result = accounts.map((a) => {
      const income = a.transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((s, t) => s + Number(t.amount), 0)
      const expense = a.transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((s, t) => s + Number(t.amount), 0)
      const balance = Number(a.initialBalance) + income - expense
      return {
        id: a.id,
        name: a.name,
        type: a.type,
        color: a.color,
        initialBalance: Number(a.initialBalance),
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        _count: a._count,
        balance,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Error al obtener cuentas' },
      { status: 500 }
    )
  }
}

// POST /api/accounts
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, type, color, initialBalance } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Nombre y tipo son obligatorios' },
        { status: 400 }
      )
    }

    if (!['CASH', 'BANK', 'CARD'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo debe ser CASH, BANK o CARD' },
        { status: 400 }
      )
    }

    const account = await db.account.create({
      data: {
        name: name.trim(),
        type,
        color: color || '#64748b',
        initialBalance: typeof initialBalance === 'number' ? initialBalance : 0,
        userId,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Error al crear cuenta' },
      { status: 500 }
    )
  }
}
