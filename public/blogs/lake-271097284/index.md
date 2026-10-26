`LoadHTMLGlob`加载一个目录下的所有html文件

使用 name 字段 实现多个html 实现 ;

`LoadHTMLFiles`加载单个html文件

load之后，下面才能用这个文件名

Go复制代码

```text
package main

import "github.com/gin-gonic/gin"

func main() {
  r := gin.Default()
  // 加载模板 只有这里加载了模板，下面才能用
  r.LoadHTMLGlob("templates/*")
  //r.LoadHTMLFiles("templates/index.html")
  r.GET("", func(c *gin.Context) {
    c.HTML(200, "index.html", nil)
  })
  r.Run(":8080")
}
```

HTML的第三个参数是可以向HTML中传递数据

但是现在都是前后端分离的时代了，也很少使用后端返回模板了，知道怎么用就好

Go复制代码

```text
c.HTML(200, "index.html", map[string]any{
    "title": "这是网页标题",
  })
```

html文件中使用

HTML复制代码

```text
<title>{{.title}}</title>
```

其实借助这个功能，可以很方便的修改网站的标题和logo

简单的扩展一下

关于部署：

1. 前端单独部署，后端单独部署
2. 前端打包之后，后端统一部署
