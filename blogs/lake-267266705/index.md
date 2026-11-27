实现 node 控制版本自由 :

本地实现远程控制node版本 :

下载 nvm工具 :

### 安装 nvm\-windows

1. **下载安装程序**

- 访问：[https://github\.com/coreybutler/nvm\-windows/releases](https://github.com/coreybutler/nvm-windows/releases)
- 下载 `nvm-setup.exe`（最新版）

常见的使用命令符 : \(掌握下面的这些就好\)

```text
# 查看已安装的 Node 版本
nvm list

# 查看可用的远程版本
nvm list available

# 安装指定版本（如 Node 20）
nvm install 20.11.0

# 安装最新 LTS 版本
nvm install lts

# 切换到指定版本
nvm use 20.11.0

# 设置默认版本（每次打开终端自动切换）
nvm alias default 20.11.0

# 卸载指定版本
nvm uninstall 18.19.0
```
