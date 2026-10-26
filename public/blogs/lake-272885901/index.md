安装驱动

Go复制代码

```text
go get -u github.com/go-sql-driver/mysql
```

### 连接

Go复制代码

```text
db, err := sql.Open("mysql", "root:root@tcp(127.0.0.1:3306)/gorm_new_db")
if err != nil {
  log.Fatalf("数据库连接失败 %s", err)
}
```

#### 关闭数据库DB 的连接

````text
`B.DB().Close().Error` 不能工作的根本原因：
### 1. `DB.DB()` 返回两个值

```go
// gorm 源码签名
func (db *DB) DB() (*sql.DB, error)
```

Go 语言不允许对多返回值进行链式调用，必须先 `sqlDB, err := DB.DB()` 接收两个返回值。

### 2. `Close()` 返回的就是 `error`，没有 `.Error` 属性
```go
// *sql.DB 源码签名
func (db *DB) Close() error
```
`Close()` 返回的已经是 `error` 类型，不需要也不能再写 `.Error`。你之前的写法是想把 error 当结构体取字段，但 error 只是一个接口。

### 已修复的代码

````

### 执行sql

除查询外，使用Exec函数

Go复制代码

```text
package main

import (
  "database/sql"
  "fmt"
  _ "github.com/go-sql-driver/mysql"
  "log"
)

func main() {
  // 连接数据库
  db, err := sql.Open("mysql", "root:root@tcp(127.0.0.1:3306)/gorm_new_db")
  if err != nil {
    log.Fatalf("数据库连接失败 %s", err)
  }
  defer db.Close()
  _, err2 := db.Exec("CREATE TABLE users1(id INT NOT NULL , name VARCHAR(20), PRIMARY KEY(ID));")
  if err2 != nil {
    log.Fatal(err2)
  }

  fmt.Println("successfully create table")

}
```

### 查询sql

可以使用Query函数

Go复制代码

```text
package main

import (
  "database/sql"
  "fmt"
  _ "github.com/go-sql-driver/mysql"
  "log"
)

func main() {
  // 连接数据库
  db, err := sql.Open("mysql", "root:root@tcp(127.0.0.1:3306)/gorm_new_db")
  if err != nil {
    log.Fatalf("数据库连接失败 %s", err)
  }
  defer db.Close()

  res, err := db.Query("select id, name from users")
  for res.Next() {
    var id int
    var name string
    // 这里scan的字段要对上
    err = res.Scan(&id, &name)
    fmt.Println(id, name, err)
  }

}
```

也可以使用QueryRow函数，查一行

Go复制代码

```text
package main

import (
  "database/sql"
  "fmt"
  _ "github.com/go-sql-driver/mysql"
  "log"
)

func main() {
  // 连接数据库
  db, err := sql.Open("mysql", "root:root@tcp(127.0.0.1:3306)/gorm_new_db")
  if err != nil {
    log.Fatalf("数据库连接失败 %s", err)
  }
  defer db.Close()

  var id int
  var name string
  // 这里scan的字段要对上
  err = db.QueryRow("select id, name from users").Scan(&id, &name)
  fmt.Println(id, name, err)

}
```
