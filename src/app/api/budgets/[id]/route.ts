import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// DELETE /api/budgets/[id]
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

    const existing = await db.budget.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    await db.budget.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Error al eliminar presupuesto' },
      { status: 500 }
    )
  }
}
