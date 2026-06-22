import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/recurring/[id] - toggle active or update
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { active } = body

    const updated = await db.recurringTransaction.update({
      where: { id },
      data: { active: typeof active === 'boolean' ? active : true },
      include: { category: true, account: true },
    })

    return NextResponse.json(updated)
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
    const { id } = await params
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
