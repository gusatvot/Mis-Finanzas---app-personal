import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// DELETE /api/transactions/[id]
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

    const existing = await db.transaction.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 })
    }

    await db.transaction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Error al eliminar transacción' },
      { status: 500 }
    )
  }
}

// PUT /api/transactions/[id]
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
    const { type, amount, description, date, categoryId, accountId } = body

    if (!type || !amount || !date || !categoryId) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const existing = await db.transaction.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 })
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: {
        type,
        amount,
        description: (description || '').trim(),
        date: new Date(date),
        categoryId,
        accountId: accountId || null,
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

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Error al actualizar transacción' },
      { status: 500 }
    )
  }
}
