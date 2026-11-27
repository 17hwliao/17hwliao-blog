## 死规定 :

### **单元测试文件必须叫：原文件名 \+ \_test\.go**

### **必须在同一个包（package）里面**

### 测试用例函数必须以Test开头，一般来说就是Test\+被测试的函数名

**测试 泛型函数的 时候不能传泛型的 类型直接传值 即可 ;**

Go语言中自带有一个轻量级的测试框架testing和自带的go test命令来实现单元测试和性能测试，testing框架和其他语言的测试框架相似，可以基于这个框架写针对相应函数的测试用例，也可以基于该框架写相应的压力测试用例。通过单元测试，可以解决：

1. 确保每个函数是可运行，并且运行结果是正确的
2. 确保写出来的代码性能是好的
3. 单元测试能及时的发现程序设计或实现的逻辑错误，使问题暴露，便于问题的定位解决，而性能测试的重点在于发现程序设计上的一些问题，让程序能够在高并发的情况下还能保持稳定

Go 语言推荐测试文件和源代码文件放在一块，测试文件以 `_test.go` 结尾

需要注意的是

1. 测试用例文件名必须以\_test\.go结尾
2. 测试用例函数必须以Test开头，一般来说就是Test\+被测试的函数名

## 单元测试

例如我现在有两个用于计算的文件，叫calc\.go

Go复制代码

```text
package main

func Add(a int, b int) int {
    return a + b
}

func Mul(a int, b int) int {
    return a * b
}
```

那么我的测试文件就是calc\_test\.go

Go复制代码

```text
package main

import "testing"

func TestAdd(t *testing.T) {
  if ans := Add(1, 2); ans != 3 {
    // 如果不符合预期，那就是测试不通过
    t.Errorf("1 + 2 expected be 3, but %d got", ans)
  }

  if ans := Add(-10, -20); ans != -30 {
    t.Errorf("-10 + -20 expected be -30, but %d got", ans)
  }
}
```

测试的话，就在界面上点绿色的按钮就可以了

如果是命令的话

Go复制代码

```text
go test // 可以运行某个包下的所有测试用例
```

`-v` 参数会显示每个用例的测试结果

`-run`参数可以指定测试某个函数

单元测试框架提供的日志方法

<table class="ne-table" id="wKDRA"><tbody><tr><td width="250"><p class="ne-p" id="u938a95da"><span class="ne-text">方 法</span></p></td><td width="250"><p class="ne-p" id="u5868ee3f"><span class="ne-text">备 注</span></p></td><td width="250"><p class="ne-p" id="uf401313d"><span class="ne-text">测试结果</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u9706ae4b"><span class="ne-text">Log</span></p></td><td width="250"><p class="ne-p" id="ua793dc88"><span class="ne-text">打印日志，同时结束测试</span></p></td><td width="250"><p class="ne-p" id="u529ab5a0"><span class="ne-text">PASS</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u1f41ad4f"><span class="ne-text">Logf</span></p></td><td width="250"><p class="ne-p" id="u1c2435a5"><span class="ne-text">格式化打印日志，同时结束测试</span></p></td><td width="250"><p class="ne-p" id="u8693ccd5"><span class="ne-text">PASS</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u2ab7cff5"><span class="ne-text">Error</span></p></td><td width="250"><p class="ne-p" id="ub11dd8cd"><span class="ne-text">打印错误日志，同时结束测试</span></p></td><td width="250"><p class="ne-p" id="u485d3e0e"><span class="ne-text">FAIL</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u7089615d"><span class="ne-text">Errorf</span></p></td><td width="250"><p class="ne-p" id="u064a5be5"><span class="ne-text">格式化打印错误日志，同时结束测试</span></p></td><td width="250"><p class="ne-p" id="u1b49fbf7"><span class="ne-text">FAIL</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u407e612b"><span class="ne-text">Fatal</span></p></td><td width="250"><p class="ne-p" id="ub81e6426"><span class="ne-text">打印致命日志，同时结束测试</span></p></td><td width="250"><p class="ne-p" id="u2d9956f2"><span class="ne-text">FAIL</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ua420d5eb"><span class="ne-text">Fatalf</span></p></td><td width="250"><p class="ne-p" id="ufec1bb39"><span class="ne-text">格式化打印致命日志，同时结束测试</span></p></td><td width="250"><p class="ne-p" id="ude2f057c"><span class="ne-text">FAIL</span></p></td></tr></tbody></table>

## 子测试

如果需要给一个函数，调用不同的测试用例，可以使用子测试

**子测试里面的Fatal，是不会终止程序的**

Go复制代码

```text
package main

import (
  "testing"
)

func TestAdd(t1 *testing.T) {
  t1.Run("add1", func(t *testing.T) {
    if ans := Add(1, 2); ans != 3 {
      // 如果不符合预期，那就是测试不通过
      t.Fatalf("1 + 2 expected be 3, but %d got", ans)
    }
  })
  t1.Run("add2", func(t *testing.T) {
    if ans := Add(-10, -20); ans != -30 {
      t.Fatalf("-10 + -20 expected be -30, but %d got", ans)
    }
  })

}
```

如果测试用例很多，还可以用一个类似表格去表示

Go复制代码

```text
package main

import (
  "testing"
)

func TestAdd(t *testing.T) {
  cases := []struct {
    Name           string
    A, B, Expected int
  }{
    {"a1", 2, 3, 5},
    {"a2", 2, -3, -1},
    {"a3", 2, 0, 2},
  }

  for _, c := range cases {
    t.Run(c.Name, func(t *testing.T) {
      if ans := Add(c.A, c.B); ans != c.Expected {
        t.Fatalf("%d * %d expected %d, but %d got",
          c.A, c.B, c.Expected, ans)
      }
    })
  }
}
```

## TestMain函数

### **运行 go test 时 → 一定会先自动跑 TestMain，再跑其他测试函数！**

它的作用：

- **统一做测试前准备**（打开数据库、创建文件、初始化环境）
- **统一做测试后清理**（关闭连接、删除临时文件）

它是测试的入口

我们可以在TestMain里面实现测试流程的生命周期

Go复制代码

```text
package main

import (
  "fmt"
  "os"
  "testing"
)

// 测试前执行
func setup() {
  fmt.Println("Before all tests")
}

// 测试后执行
func teardown() {
  fmt.Println("After all tests")
}

func Test1(t *testing.T) {
  fmt.Println("I'm test1")
}

func Test2(t *testing.T) {
  fmt.Println("I'm test2")
}

// 必须叫这个名字  测试主入口
func TestMain(m *testing.M) {
  // 测试前执行
  setup()
  code := m.Run()
  // 测试后执行
  teardown()
  os.Exit(code)
}
```

## 参考文档

go单元测试 [https://blog\.csdn\.net/m0\_56719679/article/details/131461113](https://blog.csdn.net/m0_56719679/article/details/131461113)

go test [https://blog\.csdn\.net/rhx\_qiuzhi/article/details/129481723](https://blog.csdn.net/rhx_qiuzhi/article/details/129481723)
