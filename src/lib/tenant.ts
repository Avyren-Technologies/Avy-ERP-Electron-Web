export type AppMode = 'main' | 'admin' | 'tenant';

export interface TenantContext {
  mode: AppMode;
  slug: string | null;
}

const MAIN_DOMAIN = import.meta.env.VITE_MAIN_DOMAIN || 'avyren.in';

const RESERVED_SLUGS = new Set([
  'admin', 'www', 'api', 'app', 'staging', 'dev', 'test', 'demo',
  'mail', 'ftp', 'cdn', 'static', 'assets', 'docs', 'help',
  'support', 'status', 'blog', 'avy-erp-api', 'pg', 'ssh',
]);

export function detectTenant(): TenantContext {
  const hostname = window.location.hostname;

  // Development: treat localhost as main domain
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Dev override via query param: ?tenant=slug
    const params = new URLSearchParams(window.location.search);
    const devSlug = params.get('tenant');
    if (devSlug === 'admin') return { mode: 'admin', slug: null };
    if (devSlug) return { mode: 'tenant', slug: devSlug };
    return { mode: 'main', slug: null };
  }

  // Main domain (no subdomain)
  if (hostname === MAIN_DOMAIN) {
    return { mode: 'main', slug: null };
  }

  // Subdomain of main domain
  if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    const slug = hostname.replace(`.${MAIN_DOMAIN}`, '');

    if (slug === 'admin') {
      return { mode: 'admin', slug: null };
    }

    if (RESERVED_SLUGS.has(slug)) {
      return { mode: 'main', slug: null };
    }

    return { mode: 'tenant', slug };
  }

  // Unknown domain — fallback to main
  return { mode: 'main', slug: null };
}

// Singleton for the current session
let cachedContext: TenantContext | null = null;

export function getTenantContext(): TenantContext {
  if (!cachedContext) {
    cachedContext = detectTenant();
  }
  return cachedContext;
}

/**
 * Build a login path that preserves tenant context.
 * On real subdomains (slug.avyren.in), /login is enough.
 * On localhost dev with ?tenant=slug, we need to preserve the query param.
 */
export function getLoginPath(extra?: string): string {
  const hostname = window.location.hostname;
  const suffix = extra ? `${extra}` : '';

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search);
    const devSlug = params.get('tenant');
    if (devSlug) {
      return `/login?tenant=${devSlug}${suffix ? `&${suffix}` : ''}`;
    }
  }

  return `/login${suffix ? `?${suffix}` : ''}`;
}
