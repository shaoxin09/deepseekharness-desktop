# DeepSeek Harness Desktop

A cross-platform desktop wrapper for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It runs the dsh web UI in a native window instead of a browser tab.

English | [中文](README.zh.md)

## Features

- Native window over the DeepSeek Harness web UI
- No system Node.js needed at runtime (uses Electron's bundled Node)
- Loopback-only server, nothing exposed to the network
- macOS (arm64 / x64) and Windows (x64)
- Single-instance lock and clean shutdown of the underlying server

## How it works

The Electron main process:

1. Resolves the published @deepseek-ai/dsh CLI (lib/bin.js).
2. Spawns "dsh web --port 0" under Electron's bundled Node (ELECTRON_RUN_AS_NODE).
3. Waits for the "dsh web: http://127.0.0.1:PORT" readiness line.
4. Opens a native window on that URL and stops the server on quit.

## Prerequisites

- Node.js ^22.19.0 or >=24.0.0 (build time only; the packaged app bundles its own runtime)
- macOS: Xcode Command Line Tools
- Windows: Visual Studio Build Tools

## Develop

    npm install
    npm start

To point the shell at a source checkout of the harness instead of the npm package:

    DSH_CLI_BIN=/path/to/deepseek-harness/apps/cli/lib/bin.js npm start

That checkout must be built first: pnpm install && pnpm run build.

## Package

    npm run pack        # unpacked app in release/
    npm run dist:mac    # macOS arm64 .dmg + .zip
    npm run dist:win    # Windows x64 installer + portable .exe

macOS builds are unsigned by default. For distribution, configure an Apple
Developer ID (with notarization) and a Windows code-signing certificate.

If the Electron binary download is slow or fails, use a mirror:

    ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm run dist:mac

## Project layout

    src/
      main.mjs        Electron main process
      dsh-server.mjs  dsh web child-process management
    electron-builder.yml
    .github/workflows/build.yml

## Release

Push a "v*" tag (or run the workflow manually) to trigger the build-desktop
GitHub Actions workflow, which builds macOS arm64 and Windows x64 artifacts.

## License

[MIT](LICENSE)
