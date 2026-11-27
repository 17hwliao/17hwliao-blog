go的异常处理可能是这门语言唯一的一个诟病了吧

由于go语言没有捕获异常的机制，导致每调一个函数都要接一下这个函数的error

网上有个梗，叫做error是go的一等公民

## 常见的异常处理

### 向上抛

将错误交给上一级处理

一层调用接着一层调用 , 一层一层实现上抛异常处理异常

一般是用于框架层，有些错误框架层面不能擅做决定，将错误向上抛不失为一个好的办法

Go复制代码

```text
package main

import (
  "errors"
  "fmt"
)

func Parent() error {
  err := method() // 遇到错误向上抛
  return err
}
func method() error {
  return errors.New("出错了")
}

func main() {
  fmt.Println(Parent())
}
```

### 中断程序

遇到错误直接停止程序

这种一般是用于**初始化，一旦初始化出现错误，程序继续走下去也意义不大了，还不如中断掉**

Go复制代码

```text
package main

import (
  "fmt"
  "os"
)

func init() {
  // 读取配置文件中，结果路径错了
  _, err := os.ReadFile("xxx")
  if err != nil {             打印失败信息(时间) , 内部会直接删除错误 --> log.Fatal(err) 
    panic(err.Error())  --=> 栈信息
  }
}

func main() {
  fmt.Println("啦啦啦")
}
```

### 恢复程序

**出现异常的时候 , 会直接结束程序 , 利用deter 的 特性实现 在程序结束前 恢复异常**

**程序崩溃（panic） 会先执行 defer 代码**

- **recover \(\) 必须写在 defer 里面才能抓到 panic**
- **recover \(\) 抓到错误 → 程序恢复正常，不会崩**

我们可以在一个函数里面，使用一个defer，可以实现对panic的捕获

以至于出现错误不至于让程序直接崩溃

这种一般也是框架层的异常处理所做的

Go复制代码

```text
package main

import (
  "fmt"
  "runtime/debug"
)

func read() {
  defer func() {
  err := recover();
    if  err != nil {
      fmt.Println(err) // 捕获异常，打印错误信息
      // 打印错误的堆栈信息
      s := string(debug.Stack())
      fmt.Println(s)
    }
  }()
  var list = []int{2, 3}
  fmt.Println(list[2]) // 肯定会有一个panic , 访问控制--> 直接炸
}

func main() {

  read()  //
  
}
```

当然，这个用于捕获异常的defer的延迟函数可以在调用链路上的任何一个函数上

一般用于在最上层函数，捕获所有异常

## 参考文档

golang异常处理 [https://www\.cnblogs\.com/ShineLeBlog/p/17648132\.html](https://www.cnblogs.com/ShineLeBlog/p/17648132.html)

打印错误堆栈 [https://blog\.csdn\.net/qq\_41767116/article/details/128229430](https://blog.csdn.net/qq_41767116/article/details/128229430)
