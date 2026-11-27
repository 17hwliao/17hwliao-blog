路径查询

## 表格

<table class="ne-table" id="nZEUL"><tbody><tr><td width="250"><p class="ne-p" id="u4d077620"><strong><span class="ne-text">写法</span></strong></p></td><td width="250"><p class="ne-p" id="ua037d187"><strong><span class="ne-text">返回类型</span></strong></p></td><td width="250"><p class="ne-p" id="ue3d11b9e"><strong><span class="ne-text">适用场景</span></strong></p></td></tr><tr><td width="250"><p class="ne-p" id="u9d977487"><code class="ne-code"><span class="ne-text">c.Query("key")</span></code></p></td><td width="250"><p class="ne-p" id="u9bd9a92b"><span class="ne-text">string</span></p></td><td width="250"><p class="ne-p" id="u04a05672"><span class="ne-text">简单文本参数</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u3a0cba1e"><code class="ne-code"><span class="ne-text">c.GetQueryInt/Bool/...</span></code></p></td><td width="250"><p class="ne-p" id="uf7cff507"><span class="ne-text">对应原生类型</span></p></td><td width="250"><p class="ne-p" id="u9a508d5d"><span class="ne-text">少量数字 / 布尔参数</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u6c2196ad"><code class="ne-code"><span class="ne-text">ShouldBindQuery + 结构体</span></code></p></td><td width="250"><p class="ne-p" id="ud209efc5"><span class="ne-text">结构体各字段自动类型</span></p></td><td width="250"><p class="ne-p" id="u4dd5043d"><span class="ne-text">多参数、正式接口</span></p></td></tr></tbody></table>

## 查询参数

## Gin `c.Query` ↔ Spring `@RequestParam`

?key\=xxx&amp;name\=xxxx&amp;name\=yyyy 这种就被称为查询参数

查询参数不是GET请求专属的

Go复制代码

```text
name := c.Query("name")
age := c.DefaultQuery("age", "25")  //提供默认返回
keyList := c.QueryArray("key")
fmt.Println(name, age, keyList)
```

例如请求 ?name\=fengfeng&amp;age\=123&amp;key\=123&amp;key\=124，输出为：

Go复制代码

```text
fengfeng 123 [123 124]
```

## 动态参数

## 路径参数（Gin `c.Param` ↔ Spring `@PathVariable`）

用户的个人信息页面，他的路径

问号之前的部分 :

Go复制代码

```text
/users?id=123 // 查询参数的模式
/users/123 // 动态参数模式
```

Go复制代码

```text
r.GET("users/:id", func(c *gin.Context) {
  userID := c.Param("id")
  fmt.Println(userID)
})
```

## 关于接口测试工具

postman

apifox

注意：接口测试工具能走通的，前端请求不一定可以走通

1. get请求带请求体
2. ws加请求头

##
