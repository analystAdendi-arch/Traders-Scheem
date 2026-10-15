import type { AuthInfo, DerivAccount, StoredCSRFToken, StoredCodeVerifier } from '../types';

const CSRF_TOKEN_KEY = 'oauth_csrf_token';
const CODE_VERIFIER_KEY = 'oauth_code_verifier';
const AUTH_INFO_KEY = 'auth_info';
const DERIV_ACCOUNTS_KEY = 'deriv_accounts';
const ACTIVE_LOGINID_KEY = 'active_loginid';
const ACCOUNT_TYPE_KEY = 'account_type';

// A login can take a while (Deriv's own sign-in, email verification, 2FA), so
// the one-time login values live for 30 minutes rather than 10.
const TOKEN_MAX_AGE_MS = 30 * 60 * 1000;

/*
 * The CSRF state and PKCE verifier have to survive the trip to Deriv and back.
 * sessionStorage belongs to a single tab, so a login that comes back in another
 * tab or window - common on phones, where Deriv's return link or an in-app
 * browser opens a fresh tab - found nothing here and failed with "CSRF token
 * mismatch", leaving the user on the landing page. They are therefore written to
 * localStorage too (same origin, short-lived, removed as soon as they are used)
 * and read from either place. Each call is guarded: storage can be blocked.
 */
function oneTimeSet(key: string, value: string): void {
  try { sessionStorage.setItem(key, value); } catch { /* blocked */ }
  try { localStorage.setItem(key, value); } catch { /* blocked */ }
}

function oneTimeGet(key: string): string | null {
  let raw: string | null = null;
  try { raw = sessionStorage.getItem(key); } catch { /* blocked */ }
  if (raw) return raw;
  try { return localStorage.getItem(key); } catch { return null; }
}

function oneTimeRemove(key: string): void {
  try { sessionStorage.removeItem(key); } catch { /* blocked */ }
  try { localStorage.removeItem(key); } catch { /* blocked */ }
}

/** A stored { value, createdAt } that is still fresh, else null (and removed). */
function readFresh(key: string, remove: () => void): string | null {
  const raw = oneTimeGet(key);
  if (!raw) return null;
  try {
    const stored: StoredCSRFToken = JSON.parse(raw);
    if (!stored?.value || Date.now() - stored.createdAt > TOKEN_MAX_AGE_MS) {
      remove();
      return null;
    }
    return stored.value;
  } catch {
    remove();
    return null;
  }
}

// --- CSRF Token ---

export function storeCSRFToken(token: string): void {
  const stored: StoredCSRFToken = { value: token, createdAt: Date.now() };
  oneTimeSet(CSRF_TOKEN_KEY, JSON.stringify(stored));
}

export function getCSRFToken(): string | null {
  return readFresh(CSRF_TOKEN_KEY, clearCSRFToken);
}

export function clearCSRFToken(): void {
  oneTimeRemove(CSRF_TOKEN_KEY);
}

// --- PKCE Code Verifier ---

export function storeCodeVerifier(verifier: string): void {
  const stored: StoredCodeVerifier = { value: verifier, createdAt: Date.now() };
  oneTimeSet(CODE_VERIFIER_KEY, JSON.stringify(stored));
}

export function getCodeVerifier(): string | null {
  return readFresh(CODE_VERIFIER_KEY, clearCodeVerifier);
}

export function clearCodeVerifier(): void {
  oneTimeRemove(CODE_VERIFIER_KEY);
}

// --- Auth Info ---

export function storeAuthInfo(authInfo: AuthInfo): void {
  localStorage.setItem(AUTH_INFO_KEY, JSON.stringify(authInfo));
}

export function getAuthInfo(): AuthInfo | null {
  const raw = localStorage.getItem(AUTH_INFO_KEY);
  if (!raw) return null;

  const authInfo: AuthInfo = JSON.parse(raw);
  if (authInfo.expires_at && Date.now() > authInfo.expires_at * 1000) {
    return null; // Token expired
  }
  return authInfo;
}

export function clearAuthInfo(): void {
  localStorage.removeItem(AUTH_INFO_KEY);
}

// --- Deriv Accounts ---

export function storeDerivAccounts(accounts: DerivAccount[]): void {
  localStorage.setItem(DERIV_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getDerivAccounts(): DerivAccount[] | null {
  const raw = localStorage.getItem(DERIV_ACCOUNTS_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function clearDerivAccounts(): void {
  localStorage.removeItem(DERIV_ACCOUNTS_KEY);
}

// --- Active Login ID (localStorage) ---

export function setActiveLoginId(loginId: string): void {
  localStorage.setItem(ACTIVE_LOGINID_KEY, loginId);
}

export function getActiveLoginId(): string | null {
  return localStorage.getItem(ACTIVE_LOGINID_KEY);
}

// --- Account Type (localStorage) ---

export function setAccountType(type: 'demo' | 'real'): void {
  localStorage.setItem(ACCOUNT_TYPE_KEY, type);
}

export function getAccountType(): string | null {
  return localStorage.getItem(ACCOUNT_TYPE_KEY);
}

// --- Clear All Auth Data ---

export function clearAllAuthData(): void {
  clearCSRFToken();
  clearCodeVerifier();
  clearAuthInfo();
  clearDerivAccounts();
  localStorage.removeItem(ACTIVE_LOGINID_KEY);
  localStorage.removeItem(ACCOUNT_TYPE_KEY);
}
