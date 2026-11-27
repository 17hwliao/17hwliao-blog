## init函数

`init()`函数是一个特殊的函数，存在以下特性：

1. 不能被其他函数调用，而是在main函数执行之前，自动被调用
2. init函数不能作为参数传入
3. 不能有传入参数和返回值

一个go文件可以有多个init函数，谁在前面谁就先执行

Go复制代码

```text
package main

import "fmt"

func init() {
  fmt.Println("init1")
}
func init() {
  fmt.Println("init2")
}
func init() {
  fmt.Println("init3")
}

func main() {
  fmt.Println("main")
}
```

执行顺序

Go复制代码

```text
init1
init2
init3
main
```

![](</blogs/_assets/lakebook/fed5c8a14ba6cec388dcd2db.png>)

## defer函数

只是一个顺序调用的 函数

<table class="ne-table" id="MTaBK"><tbody><tr><td width="375"><p class="ne-p" id="u0621625b"><span class="ne-text">你的期望</span></p></td><td width="375"><p class="ne-p" id="u5770026a"><span class="ne-text">实际行为</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uf9529561"><code class="ne-code"><span class="ne-text">defer</span></code></p><p class="ne-p" id="u322d9a3f"><span class="ne-text"> </span><span class="ne-text">能自动关闭文件</span></p></td><td width="375"><p class="ne-p" id="ucb576f94"><span class="ne-text">❌</span><span class="ne-text"> 需要你写</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">defer f.Close()</span></code></p></td></tr><tr><td width="375"><p class="ne-p" id="uebafa000"><code class="ne-code"><span class="ne-text">defer</span></code></p><p class="ne-p" id="u59799234"><span class="ne-text"> </span><span class="ne-text">能自动释放锁</span></p></td><td width="375"><p class="ne-p" id="u2c069a4a"><span class="ne-text">❌</span><span class="ne-text"> 需要你写</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">defer mu.Unlock()</span></code></p></td></tr><tr><td width="375"><p class="ne-p" id="uad046bde"><code class="ne-code"><span class="ne-text">defer</span></code></p><p class="ne-p" id="u519c2624"><span class="ne-text"> </span><span class="ne-text">能自动删除临时文件</span></p></td><td width="375"><p class="ne-p" id="u7f3d8812"><span class="ne-text">❌</span><span class="ne-text"> 需要你写</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">defer os.Remove(tmp)</span></code></p></td></tr><tr><td width="375"><p class="ne-p" id="u6aa5d27a"><code class="ne-code"><span class="ne-text">defer</span></code></p><p class="ne-p" id="u95e45738"><span class="ne-text"> </span><span class="ne-text">能自动回收内存</span></p></td><td width="375"><p class="ne-p" id="uf301f9f7"><span class="ne-text">❌</span><span class="ne-text"> 那是 GC 的事</span></p></td></tr></tbody></table>

`defer`**\= 延迟执行 \+ 自动调用**

**清理逻辑 \= 你自己写的函数**

虽然在return 之前执行 但还是 需要实现 其内部需要实现 的变量

1. 关键字 defer 用于注册延迟调用
2. 这些调用直到 return 前才被执。因此，可以用来做资源清理
3. 多个defer语句，按先进后出的方式执行，谁离return近谁先执行
4. defer语句中的变量，在defer声明时就决定了

Go复制代码

```text
package main

import "fmt"

func Func() {
  defer fmt.Println("defer2")
  fmt.Println("func")
  defer fmt.Println("defer1")
}

func main() {
  defer fmt.Println("defer4")
  Func()
  defer fmt.Println("defer3")
}
```

执行顺序

Go复制代码

```text
func
defer1
defer2
defer3
defer4
```

## 参考文档

init函数 [https://blog\.csdn\.net/bestzy6/article/details/122503275](https://blog.csdn.net/bestzy6/article/details/122503275)

defer函数 [https://blog\.csdn\.net/m0\_52896752/article/details/130191669](https://blog.csdn.net/m0_52896752/article/details/130191669)
