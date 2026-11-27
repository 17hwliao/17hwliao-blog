#### postgreSQL 中特有的操作 :

使用 GROM 实现给 SQL 加 `for update ;`

在 postgreSQL 中实现的 加锁 是事务级的锁 :  
在事务提交之后会自动实现释放锁 ;

实现的加锁是行级别的加锁 ;

```text
db.Clauses(clause.Locking{Strength:"UPDATE" ,}).First(&activity , id)
== select & from activities where id = ? for update 
```
