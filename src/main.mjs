/**
 * DeepSeek Harness desktop shell: Electron main process.
 *
 * Boots the dsh web server as a child process, opens a native window over the
 * loopback URL, and tears the server down when the app quits.
 */

import { app, BrowserWindow, dialog, shell } from 'electron'
import { startDshWeb } from './dsh-server.mjs'

const APP_TITLE = 'DeepSeek Harness'

/** @type {{ url: string, child: import("node:child_process").ChildProcess, stop: () => void } | null} */
let server = null
/** @type {BrowserWindow | null} */
let mainWindow = null
let quitting = false

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
  app.whenReady().then(boot)
}

/** @param {string} url */
function createWindow(url) {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: APP_TITLE,
    backgroundColor: '#0f1115',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // Anything the dsh UI opens is loopback (same origin) or an external link.
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith(server ? server.url : 'http://127.0.0.1')) {
      return { action: 'allow' }
    }
    void shell.openExternal(target)
    return { action: 'deny' }
  })

  // Avoid a white flash: show only after the first paint.
  win.once('ready-to-show', () => win.show())

  win.on('closed', () => { mainWindow = null })
  return win
}

async function boot() {
  let started
  try {
    started = await startDshWeb()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    dialog.showErrorBox(APP_TITLE + ' failed to start', message)
    app.quit()
    return
  }

  server = started

  // Report a server crash after a successful start.
  server.child.on('exit', (code, signal) => {
    if (quitting || !mainWindow) return
    dialog.showErrorBox(
      APP_TITLE + ' stopped',
      'The DeepSeek Harness server exited unexpectedly (code=' + code + ', signal=' + signal + ').'
    )
    app.quit()
  })

  mainWindow = createWindow(server.url)
  try {
    await mainWindow.loadURL(server.url)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    dialog.showErrorBox(APP_TITLE + ' failed to open', message)
    app.quit()
  }
}

app.on('before-quit', () => { quitting = true })
app.on('will-quit', () => { if (server) server.stop() })
app.on('window-all-closed', () => { app.quit() })
