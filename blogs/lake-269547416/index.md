接口是一组仅包含方法名、参数、返回值的未具体实现的方法的集合

像是一种数据类型, 实际的数据关系是 对象中需要包含接口中的全部的方法 :

然后具备多种内部函数的不同对象就可以直接使用接口的类型实现匹配了 :

var u Animal

fmt\(u\.\(cat\)\.haqi\)

Go复制代码

```text
package main

import "fmt"

// Animal 定义一个animal的接口，它有唱，跳，rap的方法
type Animal interface {
  sing()
  jump()
  rap()
}

// Chicken 需要全部实现这些接口
type Chicken struct {
  Name string
}

func (c Chicken) sing() {
  fmt.Println("chicken 唱")
}

func (c Chicken) jump() {
  fmt.Println("chicken 跳")
}
func (c Chicken) rap() {
  fmt.Println("chicken rap")
}

// 全部实现完之后，chicken就不再是一只普通的鸡了

func main() {
  var animal Animal

  animal = Chicken{"ik"}

  animal.sing()
  animal.jump()
  animal.rap()

}
```

接口本身不能绑定方法

接口是值类型，保存的是：值\+原始类型

Go复制代码

```text
package main

import "fmt"

// Animal 定义一个animal的接口，它有唱，跳，rap的方法
type Animal interface {
  sing()
  jump()
  rap()
}

// Chicken 需要全部实现这些接口
type Chicken struct {
  Name string
}

func (c Chicken) sing() {
  fmt.Println("chicken 唱")
}

func (c Chicken) jump() {
  fmt.Println("chicken 跳")
}
func (c Chicken) rap() {
  fmt.Println("chicken rap")
}

// Cat 需要全部实现这些接口
type Cat struct {
  Name string
}

func (c Cat) sing() {
  fmt.Println("cat 唱")
}

func (c Cat) jump() {
  fmt.Println("cat 跳")
}
func (c Cat) rap() {
  fmt.Println("cat rap")
}

func sing(obj Animal) {
  obj.sing()
}

// 全部实现完之后，chicken就不再是一只普通的鸡了

func main() {
  chicken := Chicken{"ik"}
  cat := Cat{"阿狸"}
  sing(chicken)
  sing(cat)
}
```

实现接口：

一个类型实现了接口的所有方法

即实现了该接口

## 类型断言

在使用接口的时候，我还是希望知道此是的具体类型是什么，我们可以通过断言来获取

可以直接使用 ch , ok :\= c\.\(类型\) 可以实现断言类型

使用 switch 可以实现 传 一个参数

Go复制代码

```text
func sing(obj Animal ) {
  // 通过断言来获取此时的具体类型
  switch obj.(type) {
  case Chicken:
    fmt.Println("鸡")
  case Cat:
    fmt.Println("猫")
  }
  obj.sing()
}
```

或者是断言某个类型

Go复制代码

```text
func sing(obj Animal) {
  c, ok := obj.(Chicken) // 两个参数    断言之后的类型   是否是对应类型
  fmt.Println(c, ok)
  d := obj.(Cat) // 一个参数 就是断言之后的类型,注意，类型不对是要报错的 main.Animal is main.Chicken, not main.Cat
  fmt.Println(d)
}
```

## 空接口

空接口可以接受任何类型

换一种，任何类型都实现了空接口的定义

```text
type Student struct {
    Name string
}

type Teacher interface{}

func Print(v Teacher) {  //(可以不实现)  // func Print(v interface{})  //any
    fmt.Println(v)
}

func main() {
    user1 := User{"ws1"}
    student1 := Student{"ws2"}
  
    Print(student1)
    Print(user1)
}
```

可以实现输出

\{ws2\}

\{ws1\}

## 参考文档

什么是接口 [https://studygolang\.com/articles/20117](https://studygolang.com/articles/20117)

Go接口 [https://zhuanlan\.zhihu\.com/p/453799496](https://zhuanlan.zhihu.com/p/453799496)
