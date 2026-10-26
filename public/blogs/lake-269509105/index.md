在 Go 语言中，自定义类型指的是使用 type 关键字定义的新类型，它可以是基本类型的别名，也可以是结构体、函数等组合而成的新类型。自定义类型可以帮助我们更好地抽象和封装数据，让代码更加易读、易懂、易维护

## 自定义类型

简单理解 一下 就是 JAVA 中有 int \-\-&gt; Integer , boolean \-\-\-&gt; Boolean 基本 类型 到 包装类

结构体就是自定义类型中的一种

类型会实现自动转化为 自定义 类型

除此之外我们使用自定义类型，还可以让代码组合更加规范

例如，响应给客户端的想要码，我给他一个自定义类型

Go复制代码

```text
package main

import "fmt"

type Code int  //自定义一个 数据类型

const (
  SuccessCode    Code = 200
  ValidCode      Code = 404  // 校验失败的错误
  ServiceErrCode Code = 401  // 服务错误
)

func (c Code) GetMsg() string {
  // 可能会有更加响应码返回不同消息内容的要求，我们在这个函数里面去实现即可
  // 可能还会有国际化操作
  return "成功"
}

func main() {
  fmt.Println(SuccessCode.GetMsg())
  var i int
  fmt.Println(int(SuccessCode) == i) // 必须要转成原始类型才能判断
}
```

## 类型别名 \-\-\-&gt; 加 \= 定义 \=\= typedef

使用 type 别名 \= 类型 : 类型别名

没有 \= 类型自定义

相当于创建了一个返回值类型的变量 ,再实际运行时 接收值, 遇到return 实际返回的是变量内部的值

和自定义类型很像，但是有一些地方和自定义类型有很大差异

1. 不能绑定方法
2. 打印类型还是原始类型 , 自定义会修改类型
3. 和原始类型比较，类型别名不用转换

类似创建内部的对象方法 :

```text
// 3. 给 Code 类型“绑定”一个方法：
GetMsg()
// → 让每个错误码 自己能返回自己的提示文字
func(c Code)GetMsg()string{
switch c {
case SuccessCode:
return"成功"
case ValidCode:
return"参数校验失败"
case ServiceErrCoder:
eturn"服务器内部错误"
default:return"未知错误"}}
```

Go复制代码

```text
package main

import "fmt"

type AliasCode = int
type MyCode int

const (
  SuccessCode      MyCode    = 0
  SuccessAliasCode AliasCode = 0
)

// MyCodeMethod 自定义类型可以绑定自定义方法
func (m MyCode) MyCodeMethod() {

}

// MyAliasCodeMethod 类型别名 不可以绑定方法
func (m AliasCode) MyAliasCodeMethod() {

}

func main() {
  // 类型别名，打印它的类型还是原始类型
  fmt.Printf("%T %T \n", SuccessCode, SuccessAliasCode) // main.MyCode int
  // 可以直接和原始类型比较
  var i int
  fmt.Println(SuccessAliasCode == i)
  fmt.Println(int(SuccessCode) == i) // 必须转换之后才能和原始类型比较
}
```

## 参考文档

自定义数据类型 [https://www\.jb51\.net/article/282910\.htm](https://www.jb51.net/article/282910.htm)

自定义类型 [https://www\.cnblogs\.com/whiteBear/p/15549604\.html](https://www.cnblogs.com/whiteBear/p/15549604.html)

自定义类型和类型别名 [https://blog\.csdn\.net/alexchenyang/article/details/120604452](https://blog.csdn.net/alexchenyang/article/details/120604452)
