export interface MaliConnectUserSession {
  sub: string;
  name: string;
  email: string;
  email_verified?: boolean;
  groups: string[];
  roles: string[];
  id_token?: string;
}

export function parseMaliConnectUser(cookieHeader?: string | null): MaliConnectUserSession | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|; )mali_connect_user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as MaliConnectUserSession;
  } catch {
    return null;
  }
}

export function isUserCmsEditor(user: MaliConnectUserSession | null, orgSlug?: string): boolean {
  if (!user) return false;
  if (user.groups.includes('authentik Admins')) return true;
  if (user.groups.some((g) => g.includes('admin'))) return true;
  if (orgSlug && user.groups.includes(`sites:${orgSlug}:editor`)) return true;
  if (user.groups.some((g) => g.endsWith(':editor'))) return true;
  return false;
}
