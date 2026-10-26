## if语句

以年龄为例，输入的年龄在某一个区间，就输出对应的提示信息

Go复制代码

```text
<=0     未出生
1-18    未成年
18-35   青年
>=35    中年
```

很明显，这是一个多选一的情况

我们有很多中方式来实现

中断式 , 卫语句

Go复制代码

```text
package main

import "fmt"

func main() {
  fmt.Println("请输入你的年龄：")
  var age int
  fmt.Scan(&age)

  if age <= 0 {
    fmt.Println("未出生")
    return
  }
  if age <= 18 {
    fmt.Println("未成年")
    return
  }
  if age <= 35 {
    fmt.Println("青年")
    return
  }
  fmt.Println("中年")

}
```

它也有个好听的名字，叫卫语句

嵌套式

Go复制代码

```text
package main

import "fmt"

func main() {
  fmt.Println("请输入你的年龄：")
  var age int
  fmt.Scan(&age)

  if age <= 18 {
    if age <= 0 {
      fmt.Println("未出生")
    } else {
      fmt.Println("未成年")
    }
  } else {
    if age <= 35 {
      fmt.Println("青年")
    } else {
      fmt.Println("中年")
    }
  }
}
```

多条件式

Go复制代码

```text
package main

import "fmt"

func main() {
  fmt.Println("请输入你的年龄：")
  var age int
  fmt.Scan(&age)

  if age <= 0 {
    fmt.Println("未出生")
  }
  if age > 0 && age <= 18 {
    fmt.Println("未成年")
  }
  if age > 18 && age <= 35 {
    fmt.Println("青年")
  }
  if age > 35 {
    fmt.Println("中年")
  }
}
```

## switch语句

使用 switch 语句中 , 内部的 每一种 case 中需要 实现的东西都会自动打上 break ;

Go复制代码

```text
package main

import "fmt"

func main() {
  fmt.Println("请输入你的年龄：")
  var age int
  fmt.Scan(&age)

  switch {
  case age <= 0:
    fmt.Println("未出生")
  case age <= 18:
    fmt.Println("未成年")
  case age <= 35:
    fmt.Println("青年")
  default:
    fmt.Println("中年")
  }
}
```

除了这样的写法，还有枚举所有的可能值

例如

Go复制代码

```text
1   星期一
2   星期二
3   星期三
```

Go复制代码

```text
package main

import "fmt"

func main() {
  fmt.Println("请输入星期数字：")
  var week int
  fmt.Scan(&week)

  switch week {
  case 1:
    fmt.Println("周一")
  case 2:
    fmt.Println("周二")
  case 3:
    fmt.Println("周三")
  case 4:
    fmt.Println("周四")
  case 5:
    fmt.Println("周五")
  case 6, 7:
    fmt.Println("周末")
  default:
    fmt.Println("错误")
  }
}
```

可以理解为case的值就是switch的枚举结果

一般来说，go的switch的多选一，满足其中一个结果之后，就结束switch了

例如

Go复制代码

```text
package main

import "fmt"

func main() {
  fmt.Println("请输入你的年龄：")
  var age int
  fmt.Scan(&age)

  switch {
  case age <= 0:
    fmt.Println("未出生")
  case age <= 18:
    fmt.Println("未成年")
  case age <= 35:
    fmt.Println("青年")
  default:
    fmt.Println("中年")
  }
}
```

我输入一个12，我希望它能输出满足的所有条件，例如我希望它输出，未成年，青年

专业的一点 : fallthough 会让 switch 继续向下传递;

go 中的 switch 中的每一个 case 都会自动补全 break ;

case 可以一个适配多个 判断条件

Go复制代码

```text
package main

import "fmt"

func main() {
  fmt.Println("请输入你的年龄：")
  var age int
  fmt.Scan(&age)

  switch {
  case age <= 0:
    fmt.Println("未出生")
    fallthrough
  case age <= 18:
    fmt.Println("未成年")
    fallthrough
  case age <= 35:
    fmt.Println("青年")
  default:
    fmt.Println("中年")
  }
} 
```

## 参考文档

卫语句 [https://blog\.csdn\.net/wangpaiblog/article/details/114909737](https://blog.csdn.net/wangpaiblog/article/details/114909737)

switch [https://blog\.csdn\.net/qq\_43470538/article/details/130436381](https://blog.csdn.net/qq_43470538/article/details/130436381)

switch [https://www\.php\.cn/faq/540744\.html](https://www.php.cn/faq/540744.html)
