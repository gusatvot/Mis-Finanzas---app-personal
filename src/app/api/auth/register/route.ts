import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

// POST /api/auth/register
// Body: { email, password, name? }
// Creates a new user and clones default categories for them.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese email' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        passwordHash,
      },
    })

    // Clone default categories for this user
    const expenseCategories = [
      { name: 'Alimentación',  color: '#ef4444', icon: 'UtensilsCrossed' },
      { name: 'Vivienda',      color: '#f97316', icon: 'Home' },
      { name: 'Transporte',    color: '#eab308', icon: 'Car' },
      { name: 'Servicios',     color: '#84cc16', icon: 'Lightbulb' },
      { name: 'Salud',         color: '#06b6d4', icon: 'HeartPulse' },
      { name: 'Ocio',          color: '#a855f7', icon: 'Gamepad2' },
      { name: 'Ropa',          color: '#ec4899', icon: 'Shirt' },
      { name: 'Educación',     color: '#6366f1', icon: 'GraduationCap' },
      { name: 'Otros gastos',  color: '#64748b', icon: 'Wallet' },
    ]

    const incomeCategories = [
      { name: 'Salario',         color: '#10b981', icon: 'Banknote' },
      { name: 'Freelance',       color: '#14b8a6', icon: 'Laptop' },
      { name: 'Inversiones',     color: '#22c55e', icon: 'TrendingUp' },
      { name: 'Otros ingresos',  color: '#0ea5e9', icon: 'Plus' },
    ]

    await db.category.createMany({
      data: [
        ...expenseCategories.map((c) => ({ ...c, type: 'EXPENSE' as const, userId: user.id })),
        ...incomeCategories.map((c) => ({ ...c, type: 'INCOME' as const, userId: user.id })),
      ],
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    }, { status: 201 })
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    )
  }
}
