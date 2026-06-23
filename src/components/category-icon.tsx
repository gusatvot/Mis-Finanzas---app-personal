'use client'

import {
  UtensilsCrossed,
  Home,
  Car,
  Lightbulb,
  HeartPulse,
  Gamepad2,
  Shirt,
  GraduationCap,
  Wallet,
  Banknote,
  Laptop,
  TrendingUp,
  Plus,
  ShoppingCart,
  Plane,
  Gift,
  PiggyBank,
  CreditCard,
  Coffee,
  Dumbbell,
  Baby,
  PawPrint,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Home,
  Car,
  Lightbulb,
  HeartPulse,
  Gamepad2,
  Shirt,
  GraduationCap,
  Wallet,
  Banknote,
  Laptop,
  TrendingUp,
  Plus,
  ShoppingCart,
  Plane,
  Gift,
  PiggyBank,
  CreditCard,
  Coffee,
  Dumbbell,
  Baby,
  PawPrint,
  Wrench,
}

export const AVAILABLE_ICONS = Object.keys(ICONS)

export function CategoryIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = ICONS[name] ?? Wallet
  return <Icon className={className} />
}
