import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// DELETE /api/accounts/[id]
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

    const existing = await db.account.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
    }

    await db.account.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cuenta' },
      { status: 500 }
    )
  }
}

// PUT /api/accounts/[id]
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

    const existing = await db.account.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
    }

    const account = await db.account.update({
      where: { id },
      data: {
        name: name.trim(),
        type,
        color: color || '#64748b',
        initialBalance: typeof initialBalance === 'number' ? initialBalance : 0,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cuenta' },
      { status: 500 }
    )
  }
}
