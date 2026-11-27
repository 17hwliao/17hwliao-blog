现在大部分的前后端交互都是以json为主，所以gin中最常用的就是json响应

它的用法非常简单

- **外层** `http.StatusOK`：**HTTP 响应状态码**（给浏览器 / 接口调用方看）
- **内层** `"code": http.StatusOK`：**业务自定义返回码**（接口 JSON 数据里的字段，前后端约定使用）
- gin\.H\{ \} \=\= map\[string\]any 的投射 ;
- 上面一条补充一下
- gin\.H是map\[string\]interface\{\}的简写，方便快速构建JSON响应。等价于：

```text
map[string]interface{}{
    "code":    0,
    "message": "ok",
    "data":    map[string]interface{}{"service": "liuxi"},
}
```

Go复制代码

```text
c.JSON(200, gin.H{
  "code": 0,
  "msg": "ok",
})
```

但是我们都会对其进行一番封装，例如标准响应格式 code，data，msg

前端可以判断code的值来确定操作是否成功

不过code的定义就是每家公司都有不同的定义了

我比较习惯于 code\=0 为操作成功的状态码，非0值就是具体的错误码，这样可以方便定位错误

例如 code\=1001 是权限错误，code\=1002 是资源不存在等

Go复制代码

```text
package main

import (
	"awesomeProject5/data/res"
	"github.com/gin-gonic/gin"
)

func main() {
	h := gin.Default()

	h.GET("/login", func(c *gin.Context) {
		//c.JSON(http.StatusOK, gin.H{
		//	"code":    http.StatusOK,
		//	"message": "success",
		//	"data":    map[string]any{"message": "ws is a gay"},
		//})
		res.OKwithMsg(c, "success")

	})
	h.GET("/user", func(c *gin.Context) {
		res.OKwithData(c, map[string]any{
			"name":   "17hwliao",
			"age":    10,
			"gender": "male",
		}, "success")
	})

	h.POST("/user", func(c *gin.Context) {
		res.FailedWithMsg(c, "ws is a gay")
	})

	h.Run(":9090")
}

```

```text
package res

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type Response struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Data    any    `json:"data"`
}

var CodeMap = map[int]string{
    1001: "no access",
    1002: "access",
}

func response(c *gin.Context, code int, data any, message string) {
    c.JSON(200, Response{
       Code:    code,
       Data:    data,
       Message: message,
    })
}

func OKwithData(c *gin.Context, data any, msg string) {
    OK(c, data, msg)
}

func OKwithMsg(c *gin.Context, msg string) {
    OK(c, gin.H{}, msg)
}

func OK(c *gin.Context, data any, msg string) {
    response(c, http.StatusOK, data, msg)
}

func Failed(c *gin.Context, code int, data any, msg string) {
    response(c, code, data, msg)
}

func FailedWithMsg(c *gin.Context, msg string) {
    Failed(c, http.StatusInternalServerError, gin.H{}, msg)
}

func FailedWithCode(c *gin.Context, code int) {
    Failed(c, code, gin.H{}, CodeMap[code])
}
```

封装之后，使用就很简单了

Go复制代码

```text
res.OkWithMsg(c, "登陆成功")
res.OkWithData(c, map[string]any{
      "name": "枫枫",
    })
res.FailWithMsg(c, "参数错误")
```
