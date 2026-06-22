import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/seed - seeds the database with default categories and demo transactions
export async function POST() {
  try {
    const existing = await db.category.count()
    if (existing > 0) {
      return NextResponse.json(
        { message: 'Ya existen categorías, no se puede sembrar nuevamente' },
        { status: 400 }
      )
    }

    const expenseCategories = [
      { name: 'Alimentación', color: '#ef4444', icon: 'UtensilsCrossed' },
      { name: 'Vivienda', color: '#f97316', icon: 'Home' },
      { name: 'Transporte', color: '#eab308', icon: 'Car' },
      { name: 'Servicios', color: '#84cc16', icon: 'Lightbulb' },
      { name: 'Salud', color: '#06b6d4', icon: 'HeartPulse' },
      { name: 'Ocio', color: '#a855f7', icon: 'Gamepad2' },
      { name: 'Ropa', color: '#ec4899', icon: 'Shirt' },
      { name: 'Educación', color: '#6366f1', icon: 'GraduationCap' },
      { name: 'Otros gastos', color: '#64748b', icon: 'Wallet' },
    ]

    const incomeCategories = [
      { name: 'Salario', color: '#10b981', icon: 'Banknote' },
      { name: 'Freelance', color: '#14b8a6', icon: 'Laptop' },
      { name: 'Inversiones', color: '#22c55e', icon: 'TrendingUp' },
      { name: 'Otros ingresos', color: '#0ea5e9', icon: 'Plus' },
    ]

    const categories = await db.category.createMany({
      data: [
        ...expenseCategories.map((c) => ({ ...c, type: 'EXPENSE' as const })),
        ...incomeCategories.map((c) => ({ ...c, type: 'INCOME' as const })),
      ],
    })

    // Create some demo transactions for the current month
    const allCategories = await db.category.findMany()
    const now = new Date()
    const demoTransactions = [
      { type: 'INCOME', amount: 850000, description: 'Salario mensual', dayOff: -2, catName: 'Salario' },
      { type: 'INCOME', amount: 120000, description: 'Proyecto freelance diseño', dayOff: -5, catName: 'Freelance' },
      { type: 'EXPENSE', amount: 280000, description: 'Alquiler', dayOff: -3, catName: 'Vivienda' },
      { type: 'EXPENSE', amount: 85000, description: 'Supermercado semanal', dayOff: -1, catName: 'Alimentación' },
      { type: 'EXPENSE', amount: 35000, description: 'Subte y colectivo', dayOff: -1, catName: 'Transporte' },
      { type: 'EXPENSE', amount: 42000, description: 'Luz y gas', dayOff: -4, catName: 'Servicios' },
      { type: 'EXPENSE', amount: 18000, description: 'Cine con amigos', dayOff: -2, catName: 'Ocio' },
      { type: 'EXPENSE', amount: 65000, description: 'Compra ropa de invierno', dayOff: -6, catName: 'Ropa' },
    ]

    for (const t of demoTransactions) {
      const cat = allCategories.find((c) => c.name === t.catName)
      if (!cat) continue
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + t.dayOff)
      await db.transaction.create({
        data: {
          type: t.type,
          amount: t.amount,
          description: t.description,
          date,
          categoryId: cat.id,
        },
      })
    }

    return NextResponse.json({
      message: 'Base de datos sembrada correctamente',
      categoriesCreated: categories.count,
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Error al sembrar la base de datos' },
      { status: 500 }
    )
  }
}
