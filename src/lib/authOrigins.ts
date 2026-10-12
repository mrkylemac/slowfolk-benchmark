import type { BetterAuthOptions } from 'better-auth';

/**
 * Where the app is allowed to be reached from.
 *
 * Better Auth rejects any request whose `Origin` header is not in
 * `trustedOrigins`, and that list defaults to the single `baseURL` value. On
 * Vercel that default is never enough: every deployment gets its own hostname,
 * a new one is minted on each push, and the production domain does not have to
 * match the project name. A `BETTER_AUTH_URL` that is one character off, or a
 * preview opened on its own URL, both come back as "Invalid origin" with no
 * hint on the page about which host was refused.
 *
 * So the trusted list is built from the app's own domains (`APP_DOMAINS`) and
 * the Vercel system variables, which only ever name hostnames Vercel assigned
 * to this project:
 *
 *   VERCEL_PROJECT_PRODUCTION_URL  the production domain
 *   VERCEL_BRANCH_URL              the per-branch host
 *   VERCEL_URL                     the per-deployment host
 *
 * These are hostnames without a protocol, hence `toOrigin`.
 */

/**
 * The app's public domains. Each serves the whole app with its own sign-in:
 * auth callbacks and session cookies stay on whichever host the visitor used,
 * so adding a domain never signs anyone out of another. A Google sign-in on a
 * new domain also needs its `/api/auth/callback/google` URL added to the OAuth
 * client's authorised redirect URIs.
 */
export const APP_DOMAINS = ['benchmark.slowfolk.au', 'capacity-reporter.vercel.app'];

/** `https://example.com/` and `example.com` both become `https://example.com`. */
export function toOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).origin;
  } catch {
    return undefined;
  }
}

/**
 * The public URL Better Auth builds its links from.
 *
 * On Vercel the app answers on several hosts at once, so the URL is taken from
 * each request's host, checked against the trusted list. A host outside it
 * falls back to the fixed URL. `protocol: 'https'` keeps the `__Secure-` cookie
 * names the app has always used, so existing sessions stay valid.
 *
 * A trailing slash is trimmed rather than passed through: Better Auth compares
 * origins by exact string, so `https://example.com/` never matches a browser's
 * `https://example.com`.
 */
export function resolveBaseURL(env: NodeJS.ProcessEnv = process.env): BetterAuthOptions['baseURL'] {
  const fixed = resolveFixedBaseURL(env);
  if (!env.VERCEL) return fixed;
  return {
    allowedHosts: resolveTrustedOrigins(env).map(origin => new URL(origin).host),
    protocol: 'https',
    fallback: fixed,
  };
}

function resolveFixedBaseURL(env: NodeJS.ProcessEnv): string | undefined {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL.replace(/\/+$/, '');
  // Vercel sets VERCEL_URL to the deployment host without a protocol.
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return undefined;
}

/**
 * Origins allowed to make auth requests, deduplicated and in preference order.
 *
 * Better Auth appends this to the origin it derives from `baseURL`, so the
 * result is additive — nothing here removes a host that already worked.
 */
export function resolveTrustedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const candidates = [
    env.BETTER_AUTH_URL,
    ...APP_DOMAINS,
    env.VERCEL_PROJECT_PRODUCTION_URL,
    env.VERCEL_BRANCH_URL,
    env.VERCEL_URL,
  ];

  const origins = candidates
    .map(toOrigin)
    .filter((origin): origin is string => Boolean(origin));

  return [...new Set(origins)];
}
