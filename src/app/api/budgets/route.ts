import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/budgets?month=YYYY-MM
export async function GET(req: NextRequest) {
  try {
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
      where: { month },
      include: { category: true },
    })

    // For each budget, compute the spent amount in that month
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (b) => {
        const spent = await db.transaction.aggregate({
          where: {
            categoryId: b.categoryId,
            type: 'EXPENSE',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        })
        return {
          ...b,
          spent: spent._sum.amount ?? 0,
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

    const category = await db.category.findUnique({ where: { id: categoryId } })
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

    // Upsert: if budget already exists for this category+month, update it
    const budget = await db.budget.upsert({
      where: {
        categoryId_month: { categoryId, month },
      },
      update: { amount },
      create: { categoryId, month, amount },
      include: { category: true },
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: 'Error al crear presupuesto' },
      { status: 500 }
    )
  }
}
