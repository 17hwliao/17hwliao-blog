# Conda 常用命令速查

## 1\. 搜索可用的包（例如搜索 numpy）

conda search numpy

## 2\. 安装包（默认安装最新版）

conda install numpy

## 3\. 安装指定版本的包

conda install numpy\=1\.24\.3

## 4\. 更新包到最新版

conda update numpy

## 5\. 卸载包

conda remove numpy

## 6\. 列出当前环境中所有已安装的包

conda list

# 🌍 环境管理

## 1\. 创建一个名为 myenv 的 Python 3\.11 环境

conda create \-n myenv python\=3\.11

## 2\. 克隆一个已有的环境（例如克隆 base 环境到 myclone）

conda create \-\-clone base \-n myclone

## 3\. 查看所有环境及其路径

conda env list \# 或 conda info \-\-envs

## 4\. 激活环境（Windows / macOS / Linux 通用）

conda activate myenv

## 5\. 退出当前环境

conda deactivate

## 6\. 删除一个环境（彻底移除）

conda remove \-n myenv \-\-all

## 7\. 重命名环境（Conda 23\.11\+ 支持）

conda rename \-n old\_name new\_name

## 1\. 8\. 导出当前环境的完整配置（用于复现）

conda env export &gt; environment\.yml

## 2\. 9\. 从 environment\.yml 文件创建环境

conda env create \-f environment\.yml

# ⏪ 环境回滚（查看并恢复到历史版本） bash

## 1\. 查看当前环境的修改历史（每次安装/卸载/更新都会记录）

conda list \-\-revisions

## 2\. 回滚到指定的历史版本（例如 revision 3）

conda install \-\-revision 3

# 🧹 清理与瘦身 bash

## 1\. 预览可清理的缓存大小（不实际删除）

conda clean \-\-all \-\-dry\-run

## 2\. 彻底清理所有缓存（包缓存、索引缓存、日志等）

conda clean \-\-all

## 3\. 仅清理未使用的包文件（不影响当前使用的环境）

conda clean \-\-packages

# ⚙️ 频道（Channel）与配置 bash

## 1\. 添加频道（例如 conda\-forge）

conda config \-\-add channels conda\-forge

## 2\. 设置频道优先级为严格（避免混合频道导致依赖冲突）

conda config \-\-set channel\_priority strict

## 3\. 查看所有已配置的频道

conda config \-\-show channels

## 4\. 查看完整的 Conda 配置

conda config \-\-show

## 5\. 移除一个频道

conda config \-\-remove channels conda\-forge  
🧪 常用进阶命令  
bash

## 查看 Conda 版本

conda \-\-version

## 更新 Conda 自身到最新版

conda update conda

## 查看当前使用的 Python 解释器路径（在激活环境下）

where python \# Windows  
which python \# macOS / Linux

## 查看当前环境的信息（包括路径、使用的 Python 版本等）

### conda info

## 🗺️ 环境变量配置（Windows 示例）

说明：Conda 在安装时会自动将以下路径添加至系统 PATH，一般不需要手动配置。  
如果因特殊原因需要手动添加，可参考下面的步骤（类似 pyenv 的配置方式）。

第 1 步：找到 Conda 安装路径  
Miniconda / Anaconda 默认安装位置（以用户安装为例）：

text  
C:\\Users\\你的用户名\\miniconda3  
或

text  
C:\\Users\\你的用户名\\anaconda3  
第 2 步：添加 CONDA\_HOME 变量（用户变量）  
打开 系统属性 → 环境变量。

在 用户变量 区域点击 新建。

输入：

text  
变量名：CONDA\_HOME  
变量值：C:\\Users\\你的用户名\\miniconda3 （改成你的实际路径）  
点击 确定。

第 3 步：编辑 Path 变量（用户变量）  
在 用户变量 区域找到 Path，选中并点击 编辑。

点击 新建，依次添加以下两条：

text  
%CONDA\_HOME%  
%CONDA\_HOME%\\Scripts  
点击 确定 保存。

第 4 步：验证配置  
打开 新的命令提示符 或 PowerShell，运行：

bash  
conda \-\-version  
若能正常显示版本号（如 conda 24\.9\.2），说明环境变量已生效。

💡 提示：以上命令在 Windows、macOS、Linux 下通用（路径风格除外）。  
如果你主要使用 Windows，建议配合 Anaconda Prompt 或 PowerShell 使用，体验更好。
