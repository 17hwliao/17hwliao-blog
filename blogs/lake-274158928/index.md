xuexi在学习mysql多表关系的时候

我们都知道有一对一关系，一对多关系，多对多关系

我们不按照gorm的BelongsTo和Has Many去理解

而是从实际场景去理解

## 一对一关系

只要：

- 子表有 `UserID`（主表名 \+ ID）
- 主表有 `Detail UserDetail`

垂直分表 :

用户与用户详情是很明显的一对一关系

那么需要怎么表示这种一对一关系呢

在mysql里面，需要在另一种表里面增加一个字段

例如 user表和user\_detail表

那么就需要在user\_detail表中增加一个user\_id字段

或者在user表中新增user\_detail\_id字段

这个字段我们把它称之为外键字段

在一对一关系里面，外键字段随便在哪一张表里面都行

在gorm里面如何表示？

Go复制代码

```text
package main

import (
  "fmt"
  "gorm.io/driver/mysql"
  "gorm.io/gorm" 
)

var DB *gorm.DB

type UserModel struct {
  ID   int64
  Name string `gorm:"size:32"`
  Age  int
}

type UserDetailModel struct {
  ID        int64
  UserID    int64
  UserModel UserModel `gorm:"foreignKey:UserID"`   //会生成实体外键  
  Email     string    `gorm:"size:64"`
}

func init() {
  db, err := gorm.Open(mysql.Open("root:root@tcp(127.0.0.1:3306)/gorm_new_db?charset=utf8mb4&parseTime=True&loc=Local"), &gorm.Config{})
  if err != nil {
    fmt.Println(err)
    return
  }
  DB = db
}

func migrate() {
  err := DB.AutoMigrate(&UserModel{}, &UserDetailModel{})
  if err != nil {
    fmt.Println(err)
    return
  }
  fmt.Println("表结构生成成功")
}

func main() {
  migrate()
}
```

这种方式会生成实体外键，如果是个人使用的话，有外键会好一点，它可以做一些数据约束

如果不需要生成实体外键，则可以进行如下配置

Go复制代码

```text
db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
  DisableForeignKeyConstraintWhenMigrating: true,  // 不生成实体外键
})
```

那么针对这个表结构

//普通结构体直接互相使用需要使用指针来替换 ;

UserModel 中的UserDetailModel 属于反向引用

UserDetailModel 中的UserModel 属于正向引用

Go复制代码

```text
type UserModel struct {
  ID   int64
  Name string `gorm:"size:32"`
  Age  int
  UserDetailModel *UserDetailModel `gorm:"foreignKey:UserID"`
}

type UserDetailModel struct {
  ID        int64
  UserID    int64
  UserModel UserModel `gorm:"foreignKey:UserID"`
  Email     string    `gorm:"size:64"`
}
```

那么增删改查怎么操作呢？

### 插入数据

先插入user，再插入user\_detail

Go复制代码

```text
DB.Create(&UserModel{
  Name: "枫枫",
  UserDetailModel: &UserDetailModel{
    Email: "xxx@qq.com",
  },
})
```

给已有的user插入user\_detail

Go复制代码

```text
err :=  DB.Create(&UserDetailModel
{
  //UserModel: &models.UserModel{ID:14} , 
  UserID: 2,   //配置连接
  Email:  "zzz@qq.com", 
}).Error
```

知道user，插入user\_detail

Go复制代码

```text
var user UserModel
DB.Take(&user, 2)

DB.Create(&UserDetailModel{
  UserModel: user,
  Email:     "zzz@qq.com",
})
```

### 查询数据

Go复制代码

```text
// 根据用户查用户详情
var user UserModel
DB.Preload("UserDetailModel").Take(&user, 2)
fmt.Println(user.Name, user.UserDetailModel.Email)

// 根据用户详情查用户
var userDetail UserDetailModel
DB.Preload("UserModel").Take(&userDetail, "user_id = ?", 2)
fmt.Println(userDetail.Email, userDetail.UserModel.Name)
```

重点是Preload预加载 , 先创建对象 , 对象内部的参数实现预加载后\(注意这里如果是指针 , 不可以从空指针中查询数据, 会出现panic报错, 查询后使用Take得到数据, \)

Preload \("关联名"\) 功能

**预加载关联数据 \= 一次性把「主表数据 \+ 关联外键表数据」一起查出来** 解决 **N\+1 查询问题**

### 删除数据

针对多表关系下的删除

情况就有所不同了

一般会涉及到关联删除

例如用户和用户详情，如果用户被删除了，那么用户详情就没必要留着了，需要级联删除

这里注意软删除 :

当结构体中使用了DeleteAt time\.Time 使用 Delete\(\) 就不会出现数据被真实删除的情况 ;

这时候使用Unscoped\(\) : 可以实现取消过滤, 查出全部的数据 ;

Go复制代码

```text
var user UserModel
  DB.Take(&user, 2) 
  DB.Select("UserDetailModel").Delete(&user)
```

但是还有些是不需要级联删除的，需要把对应的外键给设置为Null

一句话：**因为 GORM 的 Select \("关联名"\)\.Delete \(&amp; 主记录\) 是「应用层级联删除」**—— 它会**自动按外键条件，把你选中的那些关联表记录一起删掉**，不是只删外键引用，而是**连带删关联行**。

**专门用来操作 结构体里的关联关系**，只**改关联绑定关系，不删除主表 / 子表整条数据**

一句话总结

`Association("关联字段名")` \= **管理两表之间的绑定关系** 只改**外键字段**，**不删任何一行数据**

Go复制代码

```text
var user UserModel
DB.Take(&user, 1)
DB.Delete(&user)
DB.Model(&user).Association("UserDetailModel").Clear()
```

这两种情况都是很常见的关联删除，可以有更简单的方式实现

除了使用gorm自带的关联联删功能 , 可以直接使用set null 实现删除字段 ;

先删清关联直接可以实现互换

这个本质上其实还是使用的 数据库层面上的关联的逻辑 ;

Go复制代码

```text
type UserModel struct {
  ID              int64
  Name            string `gorm:"size:32"`
  Age             int
  UserDetailModel *UserDetailModel `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`  // CASCADE   或者  SET NULL
}
```

前提得生成实体外键才行，而且修改关系之后要重新删掉实体外键再生成

## 一对多关系（舔狗与女神版）

生活中的一对多就更多了

用户与文章

舔狗与女神

班级与学生

Go复制代码

```text
type Girl struct {
  ID      int64
  Name    string `gorm:"size:32"`
  BoyList []Boy  `gorm:"foreignKey:GirlID"` 
}

type Boy struct {
  ID     int64
  GirlID int64 
  Name   string `gorm:"size:32"`
  Girl   Girl   `gorm:"foreignKey:GirlID"`
}
```

那么对应Girl来说，Body就是她拥有的，叫Has Many

对应Boy来说，Girl就是他的归属，叫Belongs To

那么一对多的增删改查又该怎么做呢？

### 插入数据

创建一个女神，连带几个舔狗

Go复制代码

```text
DB.Create(&Girl{
  Name: "娜娜",
  BoyList: []Boy{
    {Name: "张三"},
    {Name: "王五"},
  },
})
```

创建一个女神, 选中一个舔狗 ;

```text
err := DB.Create(&models.GirlModel{
    Name : "newgirl" , 
    BoyList : []models.BoyModel{
       {ID : 2} ,  
    } , 
}).Error
```

创建boy，然后自带女神

Go复制代码

```text
DB.Create(&Boy{
    Name: "枫枫",
    Girl: Girl{
      Name: "露露",
    },
  })
```

创建Boy，然后关联已有女神

Go复制代码

```text
var girl Girl
DB.Take(&girl, "name = ?", "露露")

DB.Create(&Boy{
  Name: "李四",
  Girl: girl,
})
```

### 关联查询

查女神，连带把他的舔狗也查出来

Go复制代码

```text
var girl Girl
  DB.Preload("BoyList").Take(&girl, "name = ?", "露露")
  fmt.Println(girl)
```

带条件的Preload

Go复制代码

```text
girl = Girl{}
  DB.Preload("BoyList", "name = ?", "枫枫").Take(&girl, "name = ?", "露露")
  fmt.Println(girl)
```

查女神的舔狗列表

Go复制代码

```text
girl = Girl{}
  DB.Take(&girl, "name = ?", "露露")
  var bodyList []Boy
  DB.Model(girl).Association("BoyList").Find(&bodyList)
  fmt.Println(bodyList)
```

查女神的舔狗总数

Go复制代码

```text
count := DB.Model(girl).Association("BoyList").Count()
  fmt.Println(count)
```

### 关联操作

1，2号不舔了，换成了3号

Go复制代码

```text
var b3 = Boy{
  ID: 3,
}
girl := Girl{}
DB.Take(&girl, "name = ?", "露露")

DB.Model(&girl).Association("BoyList").Replace([]Boy{b3})
```

都不舔了

Go复制代码

```text
girl := Girl{}
  DB.Take(&girl, "name = ?", "露露")
  DB.Model(&girl).Association("BoyList").Clear()
```

1，3号又开始舔了

Go复制代码

```text
girl := Girl{}
  DB.Take(&girl, "name = ?", "露露")
  DB.Model(&girl).Association("BoyList").Append([]Boy{{ID: 1}, {ID: 3}})
```

只有3号退出了

Go复制代码

```text
girl := Girl{}
  DB.Take(&girl, "name = ?", "露露")
  DB.Model(&girl).Association("BoyList").Delete([]Boy{{ID: 3}})
```

## 多对多关系

生活中多对多关系就更多了

文章和标签

书和作者

舔狗和女神

多对多关系就必须借助第三张表来进行关联

例如文章和 标签

<table class="ne-table" id="dxS58"><tbody><tr><td width="250"></td><td width="250"></td><td width="250"></td></tr><tr><td width="250"><p class="ne-p" id="uff78ced2"><span class="ne-text">id</span></p></td><td width="250"><p class="ne-p" id="ucc1674ad"><span class="ne-text">article_id</span></p></td><td width="250"><p class="ne-p" id="u1a8f4b60"><span class="ne-text">tag_id</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u59cc9ec5"><span class="ne-text">1</span></p></td><td width="250"><p class="ne-p" id="u9bcafc28"><span class="ne-text">1</span></p></td><td width="250"><p class="ne-p" id="uf7b43c39"><span class="ne-text">1</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ub9b5f9f3"><span class="ne-text">2</span></p></td><td width="250"><p class="ne-p" id="uc7c59644"><span class="ne-text">1</span></p></td><td width="250"><p class="ne-p" id="u6f4e653e"><span class="ne-text">2</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u4d3c5a04"><span class="ne-text">3</span></p></td><td width="250"><p class="ne-p" id="u3bd8c5ac"><span class="ne-text">2</span></p></td><td width="250"><p class="ne-p" id="ub073c3af"><span class="ne-text">1</span></p></td></tr></tbody></table>

很容易看出来，文章1有两个标签，分别是1和2，文章2有一个标签是1

所以在gorm中，如何实现呢？

Go复制代码

```text
type Article struct {
  ID      int64
  Title   string `gorm:"size:32"`
  TagList []Tag  `gorm:"many2many:article_tags;"`
}

type Tag struct {
  ID          int64
  Title       int64     `gorm:"size:32"`
  ArticleList []Article `gorm:"many2many:article_tags;"`
}
```

### 插入数据

创建文章，并创建标签

Go复制代码

```text
article := Article{Title: "文章1", TagList: []Tag{
    {Title: "go"},
    {Title: "python"},
  }}
  DB.Create(&article)
```

创建文章，选择已有标签

Go复制代码

```text
tagIDList := []int64{1, 2}
  var tagList []Tag
  DB.Find(&tagList, "id in ?", tagIDList)

  DB.Create(&Article{
    Title:   "文章2",
    TagList: tagList,
  })
```

### 关联查询

查文章列表，并把标签带出来

Go复制代码

```text
var articleList []Article
  DB.Preload("TagList").Find(&articleList)
  fmt.Println(articleList)
```

### 关联操作

更新一篇文章的标签列表

Go复制代码

```text
var article Article
  DB.Take(&article, "title = ?", "文章1")

  DB.Model(&article).Association("TagList").Replace([]Tag{
    {ID: 1},
    {Title: "后端"},
  })
```

### 自定义第三张表

以用户收藏文章为例

就是用户与文章的多对多关系

如果用默认的第三张表，用户想知道什么时候收藏的某一篇文章，就没办法了

表结构

Go复制代码

```text
type UserModel struct {
  ID              int64
  Name            string
  CollArticleList []Article1Model `gorm:"many2many:user2_article_models;joinForeignKey:UserID;JoinReferences:ArticleID"`
}
type ArticleModel struct {
  ID    int64
  Title string `gorm:"size:32"`
  /如果后期需要实现反向查询的功能的时候需要加下方的字段 
  /CollArticle1List []User1Model `gorm:"many2many:user2_article_models;joinForeignKey:ArticleID;JoinReferences:UserID"`
}
type User2ArticleModel struct {
//创建主键 + 外键 ; 
  UserID       int64        `gorm:"primaryKey"`
  UserModel    UserModel    `gorm:"foreignKey:UserID"`
  ArticleID    int64        `gorm:"primaryKey"`
  ArticleModel ArticleModel `gorm:"foreignKey:ArticleID"`
  CreatedAt    time.Time    `json:"createdAt"`
}

② joinForeignKey:ArticleID
含义：中间表里，保存「当前模型」ID 的字段叫什么。
你现在写在 User 结构体里
当前模型 = User
joinForeignKey:ArticleID → ❗❌ 名字写反了，容易搞混！
正确理解方式（最稳记忆）：
joinForeignKey = 中间表里 → 「本表」的外键字段名
本表是 User → 中间表里存 UserID 的字段 → 默认叫 user_id
你写 ArticleID 会让中间表用 article_id 存 User 的 ID，逻辑别扭但语法允许

③ joinReferences:UserID
含义：中间表里，保存「对方模型」ID 的字段叫什么。
对方模型是 ArticleModel
joinReferences:UserID → 中间表里存 Article ID 的字段叫 user_id
同样：名字写反了，只是能跑而已
```

重点是many2many:生成表的名称要和第三张表的名称要对上

然后joinForeignKey对应的是本表的ID，例如用户表的joinForeignKey就是UserID

JoinReferences对应的是对方表的ID，用户表的JoinReferences就是ArticleID

然后就是要添加SetupJoinTable，不然是不会走第三张表的创建钩子

Go复制代码

```text
// 必须要加这个才会走第三张表的创建钩子
  DB.SetupJoinTable(&UserModel{}, "CollArticleList", &User2ArticleModel{})
```

然后创建，删除就和之前是一样的了

Go复制代码

```text
DB.Create(&UserModel{
  Name: "张三",
  CollArticleList: []ArticleModel{
    {Title: "文章1"},
    {Title: "文章2"},
  },
})
```

Go复制代码

```text
var user UserModel
DB.Take(&user)
DB.Select("CollArticleList").Delete(&user)
```

查询

查询不能直接用Preload了，因为Preload出来的是对方表，是没有收藏时间的

所以常规操作是直接查第三张表

先要实现预加载前面的一二张表, 最后查询的信息从第三章表中获取 ;

Go复制代码

```text
type UserCollArticleResponse struct {
    Name         string
    UserID       int64
    ArticleTitle string
    ArticleID    int64
    Date         time.Time
  }

var userID = 4
var userArticleList []models.User2ArticleModel
var collList []UserCollArticleResponse
global.DB.Preload("UserModel").Preload("ArticleModel").Find(&userArticleList, "user_id = ?", userID)
for _, model := range userArticleList {
  collList = append(collList, UserCollArticleResponse{
    Name:         model.UserModel.Name,
    UserID:       model.UserID,
    ArticleTitle: model.ArticleModel.Title,
    ArticleID:    model.ArticleID,
    Date:         model.CreatedAt,
  })
}
fmt.Println(collList) 
```

#### 清除关联关系

注意下面的这些命令是不会删除 初始信息的那两张表的 :

global\.DB\.Model\(&amp;user\)\.Association\("CollArticlelist "\)\.Clear\(\) ;
