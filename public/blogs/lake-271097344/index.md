**r\.Static\("static", "static"\) // 第一个参数是别名，第二个才是实际路径**

- **第一个参数** `relativePath`：浏览器访问的 **URL 前缀（路由路径）**
- **第二个参数** `root`：服务器本地 **文件夹路径（物理目录）**
- **前端页面可以使用 relativePath/文件名 实现下载对应文件**
- **对应服务器实现上传的本地文件 \./root/文件名**

**r\.StaticFile\("abcd", "static/abc\.txt"\)**

- **直接访问一下的relative 路径就可以直接下载到后面规定的文件信息**

Go复制代码

```text
r.Static("static", "static") // 第一个参数是别名，第二个才是实际路径
r.StaticFile("abcd", "static/abc.txt")
```

静态文件的路径，不能再被路由使用了
