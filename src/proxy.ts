import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: 'next-auth.session-token', // Coincide con la config de cookies en auth.ts
  })

  const { pathname } = req.nextUrl

  // Public paths: auth, login, register, static files
  const isPublic =
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.svg' ||
    pathname === '/robots.txt'

  if (isPublic) {
    return NextResponse.next()
  }

  // If not authenticated, redirect to login (for pages) or 401 (for APIs)
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|login|register|_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)',
  ],
}
