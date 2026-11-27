本门课程没有在一开始就讲一大堆gorm的配置

那是因为尽可能实现约定大于配置

如果按照gorm的约定来是编写代码，那么就可以省去很多配置项

## 使用ID为主键

默认情况下，名为 `ID` 的字段会作为表的主键

也可以通过标签 `primaryKey` 将其它字段设为主键

## 复数表名

GORM 使用结构体名的 `蛇形命名` 作为表名。对于结构体 `User`，根据约定，其表名为 `users`

如果不想用复数表名，可以在配置中修改

Go复制代码

```text
db, err := gorm.Open(sqlite.Open("gorm.db"), &gorm.Config{
  NamingStrategy: schema.NamingStrategy{
    TablePrefix: "t_",   // 表名前缀
    SingularTable: true, // 使用单数表名
    NoLowerCase: true, // 关闭蛇形命名
    NameReplacer: strings.NewReplacer("CID", "Cid"), // use name replacer to change struct/field name before convert it to db name
  },
})
```

也可以使用TableName函数进行自定义表名

Go复制代码

```text
func (User) TableName() string {
  return "profiles"
}
```

## 蛇形列名

使用`gorm:"column:name"`进行自定义列名

## 特殊的时间字段\(无法修改\)

CreatedAt

对于有 `CreatedAt` 字段的模型，创建记录时，如果该字段值为零值，则将该字段的值设为当前时间

UpdatedAt

对于有 `UpdatedAt` 字段的模型，更新记录时，将该字段的值设为当前时间。创建记录时，如果该字段值为零值，则将该字段的值设为当前时间

DeletedAt

软删除
