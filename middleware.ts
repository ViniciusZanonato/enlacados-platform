/**
 * Vercel Edge Middleware for Vite/React
 * Uses standard Web APIs (Request/Response)
 *
 * Responsabilidade: bloquear requisições de origens inválidas em rotas /api.
 * Security headers globais são configurados em vercel.json (chave "headers"),
 * pois em middleware não-Next.js não é possível injetar headers em respostas pass-through.
 */

export default function middleware(request: Request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api')) {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');

      if (origin && host && !origin.includes(host)) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Invalid Origin' }),
          {
            status: 403,
            headers: { 'content-type': 'application/json' },
          }
        );
      }
    }
  }
}

export const config = {
  matcher: '/api/:path*',
};
