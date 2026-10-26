gorm的引入肯定是为了我们更好的操作数据库

在使用原生sql查询的时候

最大的问题就是没办法映射到结构体上

我们不难发现，数据库里面的记录就很想一个结构体，数据库的一列对应一个字段

所以数据库到结构体的映射就是orm的一个最大特点

所有的orm都是如此

使用一个类或者一个结构体表示一张表

然后使用一个实例化对象表示一条记录

字段表示列

你品，你细品

所以，知道这个关系之后，我们再来看看gorm的用法

安装

Go复制代码

```text
go get -u gorm.io/gorm
go get gorm.io/driver/mysql
```

视频里面的版本是 v1\.25\.12

有些同学跟着视频做，发现结果不一样，如果你确定代码和我的一样，那么就看看版本是不是一样的

### gorm连接数据库

Go复制代码

```text
package main

import (
  "fmt"
  "gorm.io/driver/mysql"
  "gorm.io/gorm"
)

func main() {
  // 连接数据库
  db, err := gorm.Open(mysql.Open("root:root@tcp(127.0.0.1:3306)/gorm_new_db?charset=utf8mb4&parseTime=True&loc=Local"), &gorm.Config{})
  fmt.Println(db, err)
}
```

### 查询记录

Go复制代码

```text
package main

import (
  "fmt"
  "gorm.io/driver/mysql"
  "gorm.io/gorm"
)

type User struct {
  ID   uint
  Name string
}

func main() {
  // 连接数据库
  db, err := gorm.Open(mysql.Open("root:密码@tcp(127.0.0.1:端口号)/gorm_new_db?charset=utf8mb4&parseTime=True&loc=Local"), &gorm.Config{})
  if err != nil {
    fmt.Println(err)
    return
  }

  var userList []User
  db.Find(&userList)

  fmt.Println(userList)

}
```

可以看到使用gorm去做sql操作，真的太方便了
