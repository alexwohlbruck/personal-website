import { computed, readonly, ref } from 'vue'
import { BACKEND_URL } from '@/data/site'

/**
 * The site owner's session, shared by whoever asks for it.
 *
 * Module scope rather than a Pinia store: this is one token and three calls,
 * and nothing about it needs devtools or hydration. The token is held in
 * localStorage so a refresh does not mean reading another code out of an
 * inbox, and sent as a bearer header, which is also the only thing the server
 * looks at.
 */

const storageKey = 'guestbook-admin-token'
const endpoint = `${BACKEND_URL}/admin`

const token = ref(localStorage.getItem(storageKey))
const email = ref<string | null>(null)
/** Undefined until the stored token has been offered to the server once. */
const checked = ref(false)

const signedIn = computed(() => Boolean(token.value && email.value))

function store(next: string | null, address: string | null) {
  token.value = next
  email.value = address
  if (next) localStorage.setItem(storageKey, next)
  else localStorage.removeItem(storageKey)
}

async function send<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...adminHeaders(),
      ...init?.headers,
    },
  })
  const body = (await response.json().catch(() => ({}))) as { message?: string }
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`)
  return body as T
}

/** The Authorization header, or nothing at all when signed out. */
export function adminHeaders(): Record<string, string> {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

/** Mails a code. The answer is the same whether or not the address can sign in. */
export async function requestAdminCode(address: string) {
  const result = await send<{ message: string }>('/code', {
    method: 'POST',
    body: JSON.stringify({ email: address.trim() }),
  })
  return result.message
}

export async function verifyAdminCode(address: string, code: string) {
  const result = await send<{ token: string; email: string }>('/session', {
    method: 'POST',
    body: JSON.stringify({ email: address.trim(), code: code.trim() }),
  })
  store(result.token, result.email)
}

/**
 * Nothing is stored server side, so dropping the token here is the whole of
 * signing out. It expires on its own within the week either way.
 */
export function signOutAdmin() {
  store(null, null)
}

/** Whether the token kept from last time is still worth anything. */
export async function restoreAdminSession() {
  if (checked.value) return
  checked.value = true
  if (!token.value) return
  try {
    const result = await send<{ signedIn: boolean; email: string | null }>('/session')
    if (result.signedIn) email.value = result.email
    else store(null, null)
  } catch {
    // A server that cannot be reached is not proof the session expired. Leave
    // the token alone and let the next attempt decide.
  }
}

export function useAdmin() {
  return {
    signedIn,
    email: readonly(email),
    adminHeaders,
    requestAdminCode,
    verifyAdminCode,
    signOutAdmin,
    restoreAdminSession,
  }
}
