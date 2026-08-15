# DeepSeek Harness Desktop

A free, open-source desktop edition of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), retaining all of its features. It runs the dsh web UI in a native window instead of a browser tab.

English | [中文](README.zh.md)


## Screenshots


![Workspace](assets/working.png) 
![API key](assets/setkey.png) 
![Models](assets/model.png) 
![Agent presets](assets/agentset.png) 
![MCP](assets/mcp.png) 

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
