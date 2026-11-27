## 表结构

在gorm中，使用结构体表示一张表

例如User表

通常情况下，我们会使用Model结尾表示它是表的结构体

Go复制代码

```text
type UserModel struct {
  ID        int64     `gorm:"primaryKey"` // 主键
  Name      string    `gorm:"not null;unique"` // 不能为空，且唯一 
  CreatedAt time.Time // 在创建记录时自动设置为当前时间
}
```

标签参考这个 [https://gorm\.io/zh\_CN/docs/models\.html\#字段标签](https://gorm.io/zh_CN/docs/models.html#%E5%AD%97%E6%AE%B5%E6%A0%87%E7%AD%BE)

封装数据库连接 , 使用一个全局的变量使用 var \.DB

使用gorm实现的数据库连接直接连接到 全局变量中去 ;

GORM 是一个功能强大的 ORM 库，提供了丰富的数据库操作方法。以下是 GORM 提供的主要方法分类：

---

### **一、创建数据 \(Create\)**

<table class="ne-table" id="P9wFp"><tbody><tr><td width="375"><p class="ne-p" id="ua89adc22"><span class="ne-text">方法</span></p></td><td width="375"><p class="ne-p" id="u54a5f8a4"><span class="ne-text">说明</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u4311f87e"><code class="ne-code"><span class="ne-text">Create(&amp;model)</span></code></p></td><td width="375"><p class="ne-p" id="u875d2835"><span class="ne-text">插入单条记录</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uc6dee0a8"><code class="ne-code"><span class="ne-text">CreateInBatches(models, batchSize)</span></code></p></td><td width="375"><p class="ne-p" id="ue16de2f7"><span class="ne-text">批量插入</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u318c13ed"><code class="ne-code"><span class="ne-text">FirstOrCreate(&amp;dest, conditions)</span></code></p></td><td width="375"><p class="ne-p" id="u481a57b1"><span class="ne-text">查找或创建</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u273b1082"><code class="ne-code"><span class="ne-text">CreateWithOption(&amp;model, option)</span></code></p></td><td width="375"><p class="ne-p" id="u118eb042"><span class="ne-text">带选项的创建</span></p></td></tr></tbody></table>

---

### **二、查询数据 \(Query\)**

<table class="ne-table" id="Q1Ok2"><tbody><tr><td width="375"><p class="ne-p" id="uf0a85ad3"><span class="ne-text">方法</span></p></td><td width="375"><p class="ne-p" id="u6c196aaf"><span class="ne-text">说明</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u474e2b11"><code class="ne-code"><span class="ne-text">First(&amp;dest, conditions)</span></code></p></td><td width="375"><p class="ne-p" id="u577ebaa2"><span class="ne-text">查询第一条记录</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u2c90f811"><code class="ne-code"><span class="ne-text">Last(&amp;dest, conditions)</span></code></p></td><td width="375"><p class="ne-p" id="uef71a084"><span class="ne-text">查询最后一条记录</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ua53c1b4e"><code class="ne-code"><span class="ne-text">Take(&amp;dest)</span></code></p></td><td width="375"><p class="ne-p" id="ud52f2f12"><span class="ne-text">获取任意一条记录</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ue026740e"><code class="ne-code"><span class="ne-text">Find(&amp;dest, conditions)</span></code></p></td><td width="375"><p class="ne-p" id="u36d57410"><span class="ne-text">查询多条记录</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u39ebcd2e"><code class="ne-code"><span class="ne-text">FindInBatches(&amp;dest, batchSize, fc)</span></code></p></td><td width="375"><p class="ne-p" id="uc7139da8"><span class="ne-text">分批查询</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ud21e5c07"><code class="ne-code"><span class="ne-text">Pluck(column, &amp;dest)</span></code></p></td><td width="375"><p class="ne-p" id="uc6256f66"><span class="ne-text">查询指定字段</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u51306c7e"><code class="ne-code"><span class="ne-text">Count(&amp;count)</span></code></p></td><td width="375"><p class="ne-p" id="u4182e6fc"><span class="ne-text">统计数量</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ue90b7e96"><code class="ne-code"><span class="ne-text">Where(conditions)</span></code></p></td><td width="375"><p class="ne-p" id="u2a937371"><span class="ne-text">添加 WHERE 条件</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u6c796e51"><code class="ne-code"><span class="ne-text">Order(column)</span></code></p></td><td width="375"><p class="ne-p" id="ud3462014"><span class="ne-text">添加排序</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ud1abf58e"><code class="ne-code"><span class="ne-text">Limit(n)</span></code></p></td><td width="375"><p class="ne-p" id="u0840c1d1"><span class="ne-text">限制条数</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ud6c5c3b0"><code class="ne-code"><span class="ne-text">Offset(n)</span></code></p></td><td width="375"><p class="ne-p" id="uccb34eaf"><span class="ne-text">偏移量</span></p></td></tr></tbody></table>

---

### **三、更新数据 \(Update\)**

<table class="ne-table" id="DubUP"><tbody><tr><td width="375"><p class="ne-p" id="ue444a485"><span class="ne-text">方法</span></p></td><td width="375"><p class="ne-p" id="uf201f377"><span class="ne-text">说明</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ua48e5640"><code class="ne-code"><span class="ne-text">Save(&amp;model)</span></code></p></td><td width="375"><p class="ne-p" id="u6c298566"><span class="ne-text">保存（含新增或更新）</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u0bf729e3"><code class="ne-code"><span class="ne-text">Update(column, value)</span></code></p></td><td width="375"><p class="ne-p" id="u1f49261b"><span class="ne-text">更新单个字段</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ud71cd4cf"><code class="ne-code"><span class="ne-text">Updates(map[string]interface{})</span></code></p></td><td width="375"><p class="ne-p" id="ua2be0812"><span class="ne-text">更新多个字段</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ua4f2b071"><code class="ne-code"><span class="ne-text">UpdateColumn(column, value)</span></code></p></td><td width="375"><p class="ne-p" id="ufae5d823"><span class="ne-text">直接更新（跳过钩子）</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u18dc4414"><code class="ne-code"><span class="ne-text">UpdateColumns(map[string]interface{})</span></code></p></td><td width="375"><p class="ne-p" id="u64d8b0bd"><span class="ne-text">批量直接更新</span></p></td></tr></tbody></table>

---

### **四、删除数据 \(Delete\)**

<table class="ne-table" id="GnjHP"><tbody><tr><td width="375"><p class="ne-p" id="u579e5d76"><span class="ne-text">方法</span></p></td><td width="375"><p class="ne-p" id="ub9632922"><span class="ne-text">说明</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u703ea924"><code class="ne-code"><span class="ne-text">Delete(&amp;model, conditions)</span></code></p></td><td width="375"><p class="ne-p" id="uba938caa"><span class="ne-text">软删除（需要</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">DeletedAt</span></code></p><p class="ne-p" id="u233d5917"><span class="ne-text"> </span><span class="ne-text">字段）</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u4c8da175"><code class="ne-code"><span class="ne-text">Unscoped().Delete(&amp;model)</span></code></p></td><td width="375"><p class="ne-p" id="ue5857b4c"><span class="ne-text">物理删除</span></p></td></tr></tbody></table>

---

### **五、关联操作 \(Association\)**

<table class="ne-table" id="iNjOb"><tbody><tr><td width="375"><p class="ne-p" id="u37f6fd82"><span class="ne-text">方法</span></p></td><td width="375"><p class="ne-p" id="u83f62e32"><span class="ne-text">说明</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uda7a2c88"><code class="ne-code"><span class="ne-text">Association(column)</span></code></p></td><td width="375"><p class="ne-p" id="ud03d0215"><span class="ne-text">获取关联</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u35c72f71"><code class="ne-code"><span class="ne-text">Append(models...)</span></code></p></td><td width="375"><p class="ne-p" id="u34cea0e0"><span class="ne-text">添加关联</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uff9a1fde"><code class="ne-code"><span class="ne-text">Replace(models...)</span></code></p></td><td width="375"><p class="ne-p" id="u9e0e6b51"><span class="ne-text">替换关联</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u2c417721"><code class="ne-code"><span class="ne-text">Clear()</span></code></p></td><td width="375"><p class="ne-p" id="udb62dbab"><span class="ne-text">清除关联</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uf29ec480"><code class="ne-code"><span class="ne-text">Delete(models...)</span></code></p></td><td width="375"><p class="ne-p" id="u1707498a"><span class="ne-text">删除关联</span></p></td></tr></tbody></table>

---

### **六、事务 \(Transaction\)**

<table class="ne-table" id="ctHzc"><tbody><tr><td width="375"><p class="ne-p" id="udbba95d2"><span class="ne-text">方法</span></p></td><td width="375"><p class="ne-p" id="u9da0cffd"><span class="ne-text">说明</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ua529f0b2"><code class="ne-code"><span class="ne-text">Begin()</span></code></p></td><td width="375"><p class="ne-p" id="u9c6f1d2a"><span class="ne-text">开始事务</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u5777033f"><code class="ne-code"><span class="ne-text">Commit()</span></code></p></td><td width="375"><p class="ne-p" id="u699427c5"><span class="ne-text">提交事务</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u723eebc1"><code class="ne-code"><span class="ne-text">Rollback()</span></code></p></td><td width="375"><p class="ne-p" id="uab644ff3"><span class="ne-text">回滚事务</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ud5ee9275"><code class="ne-code"><span class="ne-text">Transaction(fc)</span></code></p></td><td width="375"><p class="ne-p" id="u0b8714ac"><span class="ne-text">自动事务（推荐）</span></p></td></tr></tbody></table>

---

### **七、数据库迁移 \(Migration\)**

<table class="ne-table" id="AsWTR"><tbody><tr><td width="375"><p class="ne-p" id="uc3bee154"><span class="ne-text">方法</span></p></td><td width="375"><p class="ne-p" id="u90280fc4"><span class="ne-text">说明</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u47ef88ac"><code class="ne-code"><span class="ne-text">AutoMigrate(models...)</span></code></p></td><td width="375"><p class="ne-p" id="ue8501f5d"><span class="ne-text">自动迁移表结构</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u531564f5"><code class="ne-code"><span class="ne-text">CreateTable(models...)</span></code></p></td><td width="375"><p class="ne-p" id="ue4cfa314"><span class="ne-text">创建表</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u19e1511d"><code class="ne-code"><span class="ne-text">DropTable(models...)</span></code></p></td><td width="375"><p class="ne-p" id="u0f32ae26"><span class="ne-text">删除表</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u50c4244a"><code class="ne-code"><span class="ne-text">Migrator()</span></code></p></td><td width="375"><p class="ne-p" id="u1c24e795"><span class="ne-text">获取迁移器</span></p></td></tr></tbody></table>

---

### **八、原生 SQL**

<table class="ne-table" id="GoDLC"><tbody><tr><td width="375"><p class="ne-p" id="u642a8955"><span class="ne-text">方法</span></p></td><td width="375"><p class="ne-p" id="u3964f545"><span class="ne-text">说明</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ua98d79fe"><code class="ne-code"><span class="ne-text">Raw(sql, args...)</span></code></p></td><td width="375"><p class="ne-p" id="uabb03f1d"><span class="ne-text">执行原生 SQL 查询</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u96cf0726"><code class="ne-code"><span class="ne-text">Exec(sql, args...)</span></code></p></td><td width="375"><p class="ne-p" id="u85c5b2ea"><span class="ne-text">执行原生 SQL 命令</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uce4ecb1e"><code class="ne-code"><span class="ne-text">Scan(&amp;dest)</span></code></p></td><td width="375"><p class="ne-p" id="ufbab9c3e"><span class="ne-text">将结果扫描到结构体</span></p></td></tr></tbody></table>

---

示例代码：

```text
// 查询
var user UserModel
Global.DB.Where("name = ?", "ws").First(&user)

// 更新
Global.DB.Model(&user).Update("age", 20)

// 删除
Global.DB.Delete(&user)

// 事务
err := Global.DB.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&UserModel{Name: "test"}).Error; err != nil {
        return err // 回滚
    }
    return nil // 提交
})
```

## 自动生成表\(表的迁移\)

Go复制代码

```text
package main

import (
  "fmt"
  "gorm.io/driver/mysql"
  "gorm.io/gorm"
  "time"
)

type UserModel struct {
  ID        int64     `gorm:"primaryKey"`      // 主键
  Name      string    `gorm:"not null;unique"` // 不能为空，且唯一
  CreatedAt time.Time // 在创建记录时自动设置为当前时间。
}

func main() {
  // 连接数据库
  db, err := gorm.Open(mysql.Open("root:root@tcp(127.0.0.1:3306)/gorm_new_db?charset=utf8mb4&parseTime=True&loc=Local"), &gorm.Config{})
  if err != nil {
    fmt.Println(err)
    return
  }
  
  err = db.AutoMigrate(&UserModel{})
  if err != nil {
    fmt.Println(err)
    return
  }
  fmt.Println("生成表结构成功！")
}
```

生成表结构只会新增字段，不会删除字段和更新字段\]

## 单表操作

包括增删改查

### 插入数据

Go复制代码

```text
// InsertData 插入数据
func InsertData() {
  user := UserModel{Name: "张三"}
  err := DB.Create(&user).Error   //调用内部的Error字段  
  // 创建成功之后，数据会回填
  fmt.Println(user, err)
}
```

批量插入

Go复制代码

```text
// InsertData 插入数据
func InsertData() {
  var users = []UserModel{
    {
      Name: "王五",
    },
    {
      Name: "李四",
    },
  }
  err := DB.Create(&users).Error
  fmt.Println(users, err)
}
```

特别注意：Create函数接收的参数是结构体的指针或者是切片

插入数据的钩子 \. 这里使用的钩子函数的函数名需要实现固定, 是底层内部的接口实现的说 ;

Go复制代码

```text
type UserModel struct {
  ID        int64     `gorm:"primaryKey"`      // 主键
  Name      string    `gorm:"not null;unique"` // 不能为空，且唯一
  CreatedAt time.Time // 在创建记录时自动设置为当前时间。
}

func (u *UserModel) BeforeCreate(tx *gorm.DB) error {
  fmt.Println("创建的钩子函数")
  u.Name = "枫枫"
  return nil
}
```

如果在插入的钩子函数中，返回错误，则数据不会被插入

### 查询数据

Go复制代码

```text
// 查全部
var users []UserModel
DB.Find(&users)
fmt.Println(users)

// 带条件查询
users = []UserModel{}
DB.Find(&users, "name = ?", "张三")
fmt.Println(users)

// 获取一条记录
var user UserModel
DB.Take(&user)
fmt.Println(user)

// 如果查不到则会报错
user = UserModel{}
err := DB.Take(&user, "id = ?", 100).Error   //使用Take  First实现使用主键去查数据  
if err == gorm.ErrRecordNotFound {
  fmt.Println("不存在的记录")
}

// 如果不想出现错误
user = UserModel{}
err = DB.Limit(1).Find(&user, "id = ?", 100).Error
fmt.Println(err)

// 打印实际的sql
DB.Debug().Take(&user, "id = ?", 1)
```

### 更新

有很多方法，Save、Update、UpdateColumn、Updates

不同的方法有不同的区别，如下：

1. Save，有主键记录就是更新，并且可以更新零值，否则就是创建
2. Update，可以更新零值，必须要有条件
3. UpdateColumn，可以更新零值，不会走更新的Hook
4. Updates，如果是结构体，则更新非零值，map可以更新零值

save

Go复制代码

```text
// 创建
var user = UserModel{
  Name: "枫枫1",
}
DB.Save(&user)
fmt.Println(user)

// 更新
user = UserModel{
  ID:        9,
  Name:      "枫枫2",
  CreatedAt: time.Now(),
}
DB.Save(&user)
fmt.Println(user)
```

更新钩子

Go复制代码

```text
func (u *UserModel) BeforeUpdate(tx *gorm.DB) (err error) {
  fmt.Println("更新的钩子函数")
  return nil
}
```

Update和UpdateColumn

唯一区别就是会走一个 skiphooks \-\-&gt; true ;

Go复制代码

```text
DB.Model(&UserModel{}).
  Where("id = ?", 1).
  Update("name", "张三")  // 走了更新钩子

DB.Model(&UserModel{}).
  Where("id = ?", 1).
  UpdateColumn("name", "张三")
```

Updates

**Go复制代码**

**user 对象只是数据载体，\.Models\(&amp;user\) 告诉GORM：**

**1\. 操作哪个表 \- 根据结构体名推断表名**

**2\. 更新哪条记录 \- 结合Where条件确定**

```text
var user = UserModel{ID: 1}

DB.Model(&user).Updates(UserModel{
  Name: "张三丰",
})

user = UserModel{ID: 2}
// 不会更新零值
DB.Model(&user).Updates(UserModel{
  Name: "",
})

user = UserModel{ID: 2}
// 会更新零值
DB.Model(&user).Updates(map[string]any{
  "name": "",
})
```

Expr

通常用于获取原字段的数据

例如年龄加一

Go复制代码

```text
DB.Model(&UserModel{}).
  Where("id = ?", 1).
  UpdateColumn("age", gorm.Expr("age + 1"))  //Expr获取原先的字段值 + 实现 ++操作
```

### 删除

Go复制代码

```text
var user = UserModel{ID: 10}
DB.Delete(&user)

DB.Delete(&UserModel{}, 9)

// 批量删除
DB.Delete(&UserModel{}, []int{1, 2, 3})
```

钩子函数

Go复制代码

```text
func (u *UserModel) BeforeDelete(tx *gorm.DB) (err error) {
    fmt.Println("删除钩子")
    return
}
```

### 软删除

软删除 vs 直接删除：

特性 直接删除 软删除

数据状态 真正删除 标记删除

数据恢复 无法恢复 可以恢复

存储空间 释放空间 不释放空间

查询性能 更快 稍慢

如果你的模型包含了 `gorm.DeletedAt`字段（该字段也被包含在`gorm.Model`中），那么该模型将会自动获得软删除的能力

当调用`Delete`时，GORM并不会从数据库中删除该记录，而是将该记录的`DeleteAt`设置为当前时间，而后的一般查询方法将无法查找到此条记录。

查找被删除的记录

TypeScript复制代码

```text
DB.Unscoped().Find(&users)
```

永久删除

TypeScript复制代码

```text
db.Unscoped().Delete(&user)  // 真正删除数据
```
