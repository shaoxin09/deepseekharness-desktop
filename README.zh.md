# DeepSeek Harness Desktop


[English](README.md) | 中文



## 界面预览

![工作区](assets/working.png) 
![API 密钥](assets/setkey.png) 
![模型](assets/model.png) 
![Agent 预设](assets/agentset.png) 
![MCP](assets/mcp.png) 

## 环境要求

- Node.js ^22.19.0 或 >=24.0.0（仅构建时需要；打包后的应用自带运行时）
- macOS：Xcode 命令行工具
- Windows：Visual Studio Build Tools

## 开发

    npm install
    npm start

如需让桌面壳指向 Harness 的源码 checkout 而非 npm 包：

    DSH_CLI_BIN=/path/to/deepseek-harness/apps/cli/lib/bin.js npm start

该 checkout 需先构建：pnpm install && pnpm run build。

## 打包

    npm run pack        # 未打包的应用，输出到 release/
    npm run dist:mac    # macOS arm64 .dmg + .zip
    npm run dist:win    # Windows x64 安装程序 + 便携版 .exe

macOS 本地构建默认不签名。正式分发需配置 Apple Developer ID（含公证）与
Windows 代码签名证书。

如果 Electron 二进制下载缓慢或失败，可改用镜像：

    ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm run dist:mac

## 目录结构

    src/
      main.mjs        Electron 主进程
      dsh-server.mjs  dsh web 子进程管理
      electron-builder.yml
    .github/workflows/build.yml


## 许可证

[MIT](LICENSE) 免费
