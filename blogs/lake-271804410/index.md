不同的请求体对应的原始内容

使用 io\.ReadAll\( c\.Request\.Body \) 可以创建一个一次性的文件操作流 ;

可以上传任意形式的文件类型 , 但是只能读取一次 ;

### body阅后即焚问题解决

请求体获取之后就会销毁, 需要拿到阅读后的内容蓄一个新的

Go复制代码

```text
byteData, _ := io.ReadAll(c.Request.Body)
fmt.Println(string(byteData))
// 读了之后，body就没了，阅后即焚
c.Request.Body = io.NopCloser(bytes.NewReader(byteData))
```

### form\-data

Go复制代码

```text
----------------------------853882779395683818968400
Content-Disposition: form-data; name="name"

枫枫
----------------------------853882779395683818968400
Content-Disposition: form-data; name="age"

1234
----------------------------853882779395683818968400--
```

对应的分隔符就是

Go复制代码

```text
Content-Type:[multipart/form-data; boundary=--------------------------052455317193517003536866]
```

### x\-www\-form\-urlencoded

url编码

中文状态下可以实现输出

Go复制代码

```text
name=%E6%9E%AB%E6%9E%AB&age=1234
```

### json 重中之重

## `url.ParseQuery` 完全详解

`url.ParseQuery` 是 Go 标准库 `net/url` 包中的一个函数，用于**解析查询字符串**（query string），将其转换为可操作的键值对结构。

Go复制代码

```text
{
    "name": "枫枫",
    "age": 23
 }
```
