import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'

// POST /api/recurring/post-due
// Posts all due recurring transactions up to today as actual transactions.
export async function POST() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const now = new Date()
    const due = await db.recurringTransaction.findMany({
      where: {
        userId,
        active: true,
        nextDue: { lte: now },
      },
      include: { category: true },
    })

    let postedCount = 0

    for (const r of due) {
      // Skip if endDate passed
      if (r.endDate && new Date(r.endDate) < now) {
        await db.recurringTransaction.update({
          where: { id: r.id },
          data: { active: false },
        })
        continue
      }

      // Create the actual transaction at nextDue date
      await db.transaction.create({
        data: {
          type: r.type,
          amount: Number(r.amount),
          description: r.description || r.category.name,
          date: r.nextDue,
          categoryId: r.categoryId,
          accountId: r.accountId,
          userId,
        },
      })

      // Compute next due date
      const nextDue = computeNextDue(r.nextDue, r.frequency, r.dayOfMonth, r.dayOfWeek)

      // If next due is past end date, deactivate
      const shouldDeactivate = r.endDate && nextDue > new Date(r.endDate)

      await db.recurringTransaction.update({
        where: { id: r.id },
        data: {
          lastPosted: r.nextDue,
          nextDue,
          active: !shouldDeactivate,
        },
      })

      postedCount++
    }

    return NextResponse.json({
      posted: postedCount,
      message:
        postedCount === 0
          ? 'No hay transacciones recurrentes pendientes'
          : `Se procesaron ${postedCount} transacción(es) recurrente(s)`,
    })
  } catch (error) {
    console.error('Error posting due recurring transactions:', error)
    return NextResponse.json(
      { error: 'Error al procesar recurrentes' },
      { status: 500 }
    )
  }
}

function computeNextDue(
  from: Date,
  frequency: string,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null
): Date {
  const d = new Date(from)
  if (frequency === 'DAILY') {
    d.setDate(d.getDate() + 1)
  } else if (frequency === 'WEEKLY') {
    d.setDate(d.getDate() + 7)
    if (dayOfWeek != null) {
      const cur = d.getDay()
      let diff = (dayOfWeek - cur + 7) % 7
      d.setDate(d.getDate() + diff)
    }
  } else if (frequency === 'MONTHLY') {
    d.setMonth(d.getMonth() + 1)
    if (dayOfMonth != null) {
      d.setDate(Math.min(dayOfMonth, 28))
    }
  } else if (frequency === 'YEARLY') {
    d.setFullYear(d.getFullYear() + 1)
    if (dayOfMonth != null) {
      d.setDate(Math.min(dayOfMonth, 28))
    }
  }
  return d
}
