注意 在 go中 结构体 都不是引用 传递

## 结构体定义

创建结构体 使用的 函数

func \( s Student\) 函数名 \{

内部使用 s\.属性名 实现调用 内部的参数 ;

\}

Go复制代码

```text
texts := []struct {
    content string
    target  string
}{
    {"hello, how are you?", "中文"},
    {"Eino 是一个强大的 Ai 开发框架", "English"},
}
// 按索引访问
fmt.Println(texts[0].content)  // hello, how are you?
fmt.Println(texts[0].target)   // 中文
// 遍历
for _, item := range texts {
    fmt.Println(item.content, "->", item.target)
}
```

Go复制代码

```text
package main

import "fmt"

// Student 定义结构体
type Student struct {
  Name string
  Age  int
}

// PrintInfo 给机构体绑定一个方法
func (s Student) PrintInfo() {
  fmt.Printf("name:%s age:%d\n", s.Name, s.Age)
}

func main() {
  s := Student{
    Name: "枫枫",
    Age:  21,
  }
  s.Name = "枫枫知道" // 修改值
  s.PrintInfo()
}
```

## 组合 \(类似继承, 但go中没继承\)

**func \( 传入的结构体 \) \-\-&gt; 可以看作为结构体传参的特殊形式 , 可以在方法中实现引用**

**内部传入的就是 指针参数 在实现函数调用的时候 直接使用就好**

**修改内部的参数 的时候 传回的 引用 为 结构体 引用**

Go复制代码

```text
package main

import "fmt"

type People struct {
  Time string
}

func (p People) Info() {
  fmt.Println("people ", p.Time)
}

// Student 定义结构体
type Student struct {
  People
  Name string
  Age  int
}

// PrintInfo 给机构体绑定一个方法
func (s Student) PrintInfo() {
  fmt.Printf("name:%s age:%d\n", s.Name, s.Age)
}

func main() {
  p := People{
    Time: "2023-11-15 14:51",
  }
  s := Student{
    People: p,
    Name:   "枫枫",
    Age:    21,
  }
  s.Name = "枫枫知道" // 修改值
  s.PrintInfo()
  s.Info()                   // 可以调用父结构体的方法
  fmt.Println(s.People.Time) // 调用父结构体的属性
  fmt.Println(s.Time)        // 也可以这样
}
```

## 结构体指针

之前我们了解了值传递和引用传递，如果我想在函数里面或者方法里面修改结构体里面的属性

只能使用结构体指针或者指针方法

不传入引用对象 , 方法内部使用 的 还是只拷贝的对象 , 修改的属性还保留 , 传入使用的 以用 后 \.

在 main 中实现 真正的 值传递

Go复制代码

```text
package main

import "fmt"

type Student struct {
  Name string
  Age  int
}

func SetAge(info Student, age int) {
  info.Age = age
}

func SetAge1(info *Student, age int) {
  info.Age = age
}

func main() {
  s := Student{
    Name: "枫枫",
    Age:  21,
  }
  fmt.Println(s.Age)
  SetAge(s, 18)
  fmt.Println(s.Age)
  SetAge1(&s, 17)
  fmt.Println(s.Age)
}
```

Go复制代码

```text
package main

import "fmt"

type Student struct {
  Name string
  Age  int
}

func (s Student) SetAge(age int) {
  s.Age = age
}
func (s *Student) SetAge1(age int) {
  s.Age = age
}

func main() {
  s := Student{
    Name: "枫枫",
    Age:  21,
  }
  s.SetAge(18)
  fmt.Println(s.Age)
  s.SetAge1(18)
  fmt.Println(s.Age)
}
```

## 结构体tag

Go复制代码

```text
package main

import (
  "encoding/json"
  "fmt"
)

type Student struct {
  Name string `json:"name"`
  Age  int    `json:"age"`
}

func main() {
  s := Student{
    Name: "枫枫",
    Age:  21,
  }
  byteData, _ := json.Marshal(s)
  fmt.Println(string(byteData))
}
```

### json tag

1. 这个不写json标签转换为json的话，字段名就是属性的名字
2. 小写的属性也不会转换

空

如果再转json的时候，我不希望某个字段被转出来，我可以写一个 \-

Go复制代码

```text
package main

import (
  "encoding/json"
  "fmt"
)

type Student struct {
  Name     string `json:"name"`
  Age      int    `json:"age"`
  Password string `json:"-"`
}

func main() {
  s := Student{
    Name:     "枫枫",
    Age:      21,
    Password: "123456",
  }
  byteData, _ := json.Marshal(s)
  fmt.Println(string(byteData)) // {"name":"枫枫","age":21}
}
```

**json\.Marshal\(\) 的作用是将 Go 对象（结构体、切片、map 等）序列化成 JSON 格式的字节切片。**

Go复制代码

```text
package main

import (
  "encoding/json"
  "fmt"
)

type Student struct {
  Name string `json:"name"`
  Age  int    `json:"age,omitempty"`
}

func main() {
  s := Student{
    Name: "枫枫",
    Age:  0, // 空值会被省略
  }
  byteData, _ := json.Marshal(s) 
  fmt.Println(string(byteData)) // {"name":"枫枫"}
}
```

## 参考文档

结构体 [https://mp\.weixin\.qq\.com/s?\_\_biz\=Mzg2NTAyNTc5NQ\=\=&amp;mid\=2247484449&amp;idx\=1&amp;sn\=4dc2d55bbdfe20e6b7a68ff711b05fa6&amp;chksm\=ce612e4df916a75bbe57d0e1afe9156fcba090410fb4f43fb146bf94b1b0a683fe3381bb5255&amp;scene\=27](https://mp.weixin.qq.com/s?__biz=Mzg2NTAyNTc5NQ==&mid=2247484449&idx=1&sn=4dc2d55bbdfe20e6b7a68ff711b05fa6&chksm=ce612e4df916a75bbe57d0e1afe9156fcba090410fb4f43fb146bf94b1b0a683fe3381bb5255&scene=27)

go语言结构体 [https://blog\.csdn\.net/qq\_27870421/article/details/118489821](https://blog.csdn.net/qq_27870421/article/details/118489821)

结构体嵌套 [https://blog\.csdn\.net/demored/article/details/124197637](https://blog.csdn.net/demored/article/details/124197637)

结构体指针 [https://www\.runoob\.com/note/67933](https://www.runoob.com/note/67933)

结构体tag [https://c\.biancheng\.net/view/112\.html](https://c.biancheng.net/view/112.html)
