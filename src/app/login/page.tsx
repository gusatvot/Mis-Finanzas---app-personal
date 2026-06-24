'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Wallet,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  Repeat,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const registered = searchParams.get('registered') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Completá email y contraseña')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (!res || res.error) {
        setError('Email o contraseña incorrectos')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left panel — financial showcase */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-12 text-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-32 w-32 rounded-full bg-yellow-300/20 blur-2xl" />

        {/* Top — brand */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/30">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">Mis Finanzas</div>
            <div className="text-xs text-emerald-100">Tu contabilidad personal</div>
          </div>
        </div>

        {/* Center — hero stat cards */}
        <div className="relative space-y-5">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Controlá tu dinero.<br />
              <span className="text-emerald-200">Hacé crecer tus ahorros.</span>
            </h1>
            <p className="mt-3 max-w-md text-emerald-100/90">
              Registrá tus ingresos y gastos, organizá tus cuentas y cumplí tus metas
              financieras con un panel claro y simple.
            </p>
          </div>

          {/* Mock dashboard cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20">
              <div className="flex items-center gap-2 text-emerald-100">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Ingresos</span>
              </div>
              <div className="mt-2 text-2xl font-bold tabular-nums">$845.000</div>
              <div className="mt-1 text-xs text-emerald-200">+12% vs mes anterior</div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20">
              <div className="flex items-center gap-2 text-rose-100">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Gastos</span>
              </div>
              <div className="mt-2 text-2xl font-bold tabular-nums">$412.300</div>
              <div className="mt-1 text-xs text-emerald-200">-5% vs mes anterior</div>
            </div>

            <div className="col-span-2 rounded-2xl bg-white/15 p-4 backdrop-blur-sm ring-1 ring-white/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-yellow-200" />
                  <div>
                    <div className="text-xs text-emerald-100">Balance del mes</div>
                    <div className="text-2xl font-bold tabular-nums">$432.700</div>
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/30 ring-1 ring-emerald-200/40">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-yellow-300 to-emerald-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom — feature bullets */}
        <div className="relative grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-100">
            <Target className="h-4 w-4 flex-shrink-0" />
            <span>Presupuestos</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-100">
            <Repeat className="h-4 w-4 flex-shrink-0" />
            <span>Recurrentes</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-100">
            <Wallet className="h-4 w-4 flex-shrink-0" />
            <span>Multi-cuenta</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="relative flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">Mis Finanzas</div>
              <div className="text-xs text-muted-foreground">Tu contabilidad personal</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Bienvenido de nuevo 👋</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Iniciá sesión para ver tu balance y tus movimientos.
            </p>
          </div>

          {registered && (
            <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              ¡Cuenta creada! Iniciá sesión con tus credenciales.
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vos@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Creá la tuya gratis
            </Link>
          </div>

          <div className="mt-8 rounded-lg border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Tip:</span> llevá solo 30 segundos
            en registrarte y tendrás 13 categorías listas para usar.
          </div>
        </div>
      </div>
    </div>
  )
}
