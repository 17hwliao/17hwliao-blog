conda 可以创建 多种语言的运行环境 , 不是很建议

常使用的命令 :

\# 1\. 查看可安装的 Python 3\.11 版本

pyenv install \-\-list \| findstr "3\.11"

\# 2\. 安装 Python 3\.11\.9

pyenv install 3\.11\.9

\# 3\. 查看已安装的版本

pyenv versions

\# 4\. 切换到 3\.11\.9

pyenv global 3\.11\.9

\# 5\. 验证

python \-\-version

\# 6\. 查看 python 路径

pyenv which python

\# 7\. 如果需要换版本

pyenv global 3\.12\.0

\# 8\. 卸载不需要的版本

pyenv uninstall 3\.10\.0

\# 查看你已安装的 Python 版本

pyenv versions

\# 查看 3\.11 稳定版（非 beta）

pyenv install \-\-list \| findstr "3\.11\. \[0\-9\]"

\# 安装稳定版（比如 3\.11\.9）

pyenv install 3\.11\.9

\# 切换到稳定版

pyenv global 3\.11\.9

\# 验证

python \-\-version

### 第 2 步：添加 PYENV 变量（用户变量）

在上半部分"用户变量"区域，点击 "新建"

弹出一个窗口：

text

变量名：PYENV

点击 "确定"

---

### 第 3 步：编辑 Path 变量（用户变量）

在上半部分"用户变量"区域，找到 Path，选中它，点击 "编辑"

点击右侧 "新建"，依次添加这两行：

text

C:\\Users\\17hwliao\\\.pyenv\\pyenv\-win\\bin  
C:\\Users\\17hwliao\\\.pyenv\\pyenv\-win\\shims

点击 "确定" 关闭编辑窗口
