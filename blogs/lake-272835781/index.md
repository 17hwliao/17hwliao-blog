### 局部中间件

直接作用于单个路由

Go复制代码  
c \. Abort\(\) \-\-&gt; 实现的是 拦截网络访问的需求 ;

c\.Next\(\) \-\-&gt; 放行 ;

```text
// /3.中间件.go
package main

import (
  "fmt"
  "github.com/gin-gonic/gin"
)

func Home(c *gin.Context) {
  fmt.Println("Home")
  c.String(200, "Home")
}
func M1(c *gin.Context) {
  fmt.Println("M1 请求部分")
  c.Next()
  fmt.Println("M1 响应部分")
} 
func M2(c *gin.Context) {
  fmt.Println("M2 请求部分")
  c.Next()
  fmt.Println("M2 响应部分")
}

func main() {
  r := gin.Default()
  r.GET("", M1, M2, Home)
  r.Run(":8080")
}
```

可以使用Abort进行拦截，使用Abort拦截之后，会原路返回

### 全局中间件

全局也就是路由组。这也就是给路由分组的意义

Go复制代码

```text
// /3.中间件.go
package main

import (
  "fmt"
  "github.com/gin-gonic/gin"
)

func Home(c *gin.Context) {
  fmt.Println("Home")
  c.String(200, "Home")
}
func M1(c *gin.Context) {
  fmt.Println("M1 请求部分")
  c.Abort()
  fmt.Println("M1 响应部分")
}
func M2(c *gin.Context) {
  fmt.Println("M2 请求部分")
  c.Next()
  fmt.Println("M2 响应部分")
}

func GM1(c *gin.Context) {
  fmt.Println("GM1 请求部分")
  c.Next()
  fmt.Println("GM1 响应部分")
}

func GM2(c *gin.Context) {
  fmt.Println("GM2 请求部分")
  c.Next()
  fmt.Println("GM2 响应部分")
}

func AuthMiddleware(c *gin.Context) {

}

func main() {
  r := gin.Default()
  g := r.Group("api")
  g.Use(GM1, GM2)
  g.GET("users", Home)
  r.Run(":8080")
}
```

### 中间件传递参数

Go复制代码

```text
c.Set("GM1", "GM1")
fmt.Println(c.Get("GM1"))
```
