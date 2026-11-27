## 变量定义

标准的变量定义

Go复制代码

```text
package main

import "fmt"

func main() {
  // 先定义，再赋值
  var name string
  name = "枫枫"
  fmt.Println(name)
  
  // var 变量名 类型 = "变量值"
  var userName string = "枫枫"
  fmt.Println(userName)
}
```

如果一个变量定义了，但是没有赋值，那么这个变量的值就是这个类型的 `"零值"`

### 变量类型省略

Go复制代码

```text
var name = "枫枫"
```

### 简短声明

Go复制代码

```text
name := "枫枫"
```

### 全局变量与局部变量

简单点理解 就是

public \-\-&gt; 属性实质化为 变量名首字母大写

private \-\-&gt; 就是创建的变量

1. 定义在函数体（包括main函数）内的变量都是局部变量，定义了就必须使用
2. 定义在外部的变量就是全局变量，可以只定义不使用

Go复制代码

```text
package main

import "fmt"

var userName = "枫枫知道" // 可以不使用

func main() {
  // var 变量名 类型 = "变量值"
  var name = "枫枫"
  // 在函数体内定义的变量，必须要使用
  fmt.Println(name)
}
```

### 定义多个变量

Go复制代码

```text
package main

func main() {
  var name1, name2, name3 string // 定义多个变量

  var a1, a2 = "枫枫", "知道" // 定义多个变量并赋值
  
  a3, a4 := "枫枫", "知道"     // 简短定义多个变量并赋值
}
```

Go复制代码

```text
package main

import "fmt"

var (
  name  string = "枫枫"
  userName   = "枫枫知道"
)

func main() {
  fmt.Println(name, userName)
}
```

### 常量定义

1. 定义的时候就要赋值
2. 赋值之后就不能再修改了

Go复制代码

```text
const name string = "枫枫" // 定义就要赋值
//name = "知道" // 不能再修改了
fmt.Println(name)
```

### 命名规范

核心思想：首字母大写的变量、函数。方法，属性可在包外进行访问

## 输出

常用的输出函数

Go复制代码

```text
package main

import "fmt"

func main() {
  fmt.Println("枫枫知道")
  fmt.Println(1)
  fmt.Println(true)
  fmt.Println("什么", "都", "可以", "输出")
}
```

### 格式化输出

Go复制代码

```text
package main

import "fmt"

func main() {
  fmt.Printf("%v\n", "你好")          // 可以作为任何值的占位符输出
  fmt.Printf("%v %T\n", "枫枫", "枫枫") // 打印类型
  fmt.Printf("%d\n", 3)             // 整数
  fmt.Printf("%.2f\n", 1.25)        // 小数
  fmt.Printf("%s\n", "哈哈哈")         // 字符串
  fmt.Printf("%#v\n", "")           // 用go的语法格式输出，很适合用来判断是空串还是没打印
  fmt.Printf("%T  %T\n", "sjis", 2.223)  //使用 T 获取类型 
  //打印 v类型 -->  无论什么类型都可以直接打印 

}
```

还有一个用的比较多的就是将格式化之后的内容赋值给一个变量

Go复制代码

这个就和 C语言中的那种格式化输出一摸一样了 \.

- `fmt.Sprintf` 是**格式化后返回字符串**，不直接打印；
- `%v` 是 Go 万能占位符，**任意类型都能适配**，比 C 更省心。

```text
name := fmt.Sprintf("%v", "你好")
fmt.Println(name)
```

## 输入

bufio\.NewReader 实现读取数据 :

reader :\= bufio\.NewReader\(os\.Stdin\)

input , err :\= reader\.ReadString\('\\n'\) //不断读取知道读到'\\n' 为止 ;

使用 FScan\(reader , &amp;变量名\) : 实现遇到空格实现停止;

Go复制代码

```text
package main

import "fmt"

func main() {
  fmt.Println("输入您的名字：")
  var name string
  fmt.Scan(&name)  // 这里记住，要在变量的前面加个&, 后面讲指针会提到
  fmt.Println("你输入的名字是", name)
}
```

## 参考文档

1. 变量定义 [https://segmentfault\.com/a/1190000042910744](https://segmentfault.com/a/1190000042910744?sort=votes)
2. 输入函数 [https://www\.php\.cn/faq/507954\.html](https://www.php.cn/faq/507954.html)
3. 格式化 [https://www\.php\.cn/faq/527489\.html](https://www.php.cn/faq/527489.html)
