## 这是 **升序排序**（从小到大排序）。

在 Go 的 `sort.Slice` 函数中，比较函数 `func(i, j int) bool` 的返回值含义是：

- 返回 `true` 表示 `nums[i]` 应该排在 `nums[j]` 前面
- 返回 `false` 表示 `nums[i]` 应该排在 `nums[j]` 后面

## 数组

数组（Array）是一种非常常见的数据类型，几乎所有的计算机编程语言中都会用到它

1. 数组里的元素必须全部为同一类型，要嘛全部是字符串，要嘛全部是整数
2. 声明数组时，必须指定其长度或者大小

Go复制代码

```text
package main

import "fmt"

func main() {
  var array [3]int = [3]int{1, 2, 3}
  fmt.Println(array)
  var array1 = [3]int{1, 2, 3}
  fmt.Println(array1)
  var array2 = [...]int{1, 2, 3}
  fmt.Println(array2)
}
```

如果要修改某个值，只能根据索引去找然后替换

Go复制代码

```text
var array1 = [3]int{1, 2, 3}
array1[0] = 10 // 根据索引找到对应的元素位置，然后替换
fmt.Println(array1)
```

### 索引

索引这个知识点，如果刚学编程，那么就得仔细听了，这个知识点到后面我就默认你已经会了

Go复制代码

```text
package main

import "fmt"

func main() {
  // 以定义一个字符串数组 a b c d 为例
  var sList = []string{"a", "b", "c", "d"}
  // 正向索引就从0开始，从左往右
  /*
    a     b     c     d
    0     1     2     3
  */
  // 取值就通过索引去取
  fmt.Println(sList[0]) // 拿到a这个元素
  // 当然，有的语言支持负向索引，go不支持
  /*
      a      b     c     d
      -4    -3    -2    -1
  */
  // 如果在go语言里面，我想拿到倒数第二个元素，怎么办？
  fmt.Println(sList[len(sList)-2]) // 拿到a这个元素
}
```

## 切片

很明显啊，go里面的数组，长度被限制死了，所以不经常用

所以go出了一个数组plus，叫做slice（切片）

切片（Slice）相较于数组更灵活，因为在声明切片后其长度是可变的

相当于实现动态数组 , 内部使用的是 容量 \+ 长度 \-\-\-&gt; 万一长度&gt; 容量 触发自动扩容;

单纯创建一个 不定义大小的数组 , 内部存储的逻辑 是尾插法

Go复制代码

```text
package main

import "fmt"

func main() {
  // 定义一个字符串切片
  var list []string 

  list = append(list, "枫枫")
  list = append(list, "知道")
  fmt.Println(list)
  fmt.Println(len(list)) // 切片长度
  // 修改第二个元素
  list[1] = "不知道"
  fmt.Println(list)
}
```

### make函数

除了基本数据类型，其他数据类型如果只定义不赋值，那么实际的值就是nil

Go复制代码

```text
// 定义一个字符串切片
var list []string
fmt.Println(list == nil) // true
```

那么我们可以通过make函数创建知道长度，指定容量的切片了

Go复制代码

```text
make([]type, length, capacity)
```

Go复制代码

```text
package main

import "fmt"

func main() {
  // 定义一个字符串切片
  var list = make([]string, 0)
  fmt.Println(list, len(list), cap(list))
  fmt.Println(list == nil) // false

  list1 := make([]int, 2, 2)
  fmt.Println(list1, len(list1), cap(list1))
}
```

### 为什么叫切片

因为切片是数组切出来的

Go复制代码

```text
package main

import "fmt"

func main() {
  var list = [...]string{"a", "b", "c"}
  slices := list[:] // 左一刀，右一刀  变成了切片
  fmt.Println(slices)
  fmt.Println(list[1:2]) // b
}
```

### 切片排序

现代 go中实现的替补的升降序方法

slices\.Sort\(\[\]string\{"b","a","c"\}\)

实现排序 都是返回空 , 静态的直接修改本体;

最新版本 :slices\.SortDescending\(\[\]float64\{3\.2,1\.5,2\.8\}\)

兼容版本: sort\.Sort\(sort\.Reverse\(sort\.IntSlice\(ageList\)\)\)

Go复制代码

```text
var list = []int{4, 5, 3, 2, 7}
fmt.Println("排序前:", list)
sort.Ints(list)
fmt.Println("升序:", list)
sort.Sort(sort.Reverse(sort.IntSlice(list)) //内部先实现)   
fmt.Println("降序:", list)
```

## map

Go语言中的map\(映射、字典\)是一种内置的数据结构，它是一个`无序`的key\-value对的集合

map的key必须是基本数据类型，value可以是任意类型

注意，map使用之前一定要初始化

Go复制代码

```text
package main

import "fmt"

func main() {
  // 声明 + 定义 
  var m1 map[string]string  这种申明方式内部没有创建空间没作用
  // 初始化1
  m1 = make(map[string]string) 可以直接使用键值创建对象,已经开辟空间
  // 设置值
  m1["name"] = "枫枫"
  fmt.Println(m1)
  // 取值
  fmt.Println(m1["name"])
  // 删除值
  delete(map名, 键名字)
  fmt.Println(m1)
}
```

也可以声明并赋值

Go复制代码

```text
// 声明并赋值
var m1 = map[string]string{}
var m2 = make(map[string]string)
```

### map取值

如果只有一个参数接，那这个参数就是值，如果没有，这个值就是类型的零值

如果两个参数接，那第二个参数就是布尔值，表示是否有这个元素

Go复制代码

```text
package main

import "fmt"

func main() {
  // 声明并赋值
  var m1 = map[string]int{
    "age": 21,
  }
  age1 := m1["age1"] // 取一个不存在的
  fmt.Println(age1)
  age2, ok := m1["age1"]
  fmt.Println(age2, ok)
}
```

## 参考文档

1. 数组与切片 [https://zhuanlan\.zhihu\.com/p/456844080](https://zhuanlan.zhihu.com/p/456844080)
2. map [https://blog\.csdn\.net/qq\_39312146/article/details/127914811](https://blog.csdn.net/qq_39312146/article/details/127914811)
