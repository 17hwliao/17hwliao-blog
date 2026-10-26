## 持久化

Redis是一个内存数据库，数据保存在内存中，但是我们都知道内存的数据变化是很快的，也容易发生丢失

辛好Redis还为我们提供了持久化的机制，分别是RDB\(Redis DataBase\)和AOF\(Append Only File\)。

RDB，简而言之，就是在不同的时间点，将redis存储的数据生成快照并存储到磁盘等介质上；

[AOF](https://so.csdn.net/so/search?q=AOF&spm=1001.2101.3001.7020)，则是换了一个角度来实现持久化，那就是将redis执行过的所有写指令记录下来，在下次redis重新启动时，只要把这些写指令从前到后再重复执行一遍，就可以实现数据恢复了。

redis数据存磁盘的过程：

1. 客户端向服务端发送写操作\(数据在客户端的内存中\)。
2. 数据库服务端接收到写请求的数据\(数据在服务端的内存中\)。
3. 服务端调用write这个系统调用，将数据往磁盘上写\(数据在系统内存的缓冲区中\)。
4. 操作系统将缓冲区中的数据转移到磁盘控制器上\(数据在磁盘缓存中\)。
5. 磁盘控制器将数据写到磁盘的物理介质中\(数据真正落到磁盘上\)。

### RDB持久化

默认是开启的，默认的存储文件是 dump\.rdb

可以修改这个文件的名称

Go复制代码

```text
dbfilename dump.rdb
dir ./
```

触发rdb备份

1. 配置自动备份

默认是 一分钟内修改了一万次，5分钟内修改了10次，30分钟内修改了1次

Go复制代码

```text
save 3600 1
save 300 100
save 60 10000
```

1. 手动命令备份

`save`：save时只管保存，其他不管，全部阻塞，手动保存，不建议使用。

`bgsave`：redis会在后台异步进行快照操作，快照同时还可以响应客户端情况。

可以使用`lastsave`命令获取最后一次成功生成快照的时间（时间戳）

### AOF持久化

AOF默认是关闭的，需要手动开启的。开启方式：修改redis\.conf配置文件来开启AOF

如果是phpstudy的话，要改redis目录的conf文件，改软件里面的那个配置文件每次重启都没有了

这是我的目录，D:\\client\\phpstudy\\phpstudy\_pro\\Extensions\\redis3\.0\.504

重启之后，在这个目录下就有一个 appendonly\.aof文件

Go复制代码

```text
appendonly yes
appendfilename "appendonly.aof"
appendfsync always
dir ./
```

**appendfsync always：每次写入立即同步**

**appendfsync everysec：每秒同步**

**appendfsync no：不主动同步**
