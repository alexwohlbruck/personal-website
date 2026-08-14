import { computed, readonly, ref } from 'vue'
import { BACKEND_URL } from '@/data/site'

/**
 * The site owner's session, shared by whoever asks for it.
 *
 * Module scope rather than a Pinia store: this is one session and four calls,
 * and nothing about it needs devtools or hydration.
 *
 * The session lives in an httpOnly cookie wherever the browser will keep one,
 * which is to say wherever the site and the API share an origin. There it is
 * out of reach of any script on the page, and nothing is written to storage at
 * all. In development they are on different ports, the browser declines to
 * send the cookie back, and a token in localStorage carries the session
 * instead. Which of the two is in use is not guessed: after signing in the
 * cookie is tried, and the token is only kept if the cookie did not work.
 */

const storageKey = 'guestbook-admin-token'
const endpoint = `${BACKEND_URL}/admin`

const token = ref(localStorage.getItem(storageKey))
const email = ref<string | null>(null)
/** Set once the stored session has been offered to the server. */
const checked = ref(false)

const signedIn = computed(() => Boolean(email.value))

function store(next: string | null) {
  token.value = next
  if (next) localStorage.setItem(storageKey, next)
  else localStorage.removeItem(storageKey)
}

async function send<T>(path: string, init?: RequestInit, withToken = true): Promise<T> {
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    cache: 'no-store',
    // Lets the browser return the session cookie where it holds one.
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(withToken ? adminHeaders() : {}),
      ...init?.headers,
    },
  })
  if (response.status === 204) return undefined as T
  const body = (await response.json().catch(() => ({}))) as { message?: string }
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`)
  return body as T
}

/** The bearer header, when the session is not riding in a cookie. */
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
  email.value = result.email

  // Ask without the token. An answer means the cookie came back on its own and
  // there is no reason to write the token down anywhere a script can read it.
  const viaCookie = await send<{ signedIn: boolean }>('/session', undefined, false).catch(() => null)
  store(viaCookie?.signedIn ? null : result.token)
}

/**
 * Sign out on the server, which ends the session everywhere rather than only
 * in this browser. A token that leaked somewhere else stops working too.
 */
export async function signOutAdmin() {
  try {
    await send('/session', { method: 'DELETE' })
  } catch {
    // Whatever the server said, this browser is done with it.
  }
  store(null)
  email.value = null
}

/** Whether the session kept from last time is still worth anything. */
export async function restoreAdminSession() {
  if (checked.value) return
  checked.value = true
  try {
    const result = await send<{ signedIn: boolean; email: string | null }>('/session')
    if (result.signedIn) email.value = result.email
    else store(null)
  } catch {
    // A server that cannot be reached is not proof the session expired. Leave
    // it alone and let the next attempt decide.
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
