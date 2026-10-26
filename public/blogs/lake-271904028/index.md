使用binding可以很好的完成参数的绑定

先创建结构体 , 然后实例化, 使用 ShouldBind方法实现判断参数绑定是否完善 ;

参数都 拼接到了 url 中去了可以直接使用 ;

### 查询参数

Go复制代码

```text
type User struct {
  Name string `form:"name"`
  Age  int    `form:"age"`
}
var user User
err := c.ShouldBindQuery(&user)
fmt.Println(user, err)
```

### 路径参数

Go复制代码

```text
type User struct {
  Name string `uri:"name"`
  ID   int    `uri:"id"`
}  
var user User
err := c.ShouldBindUri(&user)
fmt.Println(user, err)
```

参数 全部都存放到了 Request Body 参数中去了

### 表单参数

Go复制代码

```text
type User struct {
  Name string `form:"name"`
  Age  int    `form:"age"`
}
var user User
err := c.ShouldBind(&user)
fmt.Println(user, err)
```

注意：不能解析 x\-www\-form\-urlencoded的格式

### json参数

Go复制代码

```text
type User struct {
  Name string `json:"name"`
  Age  int    `json:"age"`
}
var user User
err := c.ShouldBindJSON(&user)
fmt.Println(user, err)
```

### header参数

Go复制代码

```text
type User struct {
  Name        string `header:"Name"`
  Age         int    `header:"Age"`
  UserAgent   string `header:"User-Agent\"`
  ContentType string `header:"Content-Type"`
}
var user User
err := c.ShouldBindHeader(&user)
fmt.Println(user, err)
```
