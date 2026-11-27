很多情况下，我们有存json的需求

那么就需要使用到gorm中的自定义数据类型了

自定义的数据类型必须实现 Scanner 和 Valuer 接口

简单说就是，在入库的时候转换一下，变成普通字符串进行存储，查询的时候，映射为结构体

## JSON自定义数据类型

json数据用的比较多

```text
依赖接口：sql.Scanner
go
运行
type Scanner interface {
    Scan(src interface{}) error
}
只要实现这个唯一方法，该结构体就可以直接映射数据库 JSONB 字段，gorm/sqlx 自动调用 Scan 完成自动解析。
```

实现 `sql.Scanner` **接口** 作用：**数据库查询读到 JSONB 字段时，自动把数据库二进制 JSON 数据，解析赋值到** `Info` **结构体**

```text
json.Unmarshal() 核心反序列化
go
运行
err := json.Unmarshal(bytes, &result)
● 包：encoding/json
● 作用：把 JSON 字节数组 []byte 反序列化为 Go 结构体
● 参数： 
  a. 第一个参数：JSON 原始字节
  b. 第二个参数：结构体指针，接收解析后数据
● 对应：json.Marshal 是结构体转 JSON 字节，这里是反向解析
```

Go复制代码

```text
type Info struct {
  Like []string `json:"like"`
  Addr string   `json:"addr"`
  Age  int      `json:"age"`
}

// Scan 实现 sql.Scanner 接口，Scan 将 value 扫描至 Jsonb
func (j *Info) Scan(value interface{}) error {
  bytes, ok := value.([]byte)    //断言(json.Marshal返回值为byte)
  if !ok {
    return errors.New(fmt.Sprint("Failed to unmarshal JSONB value:", value))
  }

  result := Info{}
  err := json.Unmarshal(bytes, &result)
  *j = result
  return err
}

// Value 实现 driver.Valuer 接口，Value 返回 json value   
下面的方法如果修改为指针方法会直接报运行时红错
func (j Info) Value() (driver.Value, error) {
  return json.Marshal(j)
}
```

注意：这里千万不要自作聪明，去改指针方法或者接受者方法，Scan是指针方法，Value是接受者方法

插入数据

Go复制代码

```text
type User struct {
  ID   int64
  Name string `gorm:"size:32"`
  Info Info   `gorm:"type:longtext" json:"info"`
}
DB.Create(&User{
  Name: "枫枫",
  Info: Info{
    Age:  21,
    Addr: "湖南长沙",
    Like: []string{"唱", "跳", "rap"},
  },
})
```

查询数据

Go复制代码

```text
var user User
DB.Take(&user, 1)
fmt.Println(user.Name, user.Info.Like)
```

## 序列化

如果只是存储json数据，完全可以使用gorm的序列化，自带json

Go复制代码

```text
type User struct {
  ID   int64
  Name string `gorm:"size:32"`
  Info Info   `gorm:"type:longtext;serializer:json" json:"info"`
}
```

当然也可以自定义序列化器，参考如下：

[https://gorm\.io/zh\_CN/docs/serializer\.html](https://gorm.io/zh_CN/docs/serializer.html)

拓展 :

```text
业务常用场景汇总
表格
序列化类型	存储形式	使用场景
时间格式化	日期字符串	报表、前台展示时间
逗号分割数组	varchar	多选标签、爱好、权限 ID
枚举文案	tinyint	状态、性别、类型
加密字段	text	隐私信息、账号密钥
时间戳	bigint	高并发排序、时间筛选
经纬度	字符串	地址定位、同城筛选
进制转换	十六进制串	流水号、唯一编码
```

```text
GORM 自定义序列化器（Serializer）完整实现
GORM 序列化基于 gorm.io/datatypes + 实现 serializer.Serializer 接口，自定义类型序列化分两步：定义类型 + 实现序列化接口
一、核心接口
go
运行
// serializer 必须实现的接口
type Serializer interface {
    Scan(dst interface{}) error    // 从数据库读取反序列化
    Value() (driver.Value, error)  // 存入数据库序列化
}
二、实战：自定义序列化类型示例
1. 定义自定义结构体类型
go
运行
package main

import (
    "database/sql/driver"
    "encoding/json"
    "errors"
    "gorm.io/gorm/schema"
)

// 自定义用户拓展信息类型
type UserExtInfo struct {
    Nickname string `json:"nickname"`
    Age      int    `json:"age"`
    Sex      string `json:"sex"`
}
2. 实现序列化 Value () 方法（存库）
go
运行
// 序列化为 json 字符串存入数据库
func (u UserExtInfo) Value() (driver.Value, error) {
    return json.Marshal(u)
}
3. 实现反序列化 Scan () 方法（读库）
go
运行
// 从数据库 json 字符串解析为结构体
func (u *UserExtInfo) Scan(val interface{}) error {
    data, ok := val.([]byte)
    if !ok {
        return errors.New("类型断言失败，非字节数组")
    }
    return json.Unmarshal(data, u)
}
三、注册为 GORM 全局序列化器
go
运行
func init() {
    // 注册自定义类型为 GORM 序列化器
    schema.RegisterSerializer(UserExtInfo{}, &UserExtInfo{})
}
四、在模型中直接使用
go
运行
type User struct {
    gorm.Model
    Name     string
    UserInfo UserExtInfo // 直接使用自定义序列化类型
}
五、使用效果
创建保存：自动序列化为 JSON 字符串存数据库
go
运行
db.Create(&User{
    Name: "张三",
    UserInfo: UserExtInfo{
        Nickname: "小帅",
        Age: 20,
        Sex: "男",
    },
})
查询读取：自动反序列化为结构体
go
运行
var u User
db.First(&u, 1)
// u.UserInfo 直接读取结构体字段
六、进阶：自定义时间 / 加密 / 特殊格式序列化
示例：自定义加密字符串序列化
go
运行
type SecretStr string

func (s SecretStr) Value() (driver.Value, error) {
    // 自定义加密逻辑
    return "加密:"+string(s), nil
}

func (s *SecretStr) Scan(val interface{}) error {
    str, _ := val.(string)
    // 自定义解密逻辑
    *s = SecretStr(str[3:])
    return nil
}

func init(){
    schema.RegisterSerializer(SecretStr(""), new(SecretStr))
}
七、关键注意点
Scan 必须是指针接收者，否则无法赋值
schema.RegisterSerializer 全局只注册一次，放 init()
数据库字段类型建议设为 text / varchar / json
支持嵌套结构体、切片、Map 自定义序列化
```

## 日志

```text
package Models

type Level int8

//使用这种方法定义等级 可以有效防止魔法值  
const{
	InfoLevel Level = 1
	WaringLevel Level = 2
	ErrorLevel Level = 3
}

type LogModel struct {
	ID uint `json:"id"`
	Title string `gorm:"size:32"`
	Level Level `json:"level"`
}

/enter.go
func Loglist() {
	Global.DB.Create(&Models.LogModel{
		Title: "用户登陆",
		Level: Models.InfoLevel,
	})

	var log Models.LogModel
	Global.DB.Take(&log)
	byteData, _ := json.Marshal(log)
	fmt.Println(string(byteData))
}

```

## 枚举类型

有些情况下，在数据库里面需要存储一些标识状态的内容

比如描述日志的等级，通常有固定的那么几个值，例如info、warning、error

如果直接存储字符串，很明显是浪费空间

所以可以使用自定义类型

下面的方法中的status 可以直接替换为 Level 使用到log日志的枚举方法中 ;

Go复制代码

```text
type Status int8

const (
  Running Status = 1
  Warning Status = 2
)

func (s Status) MarshalJSON() (data []byte, err error) {
  var str string
  switch s {
  case Running:
    str = "运行中"
  case Warning:
    str = "警告"
  }
  return json.Marshal(str)
}

type User struct {
  ID     int64
  Name   string `gorm:"size:32"`
  Status Status `json:"status"`
}
```

因为返回前端的时候，肯定会走json序列化，所以返回给前端的时候就是对应的中文

不过也可以再优化一下，只返回中文又太少了，还需要把它本身的数字也给返回出来，怎么做呢

Go复制代码

```text
func (s Status) MarshalJSON() (data []byte, err error) {
  var str string
  switch s {
  case Running:
    str = "运行中" 
  case Warning:
    str = "警告"
  }
  return json.Marshal(map[string]any{
    "status":      int8(s),  //实现返回对应状态的数字
    "statusTitle": str,
  })
}
```
