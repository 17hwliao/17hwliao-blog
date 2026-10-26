从1\.18版本开始，Go添加了对泛型的支持，即类型参数

## 泛型函数

如果我们要实现一个对int类型的求和函数

Go复制代码

```text
func add(a, b int) int {
  return a + b
}
```

但是这样写了之后，如果参数是float类型，int32类型这些，就没办法使用了

难道要为每个类型都写一个这样的函数吗？

显然这就不合理

这个时候，泛型就上场了

具体规定 T 的数据类型, 可赋值 无数种类型

建议直接放 any 类型 \=\= interface , 可以接收任何类型 ;

Go复制代码

```text
func add[T int | float64 | int32](a, b T) T {
  return a + b
}
```

```text
func dunc[K int | uint, V string | int](a K, b V) {
    println(a, b)
}
```

## 泛型结构体

**使用泛型定义一个结构体中数据**

**获取到数据后**

**实现调用直接传 结构体 \+ 类型就行**

Go复制代码

```text
package main

import (
  "encoding/json"
  "fmt"
)

type Response[T any] struct {
  Code int    `json:"code"`
  Msg  string `json:"msg"`
  Data T      `json:"data"`
}
 
func main() {
  type User struct {
    Name string `json:"name"`
  }

  type UserInfo struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
  }

  //user := Response{
  //  Code: 0,
  //  Msg:  "成功",
  //  Data: User{
  //    Name: "枫枫",
  //  },
  //}
  //byteData, _ := json.Marshal(user)
  //fmt.Println(string(byteData))
  //userInfo := Response{
  //  Code: 0,
  //  Msg:  "成功",
  //  Data: UserInfo{
  //    Name: "枫枫",
  //    Age:  24,
  //  },
  //}
  //byteData, _ = json.Marshal(userInfo)
  //fmt.Println(string(byteData))
  获取对象传入调用类型
  var userResponse Response[User]
  使用 json 反序列化自动填充到 User 中
  json.Unmarshal([]byte(`{"code":0,"msg":"成功","data":{"name":"枫枫"}}`), &userResponse)
  可以使用泛型实现调用子属性
  fmt.Println(userResponse.Data.Name)
  
  var userInfoResponse Response[UserInfo]
  json.Unmarshal([]byte(`{"code":0,"msg":"成功","data":{"name":"枫枫","age":24}}`), &userInfoResponse)
  fmt.Println(userInfoResponse.Data.Name, userInfoResponse.Data.Age)
}
```

## 泛型切片

Go复制代码

```text
package main

type MySlice[T any] []T

func main() {
  var mySlice MySlice[string]
  mySlice = append(mySlice, "枫枫")

  var intSlice MySlice[int]
  intSlice = append(intSlice, 2)
}
```

## 泛型map

Go复制代码

**创建泛型的 map 的时候 : 创建出的 map 的 键 类型只能使用 基本数据类型 ;**

```text
package main

import "fmt"

type MyMap[K string | int, V any] map[K]V

func main() {
  var myMap = make(MyMap[string, string])
  myMap["name"] = "枫枫"
  fmt.Println(myMap)
}
```
