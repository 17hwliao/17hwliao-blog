用于浏览器直接请求这个接口唤起下载

Go复制代码

```text
c.Header("Content-Type", "application/octet-stream")              // 表示是文件流，唤起浏览器下载，一般设置了这个，就要设置文件名
c.Header("Content-Disposition", "attachment; filename=3.文件下载.go") // 用来指定下载下来的文件名
c.File("3.文件下载.go")
```

1. 要设置Content\-Type，唤起浏览器下载
2. 只能是get请求

前端请求后端接口，然后唤起浏览器下载

JavaScript复制代码

```text
c.Header("fileName", "xxx.png")
c.Header("msg", "文件下载成功")
c.File("uploads/12.png")
```

前端唤起浏览器下载的本质

JavaScript复制代码

```text
<a href="文件地址" download="文件名">文件下载</a>
```

JavaScript复制代码

```text
async downloadFile(row) {
   this.$http({
      method: 'post',
      url: 'file/upload',
      data:postData,
      responseType: "blob"
   }).then(res => {
      const _res = res.data
      let blob = new Blob([_res], {
            type: 'application/png'
          });
      let downloadElement = document.createElement("a");
      let href = window.URL.createObjectURL(blob); //创建下载的链接
      downloadElement.href = href;
      downloadElement.download = res.headers["fileName"]; //下载后文件名
      document.body.appendChild(downloadElement);
      downloadElement.click(); //点击下载
      document.body.removeChild(downloadElement); //下载完成移除元素
      window.URL.revokeObjectURL(href); //释放掉blob对象
    })}
```

```text
r.GET("/file/*filepath", func(c *gin.Context) {
		fp := c.Param("filepath")
		fp = strings.TrimPrefix(fp, "/")
		// 防止路径穿越
		clean := filepath.Clean(fp)
		if strings.Contains(clean, "..") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
			return}
		info, err := os.Stat(clean)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
			return
		}
		if info.IsDir() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "not a file"})
			return
		}
		c.File(clean)
	})
```

方法解读 :

### 1\. strings\.TrimPrefix\(\)

**函数**：`strings.TrimPrefix(s, prefix string) string`**作用**：**删除字符串开头指定前缀**

- 本例：`strings.TrimPrefix(fp, "/")`
- 场景：路由拿到的路径可能自带开头 `/`，统一删掉
- 例子：

- `/a/b.txt` → `a/b.txt`
- `file.txt` → 不变**用途**：统一路径格式，避免前缀斜杠干扰路径判断

### 2\. filepath\.Clean\(\)

**函数**：`filepath.Clean(path string) string`**核心功能（路径标准化）**

1. 消除 `.` 当前目录、`..` 上级目录
2. 合并多余连续斜杠
3. 去掉末尾多余 `/`
4. 自动修正非法路径格式

**示例**

- `a/../b` → `b`
- `./upload//1.txt` → `upload/1.txt`
- `../../etc/passwd` → `../../etc/passwd`（**不会自动删掉**）

**安全意义**：把用户传入的**杂乱路径转为系统标准路径**，方便后续判断是否存在越界。

### 3\. os\.Stat\(\)

**函数**：`os.Stat(name string) (FileInfo, error)`**作用**：**获取文件 / 目录元信息，不打开文件** 返回两个值：

1. `FileInfo`：文件信息（大小、修改时间、是否文件夹）
2. `err`：错误（文件不存在、权限不足等）

**常用判断**

- `err != nil` → 文件不存在 → 返回 404
- `info.IsDir()` → 是文件夹，拒绝访问

**特点**：轻量查询，只读属性，**不读取文件内容**。

标准库中的方法汇总 :

- `r.GET()`：注册 GET 请求路由
- `c.Param()`：获取路由占位符参数
- `c.JSON()`：返回 JSON 格式响应
- `c.File()`：直接响应本地文件
- `http.StatusXXX`：HTTP 状态码常量
- `strings.TrimPrefix`：剔除前缀字符串
- `filepath.Clean`：路径清洗标准化
- `os.Stat`：获取文件状态信息
- `info.IsDir()`：判断是否为目录

最好的做法 :

调下载接口的请求，后端不返回实际文件内容，而是生成一个临时下载地址

前端构造a标签，再请求这个接口唤起浏览器下载

## Content\-Type 命令表

**HTTP 报文头部字段**，用来告诉客户端 / 服务端：**本次传输的数据是什么格式**，浏览器 / 服务器会根据它解析内容。

<table class="ne-table" id="sID03"><tbody><tr><td width="375"><p class="ne-p" id="uceabdcf4"><strong><span class="ne-text">取值</span></strong></p></td><td width="375"><p class="ne-p" id="u610ed2d0"><strong><span class="ne-text">用途</span></strong></p></td></tr><tr><td width="375"><p class="ne-p" id="u0794fd2b"><code class="ne-code"><span class="ne-text">text/html; charset=utf-8</span></code></p></td><td width="375"><p class="ne-p" id="ue13bfb53"><span class="ne-text">返回 HTML 页面</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u0e531203"><code class="ne-code"><span class="ne-text">application/json; charset=utf-8</span></code></p></td><td width="375"><p class="ne-p" id="u7490718d"><span class="ne-text">返回 JSON 数据</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u58800404"><code class="ne-code"><span class="ne-text">text/plain; charset=utf-8</span></code></p></td><td width="375"><p class="ne-p" id="u49a921c6"><span class="ne-text">纯文本</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u18bfe0cb"><code class="ne-code"><span class="ne-text">application/octet-stream</span></code></p></td><td width="375"><p class="ne-p" id="u47d3ae45"><span class="ne-text">二进制流，</span><strong><span class="ne-text">文件下载</span></strong></p></td></tr><tr><td width="375"><p class="ne-p" id="u4c4362d7"><code class="ne-code"><span class="ne-text">multipart/form-data</span></code></p></td><td width="375"><p class="ne-p" id="u927ba67a"><span class="ne-text">表单 + 文件上传（客户端用）</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u8f980320"><code class="ne-code"><span class="ne-text">image/jpeg</span></code></p><p class="ne-p" id="u63801d9c"><span class="ne-text"> / </span><code class="ne-code"><span class="ne-text">image/png</span></code></p></td><td width="375"><p class="ne-p" id="u77d89afd"><span class="ne-text">图片</span></p></td></tr></tbody></table>

## Content\-Disposition

属于 **HTTP 响应头**，作用：告诉浏览器**收到内容后，是直接展示还是当成文件下载**。

<table class="ne-table" id="axZ4L"><tbody><tr><td width="250"><p class="ne-p" id="ubde28c78"><strong><span class="ne-text">固定取值</span></strong></p></td><td width="250"><p class="ne-p" id="u629f8a4b"><strong><span class="ne-text">用途</span></strong></p></td></tr><tr><td width="250"><p class="ne-p" id="u9bd2ee8a"><code class="ne-code"><span class="ne-text">inline</span></code></p></td><td width="250"><p class="ne-p" id="u6e3610aa"><span class="ne-text">内容在浏览器内直接打开</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u34b17508"><code class="ne-code"><span class="ne-text">attachment; filename="xxx.xxx"</span></code></p></td><td width="250"><p class="ne-p" id="ude76bb74"><span class="ne-text">强制触发文件下载，指定默认文件名</span></p></td></tr></tbody></table>
