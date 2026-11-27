func 变量名 \( 形参列表 \) \( 返回的数值类型 \) \{ \}

函数 传参的时候 , 需要传入 多个相同的类型 的时候 可以 直接设置 传入 的参数 \[ \.\.\.var \]

函数是一段封装了特定功能的可重用代码块，用于执行特定的任务或计算

函数接受输入（参数）并产生输出（返回值）

## 函数定义

Go复制代码

```text
package main

import "fmt"

// 使用func关键字定义一个函数
func sayHello() {
  fmt.Println("hello")
}

func main() {
  // 函数()调用函数
  sayHello()
}
```

## 函数参数

Go复制代码

```text
package main

import "fmt"

func add(n1 int, n2 int) {
  fmt.Println(n1, n2)
}

// 参数类型一样，可以合并在一起
func add1(n1, n2 int) {
  fmt.Println(n1, n2)
}

// 多个参数
func add2(numList ...int) {
  fmt.Println(numList)
}

func main() {
  add(1, 2)
  add1(1, 2)
  add2(1, 2)
  add2(1, 2, 3, 4)
}
```

## 函数返回值

Go复制代码

```text
package main

import "errors"

// 无返回值
func fun1() {
  return // 也可以不写
}

// 单返回值
func fun2() int {
  return 1
}

// 多返回值
func fun3() (int, error) {
  return 0, errors.New("错误")
}

// 命名返回值
func fun4() (res string) {
  return // 相当于先定义再赋值
  //return "abc"
}

func main() {

}
```

## 匿名函数

提前使用 变量名 定义 可以不设置 函数的变量名

Go复制代码

```text
package main

import "fmt"

func main() {
  var add = func(a, b int) int {
    return a + b
  }
  fmt.Println(add(1, 2))
}
```

## 高阶函数

**内部实现嵌套的基本玩法**

**内部函数的 return → 是内部函数自己的返回值**

**外层函数的 return → 是把「整个内部函数」当成一个值返回出去**

**实现内部函数的命名就 不要 内部return 使用 一个变量名接函数 最后返回变量名**

func makeMultiplier\(factor int\) func\(int\) int \{

// ↑↑↑↑↑↑↑↑↑↑↑

// 这里的 factor 接收了 2

return func\(x int\) int \{

return x \* factor

// ↑↑↑↑↑↑

// 内部函数使用了这个 factor

\}

\}

根据用户输入的不同，执行不同的操作

Go复制代码

```text
package main

import "fmt"

func main() {
  fmt.Println("请输入要执行的操作：")
  fmt.Println(`1：登录
2：个人中心
3：注销`)
  var num int
  fmt.Scan(&num)
  var funcMap = map[int]func(){
    1: func() {
      fmt.Println("登录")
    },
    2: func() {
      fmt.Println("个人中心")
    },
    3: func() {
      fmt.Println("注销")
    },
  }
  funcMap[num]()
}
```

提取出来

Go复制代码

```text
package main

import "fmt"

func login() {
  fmt.Println("登录")
}

func userCenter() {
  fmt.Println("个人中心")
}

func logout() {
  fmt.Println("注销")
}

func main() {
  fmt.Println("请输入要执行的操作：")
  fmt.Println(`1：登录
2：个人中心
3：注销`)
  var num int
  fmt.Scan(&num)
  var funcMap = map[int]func(){
    1: login,
    2: userCenter,
    3: logout,
  }
  funcMap[num]()
}
```

## 闭包

设计一个函数，先传一个参数表示延时，后面再次传参数就是将参数求和

在 放入参数前设置了 一个暂停的时间

例如

Go复制代码

```text
fun(2)(1,2,3) // 延时2秒求1+2+3
```

Go复制代码

```text
package main

import (
  "fmt"
  "time"
)

func awaitAdd(t int) func(...int) int {
  time.Sleep(time.Duration(t) * time.Second)
 // time.Duration(t)	类型转换	把 int 转成 time.Duration
  return func(numList ...int) int {
    var sum int
    for _, i2 := range numList {
      sum += i2
    }
    return sum
  }
}

func main() {
  fmt.Println(awaitAdd(2)(1, 2, 3))
}

外层：func awaitAdd(t int) ...
这是一个名为 awaitAdd 的普通函数，它接收一个 int 类型的参数 t。

返回值：func(...int) int
这是最关键的部分。它表示 awaitAdd 函数返回的不是一个整数、一个字符串或一个结构体，而是另一个函数。

返回的函数长什么样：func(...int) int
这个被返回的函数可以接收可变数量的 int 类型参数（比如 1,2,3 或 10,20），并且它最终会返回一个 int 类型的结果。



```

## 值传递和引用传递

**内部使用的输入输出 都是 值拷贝**

**是的，Go 语言中所有函数传参都是值拷贝**

**使用 for 索引 , 键 / 值对象 : range 类型 这种只能是 值拷贝 , 不对原对象产生影响**

稍微了解过编程的都应该知道，计算机上显示的所有的数据都是在内存里面的

也就是说，我们定义的一个变量，它也在内存里面有一块地

正常情况下来说，函数的参数是将之前那块地复制了一份出来

如何证明呢

Go复制代码

```text
package main

import "fmt"

func add(num int) {
  fmt.Println(&num) // 可以看到，这个n的内存地址和外面num的内存地址是明显不一样的
  num = 2           // 这里的修改不会影响外面的num
}

func main() {
  num := 20
  fmt.Println(&num)
  add(num)
  fmt.Println(num) // 20
}
```

也就是说，在函数里面不管怎么修改这个参数，都不会影响原来的那个值

但是，如果我需要在函数体内修改变量的值呢？

这就需要用到引用传递了

我们直接将变量的内存地址传递进去

Go复制代码

```text
package main

import "fmt"

func add(num *int) {  使用的的解引用 , 获取此地址的变量值
  fmt.Println(num) // 内存值是一样的
  *num = 2         // 这里的修改会影响外面的num
}

func main() {
  num := 20
  fmt.Println(&num)
  add(&num)
  fmt.Println(num) // 成功修改 2
}
```

## 指针

上面那个案例搞清楚之后，指针也就不难了

我们只需要知道

&amp;是取地址，\*是解引用，去这个地址指向的值

## 参考文档

函数 [https://zhuanlan\.zhihu\.com/p/635927865](https://zhuanlan.zhihu.com/p/635927865)

指针 [https://c\.biancheng\.net/view/21\.html](https://c.biancheng.net/view/21.html)

go语言函数 [https://blog\.csdn\.net/weixin\_44211968/article/details/121295530](https://blog.csdn.net/weixin_44211968/article/details/121295530)
