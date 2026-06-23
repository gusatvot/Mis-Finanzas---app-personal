import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// DELETE /api/categories/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    // Make sure the category belongs to the user
    const category = await db.category.findFirst({ where: { id, userId } })
    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    const transactionsCount = await db.transaction.count({
      where: { categoryId: id, userId },
    })

    if (transactionsCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar: hay ${transactionsCount} transacciones asociadas`,
        },
        { status: 400 }
      )
    }

    await db.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, type, color, icon } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Nombre y tipo son obligatorios' },
        { status: 400 }
      )
    }

    // Make sure the category belongs to the user
    const existing = await db.category.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name: name.trim(),
        type,
        color: color || '#64748b',
        icon: icon || 'Wallet',
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
      { status: 500 }
    )
  }
}
