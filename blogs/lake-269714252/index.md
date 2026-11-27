后面会接触到的结构体反射操作获取全部的内部字段值 :

field reflect\.StructField 携带了结构体字段的全部反射元信息。关键成员和方法有：

成员 含义 在本例中的值

field\.Name Go 字段原名 "UserName"

field\.Type 字段类型 string

field\.Tag 原始标签字符串 \`validate:"\.\.\." label:"\.\.\."\`

field\.Tag\.Get\("label"\) 取指定标签值 "用户名"

## 类型判断

判断一个变量是否是结构体，切片，map

Go复制代码

```text
package main

import (
  "fmt"
  "reflect"
)

func refType(obj any) {
  typeObj := reflect.TypeOf(obj)
  fmt.Println(typeObj, typeObj.Kind())
  // 去判断具体的类型
  switch typeObj.Kind() {
  case reflect.Slice:
    fmt.Println("切片")
  case reflect.Map:
    fmt.Println("map")
  case reflect.Struct:
    fmt.Println("结构体")
  case reflect.String:
    fmt.Println("字符串")
  }
}

func main() {
  refType(struct {
    Name string
  }{Name: "枫枫"})
  name := "枫枫"
  refType(name)
  refType([]string{"枫枫"})
}
```

## 通过反射获取值

Go复制代码

```text
func refValue(obj any) {
  value := reflect.ValueOf(obj)
  fmt.Println(value, value.Type())
  switch value.Kind() {
  case reflect.Int:
    fmt.Println(value.Int())
  case reflect.Struct:
    fmt.Println(value.Interface())
  case reflect.String:
    fmt.Println(value.String())

  }
}
```

## 通过反射修改值

**使用 Elem\(\) 先实现解引用 , 一般变量中实现存储的对象都是引用类型, 需要先 实现解引用 \.Elem\(\) 然后才可以实现对对象的实际 引用 ;**

注意，如果需要通过反射修改值，必须要传指针，在反射中使用Elem取指针对应的值

Go复制代码

```text
func refSetValue(obj any) {
  value := reflect.ValueOf(obj)
  elem := value.Elem()
  // 专门取指针反射的值
  switch elem.Kind() {
  case reflect.String:
    elem.SetString("枫枫知道")
  }
}

func main() {
  name := "枫枫"
  refSetValue(&name)
  fmt.Println(name)
}
```

## 结构体反射

# 最核心、最本质的一句话

## **reflect\.Value \= 管【值】**

## **reflect\.Type \= 管【类型 / 结构】**

- **reflect\.Type \= 表格的印刷模板**只告诉你：有几列、叫什么名、带什么标签。→ **t\.Field \(i\) 拿表格结构**
- **reflect\.Value \= 表格里填写的内容**只告诉你：里面填了什么字。→ **v\.Field \(i\) 拿表格里的值**
- **t\.Field\(0\)\.Name** → Name（字段名）
- **t\.Field\(0\)\.Tag** → `json:"user_name"`（标签）
- **v\.Field\(0\)** → ws（值）

**reflect\.Value 诞生的目的只有一个：存数据、读数据、改数据**

读取json标签对应的值，如果没有就用属性的名称

Go复制代码

```text
package main

import (
  "fmt"
  "reflect"
)

type Student struct {
  Name string
  Age  int `json:"age"`
}

func main() {
  s := Student{
    Name: "枫枫知道",
    Age:  24,
  }
  t := reflect.TypeOf(s)
  v := reflect.ValueOf(s)
从结构体字段的标签里，把 json:"xxx" 后面的 xxx 取出来！
  for i := 0; i < t.NumField(); i++ {
    field := t.Field(i)
    jsonField := field.Tag.Get("json")
    if jsonField == "" {
      // 说明json的tag是空的
      jsonField = field.Name
    }
    fmt.Printf("Name: %s, type: %s, json: %s, value: %v\n", field.Name, field.Type, jsonField, v.Field(i))
  }
}
```

当然了，我们写的这个都很简单了，没有处理\-和omitempty的情况

### 修改结构体中某些值

例如，结构体tag中有big的标签，就将值大写

Go复制代码

```text
package main

import (
  "fmt"
  "reflect"
  "strings"
)

type Student struct {
  Name1 string `big:"-"`
  Name2 string
}

func main() {
  s := Student{
    Name1: "fengfeng",
    Name2: "zhangsan",
  }
  t := reflect.TypeOf(s)
  v := reflect.ValueOf(&s).Elem()

  for i := 0; i < t.NumField(); i++ {
    field := t.Field(i)
    bigField := field.Tag.Get("big")
    // 判断类型是不是字符串
    if field.Type.Kind() != reflect.String {
      continue
    }
    if bigField == "" {
      continue
    }
    // 修改值
    valueFiled := v.Field(i)
    valueFiled.SetString(strings.ToTitle(valueFiled.String()))
  }
  fmt.Println(s)
}
```

### 调用结构体方法

如果结构体有call这个名字的方法，就执行它

Go复制代码

```text
package main

import (
  "fmt"
  "reflect"
)

type Student struct {
  Name string
  Age  int
}

func (Student) See(name string) {
  fmt.Println("see name:", name)
}

func main() {
  s := Student{
    Name: "fengfeng",
    Age:  21,
  }
  t := reflect.TypeOf(s)
  v := reflect.ValueOf(s)

  for i := 0; i < t.NumMethod(); i++ {
    methodType := t.Method(i)
    fmt.Println(methodType.Name, methodType.Type)
    if methodType.Name != "See" {
      continue
    }
    methodValue := v.Method(i)
    methodValue.Call([]reflect.Value{
      reflect.ValueOf("枫枫"), // 注意这里的类型
    })
  }
}
```

## orm的一个小案例

Go复制代码

```text
package main

import (
  "errors"
  "fmt"
  "reflect"
  "strings"
)

type Student struct {
  Name string `feng-orm:"name"`
  Age  int    `feng-orm:"age"`
}

type UserInfo struct {
  Id   int    `feng-orm:"id"`
  Name string `feng-orm:"name"`
  Age  int    `feng-orm:"age"`
}

func Find(obj any, query ...any) (sql string, err error) {
  // Find(Student, "name = ?", "fengfeng")
  // 希望能够生成 select name, age from  where  name = 'fengfeng'
  t := reflect.TypeOf(obj)
  //v := reflect.ValueOf(obj)
  // 首先得是结构体对吧
  if t.Kind() != reflect.Struct {
    err = errors.New("非结构体")
    return
  }
  // 拿全部字段

  // 拼接条件
  // 第二个参数，中的问号，就决定后面还能接多少参数
  var where string
  if len(query) > 0 {
    // 有第二个参数，校验第二个参数中的？个数，是不是和后面的个数一样
    q := query[0] // 理论上还要校验第二个参数的类型
    if strings.Count(q.(string), "?")+1 != len(query) {
      err = errors.New("参数个数不对")
      return
    }
    // 拼接where语句
    // 将？号带入后面的参数
    for _, a := range query[1:] {
      // 替换q
      // 这里要判断a的类型
      at := reflect.TypeOf(a)
      switch at.Kind() {
      case reflect.Int:
        q = strings.Replace(q.(string), "?", fmt.Sprintf("%d", a.(int)), 1)
      case reflect.String:
        q = strings.Replace(q.(string), "?", fmt.Sprintf("'%s'", a.(string)), 1)
      }
    }
    where += "where " + q.(string)
  }
  // 如果没有第二个参数，就是查全部

  // 拼接select
  // 拿所有字段，取feng-orm对应的值
  var columns []string
  for i := 0; i < t.NumField(); i++ {
    field := t.Field(i)
    f := field.Tag.Get("feng-orm")
    // 不考虑是空的情况
    columns = append(columns, f)
  }

  // 结构体的小写名字+s做表名
  name := strings.ToLower(t.Name()) + "s"

  // 拼接最后的sql
  sql = fmt.Sprintf("select %s from %s %s", strings.Join(columns, ","), name, where)
  return
}

func main() {
  sql, err := Find(Student{}, "name = ? and age = ?", "枫枫", 23)
  fmt.Println(sql, err) // select name,age from students where name = '枫枫' and age = 23
  sql, err = Find(UserInfo{}, "id = ?", 1)
  fmt.Println(sql, err) // select id,name,age from userinfos where id = 1
}
```

## 对反射的一些建议

如果是写一下框架，偏底层工具类的操作

不用反射确实不太好写，但是如果是在业务上，大量使用反射就不太合适了

因为反射的性能没有正常代码高，会慢个一到两个数量级

使用反射可读性也不太好，并且也不能在编译期间发生错误

## 参考文档

go反射 [https://blog\.csdn\.net/a1053765496/article/details/129904985](https://blog.csdn.net/a1053765496/article/details/129904985)

反射 [https://www\.liwenzhou\.com/posts/Go/reflect/](https://www.liwenzhou.com/posts/Go/reflect/)
