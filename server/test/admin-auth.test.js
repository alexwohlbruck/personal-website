import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

// Set before the module is loaded so the run does not depend on a local .env.
// dotenv leaves values that are already present alone.
process.env.ADMIN_EMAIL = 'owner@example.com'
process.env.ADMIN_SESSION_SECRET = 'a-secret-only-this-test-uses'
process.env.MAIL_HOST = 'smtp.example.com'
process.env.MAIL_USER = 'owner@example.com'
process.env.MAIL_PASS = 'not-a-real-password'

const {
  isAdminEmail,
  readAdminSession,
  requestAdminCode,
  verifyAdminCode,
  verifyAdminToken,
} = await import('../src/lib/admin-auth.js')

const OWNER = 'owner@example.com'
const RESEND_AFTER = 30_000

// Real time, so a token minted here is still unexpired when a function that
// reads its own clock looks at it.
let clock = Date.now()
const now = () => clock

/** Past the resend window, then a fresh code. */
function freshCode() {
  clock += RESEND_AFTER + 1_000
  return requestAdminCode(OWNER, { now })
}

const notThe = (code) => String((Number(code) + 1) % 1_000_000).padStart(6, '0')

describe('admin sign in', () => {
  it('recognises the owner however it is typed', () => {
    assert.ok(isAdminEmail('  OWNER@Example.com '))
    assert.ok(!isAdminEmail('owner@example.com.attacker.test'))
    assert.ok(!isAdminEmail(''))
  })

  it('issues a code for the owner and nothing at all for anyone else', () => {
    assert.equal(requestAdminCode('someone@example.com', { now }), null)
    assert.match(freshCode(), /^\d{6}$/)
  })

  it('will not send a second code straight away', () => {
    clock += 1_000
    assert.throws(() => requestAdminCode(OWNER, { now }), /just sent/)
  })

  it('rejects a wrong code and spends a correct one', () => {
    const code = freshCode()
    assert.throws(() => verifyAdminCode(OWNER, notThe(code), { now }), /not valid/)

    const token = verifyAdminCode(OWNER, code, { now })
    assert.equal(verifyAdminToken(token, { now })?.email, OWNER)

    // The same code a second time is somebody replaying it.
    assert.throws(() => verifyAdminCode(OWNER, code, { now }), /not valid/)
  })

  it('throws the code away after enough guesses', () => {
    const code = freshCode()
    for (let attempt = 0; attempt < 5; attempt += 1) {
      assert.throws(() => verifyAdminCode(OWNER, notThe(code), { now }), /not valid/)
    }
    assert.throws(() => verifyAdminCode(OWNER, code, { now }), /not valid/)
  })

  it('expires a code that sat unused', () => {
    const code = freshCode()
    clock += 11 * 60_000
    assert.throws(() => verifyAdminCode(OWNER, code, { now }), /not valid/)
  })

  it('will not accept the owner code for another address', () => {
    const code = freshCode()
    assert.throws(() => verifyAdminCode('someone@example.com', code, { now }), /not valid/)
  })
})

describe('admin sessions', () => {
  function session() {
    const code = freshCode()
    return verifyAdminCode(OWNER, code, { now })
  }

  it('reads a bearer token off the request', () => {
    const token = session()
    assert.equal(readAdminSession({ get: () => `Bearer ${token}` })?.email, OWNER)
    assert.equal(readAdminSession({ get: () => token }), null)
    assert.equal(readAdminSession({ get: () => undefined }), null)
    assert.equal(readAdminSession({}), null)
  })

  it('rejects anything it did not sign', () => {
    const [payload, signature] = session().split('.')
    assert.equal(verifyAdminToken(`${payload}x.${signature}`, { now }), null)
    assert.equal(verifyAdminToken(`${payload}.${signature}x`, { now }), null)
    assert.equal(verifyAdminToken(payload, { now }), null)
    assert.equal(verifyAdminToken('nonsense', { now }), null)
    assert.equal(verifyAdminToken(undefined, { now }), null)
  })

  it('rejects a token that has run out', () => {
    const token = session()
    assert.equal(verifyAdminToken(token, { now: () => clock + 8 * 24 * 60 * 60_000 }), null)
  })

  it('rejects a token minted for a previous owner', () => {
    const token = session()
    process.env.ADMIN_EMAIL = 'someone-else@example.com'
    try {
      assert.equal(verifyAdminToken(token, { now }), null)
    } finally {
      process.env.ADMIN_EMAIL = OWNER
    }
    assert.equal(verifyAdminToken(token, { now })?.email, OWNER)
  })
})
