import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/categories - list all categories
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { transactions: true } },
      },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

// POST /api/categories - create a new category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, type, color, icon } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Nombre y tipo son obligatorios' },
        { status: 400 }
      )
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return NextResponse.json(
        { error: 'Tipo debe ser INCOME o EXPENSE' },
        { status: 400 }
      )
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        type,
        color: color || '#64748b',
        icon: icon || 'Wallet',
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    )
  }
}
