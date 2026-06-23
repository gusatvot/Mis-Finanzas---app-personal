'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Wallet,
  Loader2,
  AlertCircle,
  PiggyBank,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Email y contraseña son obligatorios')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al registrar')
      }

      // Auto-login after successful registration
      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (!signInRes || signInRes.error) {
        router.push('/login?registered=1')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left panel — savings showcase */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-800 p-12 text-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/4 top-2/3 h-32 w-32 rounded-full bg-yellow-300/20 blur-2xl" />

        {/* Top — brand */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/30">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">Mis Finanzas</div>
            <div className="text-xs text-violet-100">Empezá a ahorrar hoy</div>
          </div>
        </div>

        {/* Center — hero with savings goal */}
        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Tu meta de ahorro,<br />
              <span className="text-violet-200">finalmente posible.</span>
            </h1>
            <p className="mt-3 max-w-md text-violet-100/90">
              Visualizá a dónde va tu dinero cada mes, ponete metas realistas y
              mirá cómo tus ahorros crecen semana a semana.
            </p>
          </div>

          {/* Savings goal mock */}
          <div className="rounded-3xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300/30 ring-1 ring-yellow-200/40">
                  <PiggyBank className="h-5 w-5 text-yellow-100" />
                </div>
                <div>
                  <div className="text-xs text-violet-100">Meta de ahorro</div>
                  <div className="text-base font-semibold">Vacaciones 2026</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-violet-100">Progreso</div>
                <div className="text-base font-bold tabular-nums text-yellow-200">68%</div>
              </div>
            </div>

            {/* Big progress bar */}
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-emerald-300 to-emerald-400 transition-all"
                style={{ width: '68%' }}
              />
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-sm text-violet-100">Ahorrado</span>
              <span className="text-sm">
                <span className="text-lg font-bold tabular-nums">$680.000</span>
                <span className="text-violet-200"> / $1.000.000</span>
              </span>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 p-3 text-center backdrop-blur-sm ring-1 ring-white/10">
              <TrendingUp className="mx-auto h-4 w-4 text-emerald-200" />
              <div className="mt-1 text-sm font-bold tabular-nums">+18%</div>
              <div className="text-[10px] text-violet-100">Ahorro</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-center backdrop-blur-sm ring-1 ring-white/10">
              <Target className="mx-auto h-4 w-4 text-yellow-200" />
              <div className="mt-1 text-sm font-bold tabular-nums">3/4</div>
              <div className="text-[10px] text-violet-100">Metas</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-center backdrop-blur-sm ring-1 ring-white/10">
              <Wallet className="mx-auto h-4 w-4 text-fuchsia-200" />
              <div className="mt-1 text-sm font-bold tabular-nums">4</div>
              <div className="text-[10px] text-violet-100">Cuentas</div>
            </div>
          </div>
        </div>

        {/* Bottom — testimonial / quote */}
        <div className="relative rounded-2xl bg-white/5 p-4 backdrop-blur-sm ring-1 ring-white/10">
          <p className="text-sm italic text-violet-50">
            &ldquo;En 3 meses ahorré más que en todo el año pasado. Ver los números
            claros cambia todo.&rdquo;
          </p>
          <p className="mt-2 text-xs text-violet-200">— María, usuaria desde 2025</p>
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
              <div className="text-xs text-muted-foreground">Empezá a ahorrar hoy</div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Sparkles className="h-6 w-6 text-violet-500" />
              Creá tu cuenta
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              En menos de 30 segundos empezás a controlar tu dinero.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre (opcional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="¿Cómo te llamás?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="h-11"
              />
            </div>

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
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repetí la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Crear mi cuenta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* What you get */}
          <div className="mt-6 space-y-2 rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Al registrarte recibís:
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>13 categorías predeterminadas listas para usar</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Cuentas ilimitadas (efectivo, banco, tarjeta)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Presupuestos y transacciones recurrentes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Exportación a CSV y dashboard con gráficos</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
