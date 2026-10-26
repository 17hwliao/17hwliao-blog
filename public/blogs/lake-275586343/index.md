## 下载

Go复制代码

```text
go mod init your-project
go get github.com/casbin/casbin/v3@latest
go mod tidy
```

casbin有两个部分组成，一个是配置文件，一个是规则集

```text
model.conf = 表结构和查询逻辑
policy.csv = 表中的具体数据
```

#### model\.pml : 权限系统规则

- 一次权限请求需要提供什么参数；
- 一条权限记录由哪些字段组成；
- 是否支持角色；
- 多条规则冲突时如何处理；
- 最终如何匹配。

Go复制代码

```text
[request_definition] 请求
r = sub, obj, act

[policy_definition]	策略	
p = sub, obj, act

[matchers]  匹配
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act  //制定匹配规则

[policy_effect]  权限
e = some(where (p.eft == allow))  //全部都是匹配的就直接放行 
```

#### policy\.csv

Go复制代码

```text
框架 : 
p, admin, /users, GET
p, admin, /users, POST
p, editor, /articles, GET
p, editor, /articles, POST

g, alice, admin
g, bob, editor

p, zhangsan, /index, GET
p, zhangsan, /home, GET
p, zhangsan, /users, GET
p, zhangsan, /users, POST
p, wangwu, /index, GET
p, wangwu, /home, GET
```

demo\.go

```text
[request_definition]
r = sub, obj, act

sub：主体，谁要访问
obj：客体，要访问什么
act：动作，要做什么

实例代码 : 
ok , err := e.Enforce("alice","/users","GET")

r.sub = alice
r.obj = /users
r.act = GET
```

```text
[policy_definition]
p = sub, obj, act

每一个p权限规则:角色或用户、资源、操作

p, admin, /users, GET

p.sub = admin
p.obj = /users
p.act = GET
```

```text
[role_definition]
g = _, _

表示启用 RBAC 角色继承关系 :用户属于某个角色

g, alice, admin
```

```text
[policy_effect]
e = some(where (p.eft == allow))
```

```text
[matchers]
m = g(r.sub, p.sub) &&
    r.obj == p.obj &&
    r.act == p.act

意思是必须同时满足：
请求用户拥有策略中指定的角色；
请求资源相同；
请求动作相同。
```

Go复制代码

```text
package main

import (
  "fmt"
  "github.com/casbin/casbin/v2"
  "log"
)

func check(e *casbin.Enforcer, sub, obj, act string) {
  ok, _ := e.Enforce(sub, obj, act)  --> 实现角色验证
  if ok {
    fmt.Printf("%s CAN %s %s\n", sub, act, obj)
  } else {
    fmt.Printf("%s CANNOT %s %s\n", sub, act, obj)
  }
}

func main() {
  e, err := casbin.NewEnforcer("./model.pml", "./policy.csv")
  if err != nil {
    log.Fatalf("NewEnforecer failed:%v\n", err)
  }

  check(e, "zhangsan", "/index", "GET")
  check(e, "zhangsan", "/home", "GET")
  check(e, "zhangsan", "/users", "POST")
  check(e, "wangwu", "/users", "POST")
}
```

正常情况下，你会得到

Go复制代码

```text
zhangsan CAN GET /index
zhangsan CAN GET /home
zhangsan CAN POST /users
wangwu CANNOT POST /users
```

## Casbin配置文件

最开始看到model\.pml和policy\.csv文件，估计还是一脸懵的

那让我们来看看casbin的配置文件

### Request 相关简洁见demo\.go中的相关解释

代表请求。看我们上面的例子：

text复制代码

```text
[request_definition]
r = sub, obj, act
```

代表一个请求有三个标准元素，请求主体，请求对象，请求操作

以用户 fengfeng 用GET请求 /api/users接口为例：

请求主体就是 fengfeng

请求对象就是 /api/users

请求操作就是 GET

### Policy和Policy\_Rule

Policy 代表策略，它表示具体的权限定义的规则是什么

在policy\.csv文件中定义的策略就是policy\_rule。它和Policy是一一对应的。

例如我们上面的例子：

text复制代码

```text
[policy_definition]
p = sub, obj, act
```

我们定义了 policy 的规则如此，那么我们在 policy\.csv 中每⼀⾏定义的 policy\_rule 就必须和这个属性⼀⼀对应

### Matcher

有请求，有规则，那么请求是否匹配某个规则，则是matcher进行判断的，例如：

YAML复制代码

```text
[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
```

表示当

YAML复制代码

```text
r.sub == p.sub && r.obj == p.obj && r.act == p.act
```

的时候返回true，否则返回false，也就是三者完全匹配的时候，返回true

### Effect

Effect ⽤来判断如果⼀个请求满⾜了规则，是否需要同意请求。它的规则⽐较复杂⼀些。

比如我们这里：

YAML复制代码

```text
[policy_effect]
e = some(where (p.eft == allow))
```

这里的some表示括号中的表达式个数大于等于1就行。 我们这句话的意思就是将request和所有policy比对完之后，所有policy的策略结果\(p\.eft\)为allow的个数&gt;\=1，整个请求的策略就是true

## 访问控制模型

除了文档中提到的，casbin还支持多种访问控制模型

[https://casbin\.org/zh/docs/supported\-models/](https://casbin.org/zh/docs/supported-models/)

### ACL访问控制

Access Control List\(访问控制列表\)

ACL是最早也是最基本的一种访问控制机制，它的原理非常简单：

每一项资源，都配有一个列表，这个列表记录的就是哪些用户可以对这项资源执行CRUD中的那些操作。当系统试图访问这项资源时，会首先检查这个列表中是否有关于当前用户的访问权限，从而确定当前用户可否执行相应的操作。总得来说，ACL是一种面向资源的访问控制模型，它的机制是围绕 资源 展开的。

上面的demo就是acl访问控制的例子

增加规则

Go复制代码

```text
// 实现新增加策略
e.AddPolicy("wangwu", "/users", "POST")
e.SavePolicy()
```

删除规则

Go复制代码

```text
e.RemovePolicy("wangwu", "/users", "POST")
e.SavePolicy()  //实现的操作是将新增夹的g规则自动写入数据库;
使用内存实现重新添加规则的时候不需要实现save() ; 
```

### RBAC访问控制

就是创建一个角色\. 特定的角色得到的控制资源都是一样的, 直接给用户附上角色名实现控制资源;

修改角色的权限时，属于这个角色的用户权限就会相应的修改

mode\.pml文件

Go复制代码

```text
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act  //人是属于角色,请求对象=角色对象,操作等于角色操作
```

policy\.csv

Go复制代码

```text
p, admin, /index, GET
p, admin, /home, GET
p, admin, /users, GET
p, admin, /users, POST
p, yunwei, /index, GET
p, yunwei, /home, GET
g, zhangsan, admin
g, wangwu, yunwei
```

判断的代码还是一样的

Go复制代码

```text
check(e, "zhangsan", "/index", "GET")
check(e, "zhangsan", "/home", "GET")
check(e, "zhangsan", "/users", "POST")
check(e, "wangwu", "/users", "POST")
```

但是有了角色之后，系统新增一个用户，只需要给这个用户分配角色

然后可以在角色管理中新增一个角色，然后设置角色的访问权限，可以访问哪些接口

在这个模式下，一个用户是可以有多个角色的，例如

Go复制代码

```text
p, admin, /index, GET
p, admin, /home, GET
p, admin, /users, GET
p, admin, /users, POST
p, yunwei, /index, GET
p, yunwei, /home, GET
g, zhangsan, admin
g, wangwu, yunwei
g, wangwu, admin
```

增加角色

Go复制代码

```text
e.AddPolicy("kuaiji", "/users", "GET")
e.SavePolicy()
```

增加用户\-角色对应关系

Go复制代码

```text
e.AddRoleForUser("zhangsan", "kuaiji")
e.SavePolicy()
```

删除用户\-角色对应关系

Go复制代码

```text
e.RemoveGroupingPolicy("zhangsan", "kuaiji")
e.SavePolicy()
```

删除角色

Go复制代码

```text
e.RemovePolicy("kuaiji", "/users", "GET")
e.SavePolicy()
```

## gorm接入Casbin

其实基于上面的rbac，就可以做一个角色访问控制功能了

但是目前整个规则集是存储在文件中的

实际应用中肯定还是会把casbin的规则集放到数据库里面

Go复制代码

```text
go get github.com/casbin/gorm-adapter/v3
```

init gorm

Go复制代码

```text
package core

import (
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func InitGorm() *gorm.DB {
	dsn := "root:root@tcp(127.0.0.1:3306)/rule_db?charset=utf8mb4&parseTime=True&loc=Local"
  //创建GORM操作对象
	db, err := gorm.Open(mysql.Open(dsn)//提交驱动, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),    //设置日志
		DisableForeignKeyConstraintWhenMigrating: true,   //禁止使用外键
	})
	if err != nil {
		logrus.WithError(err).Error("MySQL 连接失败")
		panic(err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		logrus.WithError(err).Error("获取原生 MySQL 连接失败")
		panic(err)
	}

	if err := sqlDB.Ping(); err != nil {
		logrus.WithError(err).Error("MySQL Ping 失败")
		panic(err)
	}
  //设置连接池
	sqlDB.SetMaxIdleConns(10)
  //最多创建100条连接
	sqlDB.SetMaxOpenConns(100)
  //一条连接最多复用4小时
	sqlDB.SetConnMaxLifetime(4 * time.Hour)
  
	logrus.Info("MySQL 已连接：rule_db")
	return db
}
```

迁移表的时候，把CasbinRule一起生成出来

Go复制代码

```text
gormadapter "github.com/casbin/gorm-adapter/v3"

global.DB.AutoMigrate(&gormadapter.CasbinRule{},)
```

### casbin连接关联gorm

```text
err := global.DB.AutoMigrate(&gormadapter.CasbinRule{})
if err != nil {
	panic(err)
}
```

Go复制代码

```text
global.DB = core.InitGorm()
a, _ := gormadapter.NewAdapterByDB(global.DB)
使用已经创建好的GORM数据库对象,创建Casbin的Adapter ; 
//加载鉴权框架
m, err := model.NewModelFromFile("./testdata/model.pml")
if err != nil {
  logrus.Error("字符串加载模型失败!", err)
  return
}
创建一个带缓存的Casbin执行器 ; 
e, _ := casbin.NewCachedEnforcer(m, a)  
e.SetExpireTime(60 * 60)
_ = e.LoadPolicy()

步骤 : 
MySQL（rule_db）
   ↓
GORM：global.DB
   ↓
GORM Adapter：a
   ↓
Casbin Model：m
   ↓
CachedEnforcer：e
   ↓
从 casbin_rule 表加载 p、g 策略
```

### rbac的增删改查

Go复制代码

```text
e.AddPolicy("admin", "/api/users", "GET")
e.AddRoleForUser("zhangsan", "admin")
check(e, "zhangsan", "/api/users", "GET")
e.RemoveGroupingPolicy("zhangsan", "admin")
e.RemovePolicy("admin", "/api/users", "GET")
check(e, "zhangsan", "/api/users", "GET")
e.SavePolicy()
check(e, "zhangsan", "/api/users", "GET")
```
