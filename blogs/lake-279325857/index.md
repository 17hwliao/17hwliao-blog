gorm: 内部实现的 命名策略 :

转化的规则实现是在内部实现gorm结构体映射的时候自动实现的

1 : 驼峰转蛇形 : UserProfile \-\-&gt; user\_profile

2 : 自动复数化 : User \-\-&gt; users , Article \-\-&gt; articles ;

dsn 字段设计 :

Host \(localhost\) , User\(postgres\) , Password\(\), Name\(liuxi\) , Port\(5432\) , SSLMode : disable

```text
db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, nil, fmt.Errorf("connect to database: %w", err)
	}
```

```text
sqlDB, err := db.DB()
- *gorm.DB 持有 *sql.DB，通过 DB() 方法暴露
- 后续操作连接池用 *sql.DB
连接池的配置
sqlDB.SetMaxIdleConns(5) //空闲最大连接数
sqlDB.SetMaxOpenConns(20) //最多并发连接,防止DB过载
sqlDB.SetConnMaxLifetime(time.Hour)  //最长实现1小时之后强制收回, 防止被DB踹下线
//设置超市测试连接, 失败时关闭连接池 , 在连接失败之后会启动失败 , 最多坚持5秒
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
if err := sqlDB.PingContext(ctx); err != nil {
    _ = sqlDB.Close()
    return nil, nil, fmt.Errorf("ping postgres: %w", err)
}
```
