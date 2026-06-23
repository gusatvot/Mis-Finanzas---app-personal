import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// GET /api/transactions - list with optional filters
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // INCOME | EXPENSE
    const categoryId = searchParams.get('categoryId')
    const accountId = searchParams.get('accountId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '0')

    const where: Record<string, unknown> = { userId }
    if (type) where.type = type
    if (categoryId) where.categoryId = categoryId
    if (accountId) where.accountId = accountId
    if (from || to) {
      where.date = {}
      if (from) (where.date as Record<string, unknown>).gte = new Date(from)
      if (to) (where.date as Record<string, unknown>).lte = new Date(to)
    }
    if (search) {
      where.description = { contains: search }
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { category: true, account: true },
      ...(limit > 0 ? { take: limit } : {}),
    })

    // Normalize Decimal fields for JSON serialization
    const result = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      category: t.category,
      account: t.account
        ? { ...t.account, initialBalance: Number(t.account.initialBalance) }
        : null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Error al obtener transacciones' },
      { status: 500 }
    )
  }
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { type, amount, description, date, categoryId, accountId } = body

    if (!type || !amount || !date || !categoryId) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return NextResponse.json(
        { error: 'Tipo debe ser INCOME o EXPENSE' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser un número positivo' },
        { status: 400 }
      )
    }

    // Make sure the category belongs to the user
    const category = await db.category.findFirst({
      where: { id: categoryId, userId },
    })
    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 400 }
      )
    }

    // If accountId provided, make sure it belongs to the user
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

    const transaction = await db.transaction.create({
      data: {
        type,
        amount,
        description: (description || '').trim(),
        date: new Date(date),
        categoryId,
        accountId: accountId || null,
        userId,
      },
      include: { category: true, account: true },
    })

    const result = {
      ...transaction,
      amount: Number(transaction.amount),
      account: transaction.account
        ? { ...transaction.account, initialBalance: Number(transaction.account.initialBalance) }
        : null,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Error al crear transacción' },
      { status: 500 }
    )
  }
}
