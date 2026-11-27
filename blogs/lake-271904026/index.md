如果有多个规则，使用逗号分隔 binding:"required","min\=2" ;

Go复制代码

```text
// 不能为空，并且不能没有这个字段
required： 必填字段，如：binding:"required"  

// 针对字符串的长度
min 最小长度，如：binding:"min=5"
max 最大长度，如：binding:"max=10"
len 长度，如：binding:"len=6"

// 针对数字的大小
eq 等于，如：binding:"eq=3"
ne 不等于，如：binding:"ne=12"
gt 大于，如：binding:"gt=10"
gte 大于等于，如：binding:"gte=10"
lt 小于，如：binding:"lt=10"
lte 小于等于，如：binding:"lte=10"

// 针对同级字段的
eqfield 等于其他字段的值，如：PassWord string `binding:"eqfield=Password"`
nefield 不等于其他字段的值


- 忽略字段，如：binding:"-" 或者不写

// 枚举  只能是red 或green
oneof=red green 

// 字符串限制 ; 
contains=fengfeng  // 包含fengfeng的字符串
excludes // 不包含
startswith  // 字符串前缀
endswith  // 字符串后缀
alphanum // 只能包含数字和字符

// 数组
dive  // dive后面的验证就是针对数组中的每一个元素
当需要控制数组放置空数组传回的时候 使用的binding规则是 min = 1 ; 

// 网络验证
ip
ipv4
ipv6
uri
url
// uri 在于I(Identifier)是统一资源标示符，可以唯一标识一个资源。
// url 在于Locater，是统一资源定位符，提供找到该资源的确切路径 

// 日期验证  1月2号下午3点4分5秒在2006年
datetime=2006-01-02 

//实现数据库映射列名
column:
```

## 自己编写binding规则

### 错误信息显示中文

```text
创建一个翻译器 
这个流程分三层：
1. 创建通用翻译器（ut.New）
zh := zh.New()                    // 创建中文语言环境（locale）
uni := ut.New(zh.New(), zh.New()) // 创建通用翻译器，传入语言备选列表
ut.New 参数是可变长 ut.Translator 列表（优先顺序），比如 ut.New(zh, en) 表示优先中文，降级英文。zh.New() 返回实现 ut.Translator 接口的对象，包含该语言的数字格式、时间格式、复数规则等。
2. 获取具体翻译实例（uni.GetTranslator）
trans, _ = uni.GetTranslator("zh")
从通用翻译器中取出针对 "zh" 这个语言的具体翻译器实例。它负责实际管理消息模板、参数格式化等。
3. 拿到 validator 引擎并注册翻译
v, ok := binding.Validator.Engine().(*validator.Validate)
- binding.Validator 是 Gin 内部默认使用的验证器（包装了 go-playground/validator）
- .Engine() 返回底层的 validator.Validate 实例
- 类型断言为 *validator.Validate 以便调用其方法
zh_translations.RegisterDefaultTranslations(v, trans)
把中文翻译器注册到 validator 引擎上，覆写所有内置校验 tag（required、min、max 等）的错误消息模板为中文。
Go复制代码
```

```text
package main

import (
  "fmt"
  "github.com/gin-gonic/gin"
  "github.com/gin-gonic/gin/binding"
  "github.com/go-playground/locales/zh"
  "github.com/go-playground/universal-translator"
  "github.com/go-playground/validator/v10"
  zh_translations "github.com/go-playground/validator/v10/translations/zh"
  "net/http"
  "strings"
)

var trans ut.Translator

func init() {
  // 创建翻译器
  uni := ut.New(zh.New())
  trans, _ = uni.GetTranslator("zh")

  // 注册翻译器
  v, ok := binding.Validator.Engine().(*validator.Validate)
  if ok {
    _ = zh_translations.RegisterDefaultTranslations(v, trans)
  }
}

func ValidateErr(err error) string {
  errs, ok := err.(validator.ValidationErrors)
  if !ok { 
    return err.Error()
  }
  var list []string
  for _, e := range errs {
    list = append(list, e.Translate(trans))
  }
  return strings.Join(list, ";")
}

type User struct {
  Name  string `json:"name" binding:"required"`
  Email string `json:"email" binding:"required,email"`
}

func main() {
  r := gin.Default()
  // 注册路由
  r.POST("/user", func(c *gin.Context) {
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
      // 参数验证失败
      c.String(200, ValidateErr(err))
      return
    }

    // 参数验证成功
    c.JSON(http.StatusOK ,  gin.H{
      "message": fmt.Sprintf("Hello, %s! Your email is %s.", user.Name, user.Email),
    })
  })

  // 启动HTTP服务器
  r.Run()
}
```

### 字段名也显示中文

Go复制代码

```text
func init() {
  // 创建翻译器
  uni := ut.New(zh.New())
  trans, _ = uni.GetTranslator("zh")

  // 注册翻译器
  v, ok := binding.Validator.Engine().(*validator.Validate)
  if ok {
    _ = zh_translations.RegisterDefaultTranslations(v, trans)
  }

  v.RegisterTagNameFunc(func(field reflect.StructField) string {
    label := field.Tag.Get("label")
    if label == "" {
      return field.Name
    }
    return label
  })
}
```

### 错误信息和错误字段一起返回

![](</blogs/_assets/lakebook/ba984cddd4567c933d56dc8e.png>)

Go复制代码

```text
package main

import (
  "fmt"
  "github.com/gin-gonic/gin"
  "github.com/gin-gonic/gin/binding"
  "github.com/go-playground/locales/zh"
  "github.com/go-playground/universal-translator"
  "github.com/go-playground/validator/v10"
  zh_translations "github.com/go-playground/validator/v10/translations/zh"
  "net/http"
  "reflect"
  "strings"
)

var trans ut.Translator

func init() {
  // 创建翻译器
  uni := ut.New(zh.New())
  trans, _ = uni.GetTranslator("zh")

  // 注册翻译器
  v, ok := binding.Validator.Engine().(*validator.Validate)
  if ok {
    _ = zh_translations.RegisterDefaultTranslations(v, trans)
  }

  v.RegisterTagNameFunc(func(field reflect.StructField) string {
    label := field.Tag.Get("label")
    if label == "" {
      label = field.Name
    }
    name := field.Tag.Get("json")
    return fmt.Sprintf("%s---%s", name, label)
  })
}

/*
{
  "name": "name参数必填",
}
*/

func ValidateErr(err error) any {
  errs, ok := err.(validator.ValidationErrors)
  if !ok {
    return err.Error()
  }
  var m = map[string]any{}
  for _, e := range errs {
    msg := e.Translate(trans)
    _list := strings.Split(msg, "---")
    m[_list[0]] = _list[1]
  }
  return m
}

type User struct {
  Name  string `json:"name" binding:"required" label:"用户名"`
  Email string `json:"email" binding:"required,email"`
}

func main() {
  r := gin.Default()
  // 注册路由
  r.POST("/user", func(c *gin.Context) {
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
      // 参数验证失败
      c.JSON(200, map[string]any{
        "code": 7,
        "msg":  "验证错误",
        "data": ValidateErr(err),
      })
      return
    }

    // 参数验证成功
    c.JSON(http.StatusOK, gin.H{
      "message": fmt.Sprintf("Hello, %s! Your email is %s.", user.Name, user.Email),
    })
  })

  // 启动HTTP服务器
  r.Run()
}
```

### 自定义校验

````text
## 这个文件在做什么？

### 1️⃣ 自定义验证标签名（第30-37行）

```go
v.RegisterTagNameFunc(func(field reflect.StructField) string {
    label := field.Tag.Get("label")
    name := field.Tag.Get("json")
    return fmt.Sprintf("%s---%s", name, label)
})
```

- 通过反射读取结构体字段上的 `label` 标签
- 把错误信息格式改成 `json字段名---中文标签名` 的形式
- 这样错误提示就能显示友好的中文名称了

### 2️⃣ 自定义验证器 `fip`（第39-54行）

```go
v.RegisterValidation("fip", func(fl validator.FieldLevel) bool {
    ip, ok := fl.Field().Interface().(string)
    if ok && ip != "" {
        ipObj := net.ParseIP(ip)
        return ipObj != nil
    }
    return true
})
```

- 注册了一个叫 `fip` 的自定义验证规则
- 作用是：如果传了 IP 值，就校验它是不是合法的 IP 地址
- 没传值（空字符串）则跳过校验

### 3️⃣ 使用方式（第86行）

```go
Ip string `json:"ip" binding:"fip=1234" label:"ip地址"`
```

- `binding:"fip=1234"`：使用自定义的 `fip` 验证器（等号后面的 `1234` 是参数，可以通过 `fl.Param()` 获取）
- `label:"ip地址"`：自定义中文标签名，用于错误提示

### 4️⃣ 改进的错误处理 `ValidateErr`（第63-79行）

- 把错误信息改成了 `map` 格式，返回 __JSON 结构的数据__
- 对 `fip` 验证器的错误单独处理，显示 `"该ip地址不符合要求"`
- 示例返回：

```json
{
    "code": 7,
    "msg": "验证错误",
    "data": {"ip": "该ip地址不符合要求"}
}
````

\`\`\`

Go复制代码

```text
package main

import (
  "fmt"
  "github.com/gin-gonic/gin"
  "github.com/gin-gonic/gin/binding"
  "github.com/go-playground/locales/zh"
  "github.com/go-playground/universal-translator"
  "github.com/go-playground/validator/v10"
  zh_translations "github.com/go-playground/validator/v10/translations/zh"
  "net"
  "net/http"
  "reflect"
  "strings"
)

var trans ut.Translator

func init() {
  // 创建翻译器
  uni := ut.New(zh.New())
  trans, _ = uni.GetTranslator("zh")

  // 注册翻译器
  v, ok := binding.Validator.Engine().(*validator.Validate)
  if ok {
    _ = zh_translations.RegisterDefaultTranslations(v, trans)
  }

  v.RegisterTagNameFunc(func(field reflect.StructField) string {
    label := field.Tag.Get("label")
    if label == "" {
      label = field.Name
    }
    name := field.Tag.Get("json")
    return fmt.Sprintf("%s---%s", name, label)
  })

  v.RegisterValidation("fip", func(fl validator.FieldLevel) bool {
    fmt.Println("fl.Field(): ", fl.Field())
    fmt.Println("fl.FieldName(): ", fl.FieldName())
    fmt.Println("fl.StructFieldName(): ", fl.StructFieldName())
    fmt.Println("fl.Parent(): ", fl.Parent())
    fmt.Println("fl.Top(): ", fl.Top())
    fmt.Println("fl.Param(): ", fl.Param())

    ip, ok := fl.Field().Interface().(string)
    if ok && ip != "" {
      // 传了值就去校验是不是IP地址
      ipObj := net.ParseIP(ip)
      return ipObj != nil
    }
    return true
  })
}

/*
{
  "name": "name参数必填",
}
*/

func ValidateErr(err error) any {
  errs, ok := err.(validator.ValidationErrors)
  if !ok {
    return err.Error()
  }
  var m = map[string]any{}
  for _, e := range errs {
    msg := e.Translate(trans)
    _list := strings.Split(msg, "---")
    if e.Tag() == "fip" {
      m[strings.Split(e.Field(), "---")[0]] = "该ip地址不符合要求"
      continue
    }
    m[_list[0]] = _list[1]
  }
  return m
}

func main() {
  r := gin.Default()
  // 注册路由
  r.POST("/user", func(c *gin.Context) {
    type User struct {
      Ip string `json:"ip" binding:"fip=1234" label:"ip地址"`
    }
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
      // 参数验证失败
      c.JSON(200, map[string]any{
        "code": 7,
        "msg":  "验证错误",
        "data": ValidateErr(err),
      })
      return
    }
    c.JSON(http.StatusOK, user)
  })

  // 启动HTTP服务器
  r.Run(":8080")
}
```
