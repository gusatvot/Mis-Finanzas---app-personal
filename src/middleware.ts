export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    /*
     * Protege todo excepto:
     * - /login, /register
     * - /api/auth/*
     * - archivos estáticos (_next/static, _next/image, favicon.ico, logo.svg)
     */
    '/((?!login|register|api/auth|_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)',
  ],
}
