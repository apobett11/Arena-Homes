export function isSafeInternalRedirect(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.includes('://')) return false;
  return true;
}

export function getLoginRedirectTarget(
  redirect: string | null | undefined,
  from: string | null | undefined
): string | null {
  if (isSafeInternalRedirect(redirect)) return redirect;
  if (isSafeInternalRedirect(from)) return from;
  return null;
}
