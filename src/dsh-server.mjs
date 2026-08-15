/**
 * Launches the dsh web server as a child process and waits until it
 * announces its loopback URL.
 *
 * dsh runs under Electron's bundled Node (ELECTRON_RUN_AS_NODE), so the
 * packaged app does not need a system Node.js installation.
 */

import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)

const URL_PREFIX = 'http://127.0.0.1:'
const READY_LINE_PREFIX = 'dsh web: ' + URL_PREFIX

/**
 * Parse the loopback URL out of accumulated stdout, or return null until the
 * readiness line shows up.
 * @param {string} stdout
 * @returns {string | null}
 */
function readyUrl(stdout) {
  const idx = stdout.indexOf(READY_LINE_PREFIX)
  if (idx === -1) return null
  let port = ''
  for (let i = idx + READY_LINE_PREFIX.length; i < stdout.length; i++) {
    const ch = stdout[i]
    if (ch >= '0' && ch <= '9') port += ch
    else break
  }
  return port === '' ? null : URL_PREFIX + port
}

/**
 * Resolve the dsh CLI entry (lib/bin.js). DSH_CLI_BIN overrides the lookup
 * for developing against a source checkout.
 * @returns {string}
 */
export function locateDshBin() {
  const override = process.env.DSH_CLI_BIN
  if (override) return override
  const pkg = require.resolve('@deepseek-ai/dsh/package.json')
  return join(dirname(pkg), 'lib', 'bin.js')
}

/**
 * Stop a child process: SIGTERM first, SIGKILL after a grace period.
 * @param {import("node:child_process").ChildProcess} child
 */
function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  child.kill('SIGTERM')
  const timer = setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
  }, 5000)
  if (timer.unref) timer.unref()
}

/**
 * Start "dsh web --port 0" and resolve once the readiness line announces the
 * loopback URL. The OS assigns a free port, so launches never collide.
 *
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ url: string, child: import("node:child_process").ChildProcess, stop: () => void }>}
 */
export function startDshWeb({ timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const bin = locateDshBin()
    // The dsh loader needs Node internals for its HMR service.
    const child = spawn(process.execPath, ['--expose-internals', bin, 'web', '--port', '0'], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let settled = false
    let timer

    const settle = (err, url) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (err) reject(err)
      else resolve({ url, child, stop: () => stopChild(child) })
    }

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
      process.stdout.write(chunk)
      if (!settled) {
        const url = readyUrl(stdout)
        if (url) settle(null, url)
      }
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
      process.stderr.write(chunk)
    })

    child.on('error', (err) => {
      settle(new Error('Failed to start dsh: ' + err.message), null)
    })

    child.on('exit', (code, signal) => {
      if (settled) return
      const detail = (stderr || stdout).trim()
      const reason = detail ? ': ' + detail : ''
      settle(new Error('dsh exited before becoming ready (code=' + code + ', signal=' + signal + ')' + reason), null)
    })

    timer = setTimeout(() => {
      const detail = stderr.trim() ? ': ' + stderr.trim() : ''
      settle(new Error('dsh did not become ready within ' + timeoutMs + 'ms' + detail), null)
    }, timeoutMs)
  })
}
