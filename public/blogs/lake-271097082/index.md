安装下载适用 Gin 框架 :

```text
go get -u github.com/gin-gonic/gin
```

type H map\[string\]interface\{\} 内部提前封装

- 内层 JSON 里的 code：业务自定义码

作用：描述业务逻辑执行结果。

HTTP 状态码太少，无法区分复杂业务场景，所以前后端约定一套自定义编码，前端根据这个码 做 页面交互、逻辑跳转。

约定示例（通用规则）

200 \= 业务成功

1001 \= 账号不存在

1002 \= 密码错误

1003 \= 权限不足

- 实现对 any 这种泛型的 传空, 由于前端要写为 gin\.H\{\} 或者是 map\[string\]\{\}

使用 GIn 切换到Release 发布状态 :

gin\.SetMode\("release"\)

使用 GET 的基本模式

r :\= gin\.Default\(\) ; 创建并初始化 Gin 引擎实例

```text
等价于：
go
运行
r := gin.New()
r.Use(gin.Logger(), gin.Recovery())
● gin.New()：纯空引擎，无中间件
● gin.Logger()：日志中间件，打印请求日志
● gin.Recovery()：崩溃恢复，panic 不导致服务宕机
```

```text
r.GET("/索引地址" , 处理函数(c *gin.Context){})
*gin.Context     Gin 框架的核心上下文对象  
```
