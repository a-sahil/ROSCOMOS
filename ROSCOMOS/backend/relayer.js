/**
 * ROSCOMOS Gas Relayer
 * ----------------------
 * A lightweight Express server that acts as the PAYER for native Flow Cadence
 * transactions, sponsoring 100% of gas fees on behalf of users.
 *
 * ─── How Cadence gas sponsorship works ───────────────────────────────────────
 * Flow natively separates three roles in every Cadence transaction:
 *   proposer   → the user (selects the sequence number / nonce)
 *   authorizer → the user (signs their account state changes)
 *   payer      → THIS SERVER (signs as the fee payer, paying all gas)
 *
 * This is the Cadence equivalent of the "Gas-Free EVM Endpoint" described in
 * the official Flow docs.  Instead of running a full EVM Gateway node with
 * GAS_PRICE=0, we use the native payer-role separation at the protocol level —
 * which is actually cleaner and does not require any special infrastructure.
 *
 * ─── Concurrent key management (from official docs) ──────────────────────────
 * The Flow docs state:
 *   "Add enough identical keys to the Service Account to support the concurrent
 *    signing of EVM transactions."
 *
 * The same rule applies here.  Each Flow transaction requires a unique sequence
 * number for the key it uses.  If two requests arrive simultaneously and both
 * try to sign with key #0, one will fail with a sequence-number collision.
 *
 * Solution: add multiple identical keys to your payer account on-chain, then
 * list all their key IDs in SERVER_KEY_IDS below.  The relayer round-robins
 * across the pool so each concurrent request gets its own key.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *   cd backend
 *   npm install
 *   SERVER_ADDRESS=0xYOUR_ACCOUNT \
 *   SERVER_PRIVATE_KEY=YOUR_64_CHAR_HEX_KEY \
 *   SERVER_KEY_IDS=0,1,2,3 \
 *   node relayer.js
 *
 * ─── Adding multiple keys to your Flow account ───────────────────────────────
 * Run this Flow CLI command for each extra key you want to add:
 *   flow keys generate
 *   flow transactions send cadence/transactions/AddKey.cdc \
 *     --signer <your-account> --network testnet
 * Then add the new key index to SERVER_KEY_IDS.
 * The more concurrent users you expect, the more keys you need.
 */

import express from 'express'
import cors from 'cors'
import * as fcl from '@onflow/fcl'
import Elliptic from 'elliptic'
import SHA3 from 'sha3'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ─────────────────────────────────────────────────────────────────────────────
// Load .env file (Node 18+ built-in approach for ESM modules)
// ─────────────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const envPath = resolve(__dirname, '.env')
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && !process.env[key]) process.env[key] = val
  }
  console.log('✅ Loaded environment from .env')
} catch (_) {
  console.log('ℹ️  No .env file found — using shell environment variables')
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔑  CONFIGURATION
//
// SERVER_ADDRESS    – your funded Flow testnet account (with 0x prefix)
// SERVER_PRIVATE_KEY – 64-char hex private key for that account
// SERVER_KEY_IDS    – comma-separated list of key indices on that account.
//                     Add more keys on-chain to increase concurrency capacity.
//                     Example: "0,1,2,3" supports 4 simultaneous transactions.
// PORT              – HTTP port this server listens on (default: 3001)
// ─────────────────────────────────────────────────────────────────────────────
const SERVER_ADDRESS     = process.env.SERVER_ADDRESS     || '0xYOUR_PAYER_ACCOUNT_ADDRESS'
const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY || 'YOUR_64_CHAR_HEX_PRIVATE_KEY'
const SERVER_KEY_IDS     = (process.env.SERVER_KEY_IDS || '0')
                             .split(',')
                             .map(s => parseInt(s.trim(), 10))
const PORT               = parseInt(process.env.PORT || '3001', 10)

// ─────────────────────────────────────────────────────────────────────────────
// FCL configuration (testnet)
// ─────────────────────────────────────────────────────────────────────────────
fcl.config({
  'accessNode.api': 'https://rest-testnet.onflow.org',
  'flow.network':   'testnet',
})

// ─────────────────────────────────────────────────────────────────────────────
// Concurrent key pool
//
// Round-robins across the available key IDs so simultaneous requests each get
// their own key index, preventing sequence-number collisions.
// Per the official Flow docs, the number of keys in the pool determines how
// many transactions can be signed concurrently without collision.
// ─────────────────────────────────────────────────────────────────────────────
let keyPoolIndex = 0

function nextKeyId() {
  const id = SERVER_KEY_IDS[keyPoolIndex % SERVER_KEY_IDS.length]
  keyPoolIndex++
  return id
}

// ─────────────────────────────────────────────────────────────────────────────
// Signing helper — ECDSA P-256 + SHA3-256 (Flow's default algorithm)
// ─────────────────────────────────────────────────────────────────────────────
const ec = new Elliptic.ec('p256')

/**
 * Signs a raw message (hex string) with the server's private key.
 *
 * @param {string} message – hex-encoded signing payload from FCL
 * @returns {string}       – raw 64-byte r||s hex signature
 */
function signWithPrivateKey(message) {
  const key    = ec.keyFromPrivate(Buffer.from(SERVER_PRIVATE_KEY, 'hex'))
  const sha3   = new SHA3.SHA3(256)
  sha3.update(Buffer.from(message, 'hex'))
  const hash   = sha3.digest()
  const sig    = key.sign(hash)
  const r      = sig.r.toArrayLike(Buffer, 'be', 32)
  const s      = sig.s.toArrayLike(Buffer, 'be', 32)
  return Buffer.concat([r, s]).toString('hex')
}

// ─────────────────────────────────────────────────────────────────────────────
// Express app
// ─────────────────────────────────────────────────────────────────────────────
const app = express()
app.use(cors({ origin: '*' }))   // In production, restrict to your frontend domain
app.use(express.json({ limit: '1mb' }))

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sponsor
//
// FCL on the frontend calls this endpoint during the payer-signing phase.
// It receives the unsigned transaction envelope (signable), signs it with
// the next available key from the pool, and returns the signature.
//
// Body:     { signable: FCLSignable }
// Response: { addr, keyId, signature }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/sponsor', async (req, res) => {
  const requestTime = Date.now()

  try {
    const { signable } = req.body

    if (!signable || !signable.message) {
      return res.status(400).json({
        error: 'Missing signable.message in request body',
        hint:  'The frontend must send { signable } from the FCL signing pipeline',
      })
    }

    // Pick the next key from the concurrent pool
    const keyId = nextKeyId()

    const userAddr = signable.voucher?.proposalKey?.address || 'unknown'
    console.log(`\n📨 /api/sponsor`)
    console.log(`   Proposer/Authorizer : ${userAddr}`)
    console.log(`   Payer key selected  : ${SERVER_ADDRESS} [key #${keyId}]`)
    console.log(`   Key pool size       : ${SERVER_KEY_IDS.length} key(s) — supports ${SERVER_KEY_IDS.length} concurrent tx`)

    const signature = signWithPrivateKey(signable.message)

    const elapsed = Date.now() - requestTime
    console.log(`✅ Payer signature produced in ${elapsed}ms — user pays $0 in gas`)
    console.log(`   Key pool round-robin index: ${keyPoolIndex - 1} → key #${keyId}\n`)

    return res.json({
      addr:      fcl.sansPrefix(SERVER_ADDRESS),
      keyId,
      signature,
    })
  } catch (err) {
    console.error('❌ Relayer signing error:', err)
    return res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/account
//
// Called by the frontend's serverAuthorization function BEFORE building the
// FCL transaction.  Returns the payer's address and key ID so FCL can resolve
// the correct sequence number from the blockchain for the payer account.
//
// Without this, the frontend would use the USER's addr/keyId for the payer
// slot — which causes FCL to fetch the wrong sequence number and crash.
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/account', (_req, res) => {
  res.json({
    address: fcl.sansPrefix(SERVER_ADDRESS),
    keyId:   SERVER_KEY_IDS[keyPoolIndex % SERVER_KEY_IDS.length],
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health
// Liveness check — call this to confirm the relayer is running before a demo.
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const isConfigured = SERVER_ADDRESS !== '0xYOUR_PAYER_ACCOUNT_ADDRESS'
  res.json({
    status:          isConfigured ? 'ok' : 'unconfigured',
    message:         'ROSCOMOS Gas Relayer',
    payerAddress:    SERVER_ADDRESS,
    keyPool:         SERVER_KEY_IDS,
    concurrencySlots: SERVER_KEY_IDS.length,
    network:         'testnet',
    sponsoredGas:    true,
    warning:         isConfigured ? null : 'SERVER_ADDRESS is still the placeholder — set env vars before demo',
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const isConfigured = SERVER_ADDRESS !== '0xYOUR_PAYER_ACCOUNT_ADDRESS'

  console.log('\n🚀 ROSCOMOS Gas Relayer — Cadence Payer Service')
  console.log('─────────────────────────────────────────────────────')
  console.log(`   Network          : Flow Testnet`)
  console.log(`   Payer account    : ${SERVER_ADDRESS}`)
  console.log(`   Key pool         : [${SERVER_KEY_IDS.join(', ')}] (${SERVER_KEY_IDS.length} key${SERVER_KEY_IDS.length > 1 ? 's' : ''})`)
  console.log(`   Concurrency      : up to ${SERVER_KEY_IDS.length} simultaneous transaction${SERVER_KEY_IDS.length > 1 ? 's' : ''}`)
  console.log(`   Sponsor endpoint : http://localhost:${PORT}/api/sponsor`)
  console.log(`   Health check     : http://localhost:${PORT}/api/health`)
  console.log('─────────────────────────────────────────────────────')
  console.log('⛽ All gas fees will be paid by this server.\n')

  if (!isConfigured) {
    console.warn('⚠️  WARNING: Using placeholder SERVER_ADDRESS.')
    console.warn('   Set the following environment variables before running:')
    console.warn('     SERVER_ADDRESS      – your funded Flow testnet account')
    console.warn('     SERVER_PRIVATE_KEY  – 64-char hex private key')
    console.warn('     SERVER_KEY_IDS      – comma-separated key indices, e.g. "0,1,2,3"')
    console.warn('')
    console.warn('   To add more keys for concurrency:')
    console.warn('     flow keys generate')
    console.warn('     flow transactions send cadence/transactions/AddKey.cdc \\')
    console.warn('       --signer <your-account> --network testnet')
    console.warn('   Then add the new index to SERVER_KEY_IDS.\n')
  }

  if (SERVER_KEY_IDS.length === 1) {
    console.warn('ℹ️  Running with 1 key — suitable for demo / low-traffic use.')
    console.warn('   For production concurrency, add more keys and set SERVER_KEY_IDS=0,1,2,3\n')
  }
})
