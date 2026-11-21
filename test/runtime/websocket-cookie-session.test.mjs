import assert from 'node:assert/strict'
import {IncomingMessage} from 'node:http'
import {Socket} from 'node:net'
import {createHmac} from 'node:crypto'
import {test} from 'node:test'

import cookieSession from '../../lib/units/websocket/middleware/cookie-session.js'

const currentKey = 'synthetic-current-key'
const previousKey = 'synthetic-previous-key'
const sessionValue = Buffer.from(JSON.stringify({
  jwt: {email: 'test@example.invalid'}
})).toString('base64')

function signedCookie(key) {
  const signature = createHmac('sha1', key).update('ssid=' + sessionValue).digest('base64url')
  return 'ssid=' + sessionValue + '; ssid.sig=' + signature
}

function readSession(cookie, keys = [currentKey]) {
  const request = new IncomingMessage(new Socket())
  if (cookie !== undefined) {
    request.headers.cookie = cookie
  }
  let called = false
  let jwt
  cookieSession({name: 'ssid', keys})({request}, function(error) {
    assert.ifError(error)
    called = true
    // Match the lazy session read in STF's authentication middleware.
    jwt = request.session.jwt
  })
  assert.equal(called, true)
  return jwt
}

test('missing cookies produce an unauthenticated session', function() {
  assert.equal(readSession(), undefined)
})

test('valid signed sessions retain their identity', function() {
  assert.deepEqual(readSession(signedCookie(currentKey)), {email: 'test@example.invalid'})
})

test('invalid signatures are rejected without crashing', function() {
  assert.equal(readSession(signedCookie(previousKey)), undefined)
})

test('unsigned sessions cannot supply an identity', function() {
  assert.equal(readSession('ssid=' + sessionValue), undefined)
})

test('previous signing keys remain valid during rotation', function() {
  assert.deepEqual(readSession(signedCookie(previousKey), [currentKey, previousKey]),
    {email: 'test@example.invalid'})
})
