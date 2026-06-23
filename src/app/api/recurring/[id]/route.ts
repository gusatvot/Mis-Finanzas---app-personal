import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// PUT /api/recurring/[id] - toggle active or update
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
    const { active } = body

    const existing = await db.recurringTransaction.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Recurrente no encontrada' },
        { status: 404 }
      )
    }

    const updated = await db.recurringTransaction.update({
      where: { id },
      data: { active: typeof active === 'boolean' ? active : true },
      include: { category: true, account: true },
    })

    const result = {
      ...updated,
      amount: Number(updated.amount),
      account: updated.account
        ? { ...updated.account, initialBalance: Number(updated.account.initialBalance) }
        : null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating recurring transaction:', error)
    return NextResponse.json(
      { error: 'Error al actualizar transacción recurrente' },
      { status: 500 }
    )
  }
}

// DELETE /api/recurring/[id]
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

    const existing = await db.recurringTransaction.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Recurrente no encontrada' },
        { status: 404 }
      )
    }

    await db.recurringTransaction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting recurring transaction:', error)
    return NextResponse.json(
      { error: 'Error al eliminar transacción recurrente' },
      { status: 500 }
    )
  }
}
