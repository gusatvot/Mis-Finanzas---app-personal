import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// GET /api/budgets?month=YYYY-MM
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')

    if (!month) {
      return NextResponse.json(
        { error: 'Parámetro month es obligatorio (YYYY-MM)' },
        { status: 400 }
      )
    }

    const [year, mon] = month.split('-').map(Number)
    const startDate = new Date(year, mon - 1, 1)
    const endDate = new Date(year, mon, 0, 23, 59, 59, 999)

    const budgets = await db.budget.findMany({
      where: { userId, month },
      include: { category: true },
    })

    // For each budget, compute the spent amount in that month
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (b) => {
        const aggregated = await db.transaction.aggregate({
          where: {
            categoryId: b.categoryId,
            userId,
            type: 'EXPENSE',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        })
        return {
          ...b,
          amount: Number(b.amount),
          spent: aggregated._sum.amount ? Number(aggregated._sum.amount) : 0,
        }
      })
    )

    return NextResponse.json(budgetsWithSpent)
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { error: 'Error al obtener presupuestos' },
      { status: 500 }
    )
  }
}

// POST /api/budgets
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { categoryId, month, amount } = body

    if (!categoryId || !month || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'categoryId, month y amount son obligatorios' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser positivo' },
        { status: 400 }
      )
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Formato de mes inválido (usar YYYY-MM)' },
        { status: 400 }
      )
    }

    // Verify the category belongs to the user and is EXPENSE type
    const category = await db.category.findFirst({
      where: { id: categoryId, userId },
    })
    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 400 }
      )
    }
    if (category.type !== 'EXPENSE') {
      return NextResponse.json(
        { error: 'Solo se pueden presupuestar categorías de gasto' },
        { status: 400 }
      )
    }

    // Upsert scoped by (userId, categoryId, month)
    const budget = await db.budget.upsert({
      where: {
        userId_categoryId_month: { userId, categoryId, month },
      },
      update: { amount },
      create: { userId, categoryId, month, amount },
      include: { category: true },
    })

    return NextResponse.json(
      { ...budget, amount: Number(budget.amount) },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: 'Error al crear presupuesto' },
      { status: 500 }
    )
  }
}
