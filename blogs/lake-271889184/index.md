## 表单参数

一般就是专指form表单

Go复制代码

```text
name := c.PostForm("name")
age, ok := c.GetPostForm("age")
fmt.Println(name)
fmt.Println(age, ok)
```

### 文件上传

fileHeader\.Open\( \) : 打开上传的文件，返回一个可读的文件流 ;

Go复制代 码

```text
r.POST("users", func(c *gin.Context) {
  fileHeader, err := c.FormFile("file")
  if err != nil {
    fmt.Println(err)
    return
  }
  fmt.Println(fileHeader.Filename) // 文件名
  fmt.Println(fileHeader.Size)     // 文件大小，单位是字节

  file, _ := fileHeader.Open()   //实现读取文件
  byteData, _ := io.ReadAll(file)

  err = os.WriteFile("xxx.jpg", byteData, 0666)  //末尾数字参数为读写权限
  //只针对linux系统使用有效果, windows的权限系统不是使用数字,是列表
  //windows由系统的默认/继承规则决定。通常是你有完全控制权，其他账户只读。
  fmt.Println(err)
})
```

还有一种简单方式

Go复制代码

```text
err = c.SaveUploadedFile(fileHeader, "uploads/xxx/yyy/"+fileHeader.Filename)
fmt.Println(err)
```

多文件上传

Go复制代码

```text
r.POST("users", func(c *gin.Context) {
    form, err := c.MultipartForm()
    if err != nil {
      fmt.Println(err)
      return
    }
    for key, headers := range form.File {   // key 前端返回的后端key字段
      for  i, header := range headers {   // i 获取文件索引 (int)
        c.SaveUploadedFile(header, "uploads/"+header.Filename)
      }
    }
  })
```
