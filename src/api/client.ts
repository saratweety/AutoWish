// Talks to the AutoWish server (CLAUDE.md section 14).
// Every request carries the Clerk login token, has a time limit, and turns
// failures into short, friendly messages that can be shown on screen.

/** The server address, from autowish/.env (EXPO_PUBLIC_API_URL). */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export const apiConfigured = API_URL.length > 0;

type ErrorKind = 'config' | 'offline' | 'timeout' | 'auth' | 'rate_limit' | 'server' | 'bad_request';

const MESSAGES: Record<ErrorKind, string> = {
  config: "The app isn't connected to the AutoWish server yet.",
  offline: "You're offline. Your changes are safe on this phone and will be saved when you're back online.",
  timeout: 'The server took too long to answer. Check your internet and try again.',
  auth: 'Please log in again.',
  rate_limit: 'Too many tries in a short time. Please wait a minute and try again.',
  server: 'Our server is having a problem. Please try again in a few minutes.',
  bad_request: 'Something in your data could not be saved. Please try again.',
};

export class ApiError extends Error {
  constructor(
    readonly kind: ErrorKind,
    readonly status?: number,
    detail?: string,
  ) {
    super(MESSAGES[kind]);
    this.name = 'ApiError';
    // Kept for debugging only; the message above is what people see.
    if (detail) this.detail = detail;
  }
  detail?: string;
}

/** A friendly sentence for any error, for showing on screen. */
export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : MESSAGES.server;
}

// Set by the login code (src/auth) so requests can get a fresh Clerk token.
let getToken: () => Promise<string | null> = async () => null;
export function setTokenGetter(getter: () => Promise<string | null>) {
  getToken = getter;
}

/** The login header for things that load by themselves, like photos. null when logged out. */
export async function authHeaders(): Promise<Record<string, string> | null> {
  const token = await getToken().catch(() => null);
  return token ? { Authorization: `Bearer ${token}` } : null;
}

type Options = {
  method?: 'GET' | 'POST' | 'DELETE';
  /** Sent as JSON. */
  json?: unknown;
  /** Sent as-is (photo uploads). */
  body?: Blob;
  contentType?: string;
  timeoutMs?: number;
};

/** Calls the server and returns its JSON answer, or throws an ApiError. */
export async function api<T>(path: string, { method = 'GET', json, body, contentType, timeoutMs = 15_000 }: Options = {}): Promise<T> {
  if (!apiConfigured) throw new ApiError('config');
  const token = await getToken().catch(() => null);
  if (!token) throw new ApiError('auth');

  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  if (body && contentType) headers['Content-Type'] = contentType;

  // Give up after timeoutMs, so a bad connection never leaves the app waiting forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: json !== undefined ? JSON.stringify(json) : body,
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(controller.signal.aborted ? 'timeout' : 'offline', undefined, String(error));
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => null);
  if (response.ok) return data as T;
  const detail = (data as { error?: string } | null)?.error;
  if (response.status === 401) throw new ApiError('auth', 401, detail);
  if (response.status === 429) throw new ApiError('rate_limit', 429, detail);
  if (response.status >= 400 && response.status < 500) throw new ApiError('bad_request', response.status, detail);
  throw new ApiError('server', response.status, detail);
}
