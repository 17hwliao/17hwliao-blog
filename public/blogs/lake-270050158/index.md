# 分布式缓存

\-\- 基于Redis集群解决单机Redis存在的问题

单机的Redis存在四大问题：

\[原笔记图片附件缺失：assets/image\-20210725144240631\.png\] ![](</blogs/_assets/lakebook/2c26a38d984d121a398c95a2.png>)

# 0\.学习目标

# 1\.Redis持久化

Redis有两种持久化方案：

- RDB持久化
- AOF持久化

## 1\.1\.RDB持久化

RDB全称Redis Database Backup file（Redis数据备份文件），也被叫做Redis数据快照。简单来说就是把内存中的所有数据都记录到磁盘中。当Redis实例故障重启后，从磁盘读取快照文件，恢复数据。快照文件称为RDB文件，默认是保存在当前运行目录。

### 1\.1\.1\.执行时机

RDB持久化在四种情况下会执行：

- 执行save命令
- 执行bgsave命令
- Redis停机时
- 触发RDB条件时

**1）save命令**

执行下面的命令，可以立即执行一次RDB：![](</blogs/_assets/lakebook/1497c45f7f3d2c2c6ddfc2cc.png>)

save命令会导致主进程执行RDB，这个过程中其它所有命令都会被阻塞。只有在数据迁移时可能用到。

**2）bgsave命令**

下面的命令可以异步执行RDB：

![](</blogs/_assets/lakebook/52c4ee2a619c1ef212514d54.png>)

这个命令执行后会开启独立进程完成RDB，主进程可以持续处理用户请求，不受影响。

**3）停机时**

Redis停机时会执行一次save命令，实现RDB持久化。

**4）触发RDB条件**

Redis内部有触发RDB的机制，可以在redis\.conf文件中找到，格式如下：

```properties
# 900秒内，如果至少有1个key被修改，则执行bgsave ， 如果是save "" 则表示禁用RDB
save 900 1  
save 300 10  300 内实现 10个修改 就会执行该命令 ; 
save 60 10000  
```

RDB的其它配置也可以在redis\.conf文件中设置：

```properties
# 是否压缩 ,建议不开启，压缩也会消耗cpu，磁盘的话不值钱
rdbcompression yes

# RDB文件名称
dbfilename dump.rdb  

# 文件保存的路径目录
dir ./ 
```

设置 自动缓存 触发的事件 : 一般使用的就是 默认的时间值 ;

### 1\.1\.2\.RDB原理

实现一个异步持久化 , 异步 \-\-&gt; 主进程几乎没影响 ;

bgsave开始时会fork主进程得到子进程，

子进程共享主进程的内存数据。完成fork后读取内存数据并写入 RDB 文件。

但是 主进程现在还是可以不断获取请求实现修改数据, 子进程会与之产生冲突 \-\-&gt; 脏数据

fork采用的是copy\-on\-write技术：

- 当主进程执行读操作时，访问共享内存； 内部需要实现备份的数据会变为只读模式
- 当主进程执行写操作时，则会拷贝一份数据 ，执行写操作。

缺点 : 面对极端情况下 , 全部实现拷贝请求的话 \=\=&gt; 双倍的内存占用 , 需要预留 存储大小 ;

\[原笔记图片附件缺失：assets/image\-20210725151319695\.png\] ![](</blogs/_assets/lakebook/f08f2eeb76ae08ee48c0ce09.png>)

### 1\.1\.3\.小结

RDB方式bgsave的基本流程？

- fork主进程 \-\- &gt; 子进程，共享内存空间
- 子进程读取内存数据并写入新的RDB文件
- 用新RDB文件替换旧的RDB文件

RDB会在什么时候执行？save 60 1000代表什么含义？

- 默认是服务停止时 \-\-&gt; save 阻塞式 的
- 代表60秒内至少执行1000次修改则触发RDB \-\-&gt; bgsave 实现异步的 备份

使用 rdb 可以实现跨设备 实现自动 恢复redis原始数据

RDB的缺点？

- RDB执行间隔时间长，两次RDB之间写入数据有丢失的风险
- fork子进程、压缩、写出RDB文件都比较耗时

## 1\.2\.AOF持久化

### 1\.2\.1\.AOF原理

AOF全称为Append Only File（追加文件）。Redis处理的每一个写命令都会记录在AOF文件，可以看做是命令日志文件。

\[原笔记图片附件缺失：assets/image\-20210725151543640\.png\] ![](</blogs/_assets/lakebook/1ed7c28f0e29020915e602fd.png>)

### 1\.2\.2\.AOF配置

AOF默认是关闭的，需要修改redis\.conf配置文件来开启AOF：

```properties
# 是否开启AOF功能，默认是no
appendonly yes
# AOF文件的名称
appendfilename "appendonly.aof"
```

AOF的命令记录的频率也可以通过redis\.conf文件来配：

```properties
# 表示每执行一次写命令，立即记录到AOF文件
appendfsync always    --> 效果最差, 主线程会多运行时间
# 写命令执行完先放入AOF缓冲区，然后表示每隔1秒将缓冲区数据写到AOF文件，是默认方案
appendfsync everysec 
# 写命令执行完先放入AOF缓冲区，由操作系统决定何时将缓冲区内容写回磁盘
appendfsync no
```

三种策略对比：

\[原笔记图片附件缺失：assets/image\-20210725151654046\.png\]

![](</blogs/_assets/lakebook/237c9803931146653b83cbbc.png>)

### 1\.2\.3\.AOF文件重写

因为是记录命令，AOF文件会比RDB文件大的多。

而且AOF会记录对同一个key的多次写操作，但只有最后一次写操作才有意义。

通过执行bgrewriteaof命令，可以让AOF文件执行重写功能，用最少的命令达到相同效果。

\[原笔记图片附件缺失：assets/image\-20210725151729118\.png\] ![](</blogs/_assets/lakebook/ddf2a044ae735c89275636e5.png>)

如图，AOF原本有三个命令，但是`set num 123 和 set num 666`都是对num的操作，第二次会覆盖第一次的值，因此第一个命令记录下来没有意义。

所以重写命令后，AOF文件内容就是：`mset name jack num 666`

Redis也会在触发阈值时自动去重写AOF文件。阈值也可以在redis\.conf中配置：

```properties
# AOF文件比上次文件 增长超过多少百分比则触发重写
auto-aof-rewrite-percentage 100
# AOF文件体积最小多大以上才触发重写 
auto-aof-rewrite-min-size 64mb 
```

## 1\.3\.RDB与AOF对比

RDB和AOF各有自己的优缺点，如果对数据安全性要求较高，

在实际开发中往往会**结合**两者来使用。

\[原笔记图片附件缺失：assets/image\-20210725151940515\.png\] ![](</blogs/_assets/lakebook/f81365cecc44811faa648dc9.png>)

# 2\.Redis主从

## 2\.1\.搭建主从架构

单节点Redis的并发能力是有上限的，要进一步提高Redis的并发能力，就需要搭建主从集群，实现读写分离。

\[原笔记图片附件缺失：assets/image\-20210725152037611\.png\] ![](</blogs/_assets/lakebook/4082e46f245b1a98e0fe5ab7.png>)

具体搭建流程参考课前资料《Redis集群\.md》：

\[原笔记图片附件缺失：assets/image\-20210725152052501\.png\]  ![](</blogs/_assets/lakebook/a1694b23b879d4f02eb48706.png>)

获取集群设备 :

![](</blogs/_assets/lakebook/4dde2b81a31160772550aae4.png>)

![](</blogs/_assets/lakebook/2f08e4892be26b17429399e9.png>)

![](</blogs/_assets/lakebook/ac25ccc5955459851e2fec12.png>)

![](</blogs/_assets/lakebook/e5bdeef1a7afb5a4a24abf98.png>)

![](</blogs/_assets/lakebook/c0db5e3d1b4d0cd531c9dc98.png>)

总结 : 谁是子节点 , 就在谁上执行 是哟个 slaveof 的命令 绑定的是 主 的节点和 ip ;

## 2\.2\.主从数据同步原理

### 2\.2\.1\.全量同步

主从第一次建立连接时，会执行**全量同步**，将master节点的所有数据都拷贝给slave节点，流程：

\[原笔记图片附件缺失：assets/image\-20210725152222497\.png\] ![](</blogs/_assets/lakebook/40fb1a99884df631fc251588.png>)

这里有一个问题，master如何得知salve是第一次来连接呢？？

有几个概念，可以作为判断依据：

- **Replication Id**：简称replid，是数据集的标记，id一致则说明是同一数据集。每一个master都有唯一的replid，slave则会继承master节点的replid
- **offset**：偏移量，随着记录在repl\_baklog中的数据增多而逐渐增大。slave完成同步时也会记录当前同步的offset。如果slave的offset小于master的offset，说明slave数据落后于master，需要更新。

因此slave做数据同步，必须向master声明自己的replication id 和offset，master才可以判断到底需要同步哪些数据。

因为slave原本也是一个master，有自己的replid和offset，当第一次变成slave，与master建立连接时，发送的replid和offset是自己的replid和offset。

master判断发现slave发送来的replid与自己的不一致，说明这是一个全新的slave，就知道要做全量同步了。

master会将自己的replid和offset都发送给这个slave，slave保存这些信息。以后slave的replid就与master一致了。

因此，**master判断一个节点是否是第一次同步的依据，就是看replid是否一致** , **因为会出现 主的情况不同步的是哦胡 offset 的 实际数据 会有偏差甚至大于 当前主的 offset**

如图：

\[原笔记图片附件缺失：assets/image\-20210725152700914\.png\] ![](</blogs/_assets/lakebook/72c1dfb51e5a8bd16073837d.png>)

完整流程描述：

- slave节点请求增量同步
- master节点判断replid，发现不一致，拒绝增量同步
- master将完整内存数据生成RDB，发送RDB到slave
- slave清空本地数据，加载master的RDB
- master将RDB期间的命令记录在repl\_baklog，并持续将log中的命令发送给slave
- slave执行接收到的命令，保持与master之间的同步

### 2\.2\.2\.增量同步

全量同步需要先做RDB，然后将RDB文件通过网络传输个slave，成本太高了。因此除了第一次做全量同步，其它大多数时候slave与master都是做**增量同步**。

什么是增量同步？就是只更新slave与master存在差异的部分数据。如图：

\[原笔记图片附件缺失：assets/image\-20210725153201086\.png\] ![](</blogs/_assets/lakebook/cd88e2773442185f5db6d6ec.png>)

那么master怎么知道slave与自己的数据差异在哪里呢?

repl\_baklog 本质是数组 , 大小固定 , 使用内部的 offset 中的内容实现增量同步

### 2\.2\.3\.repl\_backlog原理

master怎么知道slave与自己的数据差异在哪里呢?

这就要说到全量同步时的repl\_baklog文件了。

这个文件是一个固定大小的数组，只不过数组是环形，也就是说**角标到达数组末尾后，会再次从0开始读写**，这样数组头部的数据就会被覆盖。

repl\_baklog中会记录Redis处理过的命令日志及offset，包括master当前的offset，和slave已经拷贝到的offset：

\[原笔记图片附件缺失：assets/image\-20210725153359022\.png\]  ![](</blogs/_assets/lakebook/3202898a3f9a0535b6d2408f.png>)

slave与master的offset之间的差异，就是salve需要增量拷贝的数据了。

随着不断有数据写入，master的offset逐渐变大，slave也不断的拷贝，追赶master的offset：

\[原笔记图片附件缺失：assets/image\-20210725153524190\.png\]

![](</blogs/_assets/lakebook/21c18ed26804c56ee054f037.png>)

直到数组被填满：

\[原笔记图片附件缺失：assets/image\-20210725153715910\.png\]  ![](</blogs/_assets/lakebook/db23cc91e8d5272c3a2755bf.png>)

此时，如果有新的数据写入，就会覆盖数组中的旧数据。不过，旧的数据只要是绿色的，说明是已经被同步到slave的数据，即便被覆盖了也没什么影响。因为未同步的仅仅是红色部分。

但是，如果slave出现网络阻塞，导致master的offset远远超过了slave的offset：

\[原笔记图片附件缺失：assets/image\-20210725153937031\.png\]  ![](</blogs/_assets/lakebook/e05693da1361b019457cb17e.png>)

如果master继续写入新数据，其offset就会覆盖旧的数据，直到将slave现在的offset也覆盖：![](</blogs/_assets/lakebook/6ea94ea42b59d90f4403e280.png>)

\[原笔记图片附件缺失：assets/image\-20210725154155984\.png\]

棕色框中的红色部分，就是尚未同步，但是却已经被覆盖的数据。此时如果slave恢复，需要同步，却发现自己的offset都没有了，无法完成增量同步了。只能做全量同步。

\[原笔记图片附件缺失：assets/image\-20210725154216392\.png\] ![](</blogs/_assets/lakebook/10f01796cf2242d423883b12.png>)

## 2\.3\.主从同步优化

主从同步可以保证主从数据的一致性，非常重要。

可以从以下几个方面来优化Redis主从就集群：

- 在master中配置repl\-diskless\-sync yes启用无磁盘复制，避免全量同步时的磁盘IO。
- Redis单节点上的内存占用不要太大，减少RDB导致的过多磁盘IO
- 适当提高repl\_baklog的大小，发现slave宕机时尽快实现故障恢复，尽可能避免全量同步
- 限制一个master上的slave节点数量，如果实在是太多slave，则可以采用主\-从\-从链式结构，减少master压力

主从从架构图：

\[原笔记图片附件缺失：assets/image\-20210725154405899\.png\] ![](</blogs/_assets/lakebook/33d17f937fe36468526a80fa.png>)

## 2\.4\.小结

简述全量同步和增量同步区别？

- 全量同步：master将完整内存数据生成RDB，发送RDB到slave。后续命令则记录在repl\_baklog，逐个发送给slave。
- 增量同步：slave提交自己的offset到master，master获取\( 使用offset 判断未同步的内容去返回 \) repl\_baklog中从offset之后的命令给slave

什么时候执行全量同步？

- slave节点第一次连接master节点时
- slave节点断开时间太久，repl\_baklog中的offset已经被覆盖时

什么时候执行增量同步？

- slave节点断开又恢复，并且在repl\_baklog中能找到offset时

# 3\.Redis哨兵 Sentinel

Redis提供了哨兵（Sentinel）机制来实现主从集群的自动故障恢复 \-\- &gt; 从节点 可以使用主节点实现 数据同步 , 主要针对于 主节点 宕机的故障 ;

## 3\.1\.哨兵原理

### 3\.1\.1\.集群结构和作用

哨兵的结构如图：

\[原笔记图片附件缺失：assets/image\-20210725154528072\.png\] ![](</blogs/_assets/lakebook/1d3d4a433dd58a68c445c788.png>)

哨兵的作用如下： 还是个民主投票机制

- **监控**：Sentinel 会不断检查您的master和slave是否按预期工作
- **自动故障恢复**：如果master故障，Sentinel会将一个slave提升为master。当故障实例恢复后也以新的master为主
- **通知**：Sentinel充当Redis客户端的服务发现来源，当集群发生故障转移时，会将最新信息推送给Redis的客户端

### 3\.1\.2\.集群监控原理

Sentinel基于心跳机制监测服务状态，每隔1秒向集群的每个实例发送ping命令：

•主观下线：如果某sentinel节点发现某实例未在规定时间响应，则认为该实例**主观下线**。

民主 :

•**客观下线：若超过指定数量（quorum）的sentinel都认为该实例主观下线，则该实例客观下线。quorum值最好超过Sentinel实例数量的一半。**

\[原笔记图片附件缺失：assets/image\-20210725154632354\.png\] ![](</blogs/_assets/lakebook/14547cc7c8d498b64fe5479d.png>)

### 3\.1\.3\.集群故障恢复原理

一旦发现master故障，sentinel需要在salve中选择一个作为新的master，选择依据是这样的：

- 首先会判断slave节点与master节点断开时间长短，如果超过指定值（down\-after\-milliseconds \* 10）则会排除该slave节点
- 然后判断slave节点的slave\-priority\( 优先级 \) 值，越小优先级越高，如果是0则永不参与选举
- 如果slave\-prority一样，则判断slave节点的offset值，越大说明数据越新，优先级越高
- 最后是判断slave节点的运行id大小，越小优先级越高。

实现集群缓存主从架构中选出 master的 优先级 ; down\-after\-milliseconds &lt; slave\-priority &lt; id

当选出一个新的master后，该如何实现切换呢？

流程如下：

- sentinel给备选的slave1节点发送slaveof no one \( 永不为奴\!\!\!\! \) 命令，让该节点成为master ,
- sentinel给所有其它slave发送slaveof 192\.168\.150\.101 7002 命令，让这些slave成为新master的从节点，开始从新的master上同步数据。
- 最后，sentinel将故障节点标记为slave，当故障节点恢复后会自动成为新的master的slave节点

![](</blogs/_assets/lakebook/4df3c7a361877e5e271d9a50.png>)

### 3\.1\.4\.小结

Sentinel的三个作用是什么？

- 监控
- 故障转移 \-\-&gt; 永不为奴 \!\!\!\!
- 通知 \-\-&gt; 修改其他 丛节点的 配置文件

Sentinel如何判断一个redis实例是否健康？

- 每隔1秒发送一次ping命令，如果超过一定时间没有相向则认为是主观下线
- 如果大多数sentinel都认为实例主观下线，则判定服务下线

故障转移步骤有哪些？

- 首先选定一个slave作为新的master，执行slaveof no one
- 然后让所有节点都执行slaveof 新master
- 修改故障节点配置，添加slaveof 新master

## 3\.2\.搭建哨兵集群

具体搭建流程参考课前资料《Redis集群\.md》：

![](</blogs/_assets/lakebook/fb7f277f259efca35e7628a9.png>)\\

![](</blogs/_assets/lakebook/272ac2d28a504e82e9ec9fb6.png>)

主动宕机 主节点 , \=\=\=&gt; \{

每个独立主观判断主节点是否宕机 ;

判断 宕机 超半数 \-\-\-&gt; 废主节点 ;

通过判断 宕机的 先后顺序 实现找出 哨兵中的主 哨兵;

选举出的 主哨兵 主要实现 切换主的 操作 ;

主哨兵实现 切换主 \-\- &gt; 通知 ;

\}

没错 一切都交给 sentinel 就行 ;

# 4\.Redis分片集群 \-\-&gt; 多个主从集群

创建多个 主从集群 解决高并发下 写的问题 ;

## 4\.1\.搭建分片集群

主从和哨兵可以解决高可用、高并发读的问题。但是依然有两个问题没有解决：

- 海量数据存储问题
- 高并发写的问题

使用分片集群可以解决上述问题，如图:

\[原笔记图片附件缺失：assets/image\-20210725155747294\.png\] ![](</blogs/_assets/lakebook/12ea6377b14035307ef79876.png>)

分片集群特征：

- 集群中有多个master，每个master保存不同数据
- 每个master都可以有多个slave节点
- master之间通过ping监测彼此健康状态
- 客户端请求可以访问集群任意节点，最终都会被转发到正确节点

具体搭建流程参考课前资料《Redis集群\.md》：

内部实现 了redis 中的 cluster\-enabled 功能 : 设置为 yes 后可以实现 redis 的集群功能 ;

\[原笔记图片附件缺失：assets/image\-20210725155806288\.png\]  ![](</blogs/_assets/lakebook/dcbaeb7b6f069bccd2899e83.png>)

将配置文件直接拷贝到 目录中 , 直接 启动

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1778937151820-fcf2f17f-f5d5-490e-8a3c-70a78ab3d562.png>)

![](</blogs/_assets/lakebook/fae87adeb20e3612464465f7.png>)

## 4\.2\.散列插槽

### 4\.2\.1\.插槽原理

Redis会把每一个master节点映射到0\~16383共16384个插槽（hash slot）上，查看集群信息时就能看到：

会实现自动分配 :

\[原笔记图片附件缺失：assets/image\-20210725155820320\.png\] ![](</blogs/_assets/lakebook/328e750f9d8912618632c19c.png>)

数据key不是与节点绑定，而是与插槽绑定。redis会根据key的有效部分计算插槽值，分两种情况：

- **计算规则**：当你存入一个 key 时，Redis 会计算 `CRC16(key) % 16384`，结果（0\-16383）就是这个 key 的槽位。
- **分配规则**：集群启动时，这 16384 个槽会被均匀地分配给所有主节点。比如 3 个节点的集群，可能会是 NodeA 负责 0\-5000，NodeB 负责 5001\-10000，NodeC 负责 10001\-16383。

通过这种方式，每个 key 从出生就注定了该去哪个“房间”（槽位），再由“房间管理员”（节点）负责。

- key中包含"\{\}"，且“\{\}”中至少包含1个字符，“\{\}”中的部分是有效部分
- key中不包含“\{\}”，整个key都是有效部分

例如：key是num，那么就根据num计算，如果是\{itcast\}num，则根据itcast计算。计算方式是利用CRC16算法得到一个hash值，然后对16384取余，得到的结果就是slot值。

\[原笔记图片附件缺失：assets/image\-20210725155850200\.png\]  ![](</blogs/_assets/lakebook/ac3f39865f406274c389982f.png>)

如图，在7001这个节点执行set a 1时，对a做hash运算，对16384取余，得到的结果是15495，因此要存储到103节点。

到了7003后，执行`get num`时，对num做hash运算，对16384取余，得到的结果是2765，因此需要切换到7001节点

### 4\.2\.1\.小结

Redis如何判断某个key应该在哪个实例？

- 将16384个插槽分配到不同的实例
- 根据key的有效部分计算哈希值，对 16384取余
- 余数作为插槽，寻找插槽所在实例即可

如何将同一类数据固定的保存在同一个Redis实例？

- 这一类数据使用相同的有效部分，例如key都以\{typeId\}为前缀

<table class="ne-table" id="ZrLYi"><tbody><tr><td width="375"><p class="ne-p" id="u2180d56a"><strong><span class="ne-text">为什么有效？</span></strong></p></td><td width="375"><p class="ne-p" id="uaff13350"><span class="ne-text">Redis Cluster 的 hash tag 机制，只对</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">{}</span></code></p><p class="ne-p" id="ucd35ebe7"><span class="ne-text"> </span><span class="ne-text">内的内容计算槽位</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u4a2f201f"><strong><span class="ne-text">如何保证同一类数据在同一实例？</span></strong></p></td><td width="375"><p class="ne-p" id="u96e31d31"><span class="ne-text">设计 key 时统一使用相同的 hash tag，如</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">{typeId}:detail</span></code></p></td></tr><tr><td width="375"><p class="ne-p" id="u2f55d65f"><strong><span class="ne-text">有什么代价？</span></strong></p></td><td width="375"><p class="ne-p" id="u60befe7b"><span class="ne-text">可能导致数据分布不均匀，需要合理设计 tag 粒度</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u4ac9aaa9"><strong><span class="ne-text">最佳实践？</span></strong></p></td><td width="375"><p class="ne-p" id="u42554060"><span class="ne-text">使用二级 hash tag 或按 ID 取模，既保证聚集又兼顾均衡</span></p></td></tr></tbody></table>

核心原理就一句话：**Redis Cluster 计算槽位时，只看 key 中第一个** `{}` **里的内容**。利用这个特性，你可以精确控制哪些 key 落在同一个槽 → 同一个节点。

## 4\.3\.集群伸缩 \-\-&gt; 添加移除节点

redis\-cli \-\-cluster提供了很多操作集群的命令，可以通过下面方式查看：

\[原笔记图片附件缺失：assets/image\-20210725160138290\.png\] ![](</blogs/_assets/lakebook/ce61eb702ccdc8d7e2a16391.png>)

比如，添加节点的命令：

\[原笔记图片附件缺失：assets/image\-20210725160448139\.png\] ![](</blogs/_assets/lakebook/29c5d3f915230c6207e418a2.png>)

### 4\.3\.1\.需求分析

需求：向集群中添加一个新的master节点，并向其中存储 num \= 10

- 启动一个新的redis实例，端口为7004
- 添加7004到之前的集群，并作为一个master节点
- 给7004节点分配插槽，使得num这个key可以存储到7004实例

这里需要两个新的功能：

- 添加一个节点到集群中
- 将部分插槽分配到新插槽

### 4\.3\.2\.创建新的redis实例

创建一个文件夹：

```shell
mkdir 7004
```

拷贝配置文件：

```shell
cp redis.conf /7004
```

修改配置文件：

```shell
sed /s/6379/7004/g 7004/redis.conf
```

启动

```shell
redis-server 7004/redis.conf
```

### 4\.3\.3\.添加新节点到redis

添加节点的语法如下：

\[原笔记图片附件缺失：assets/image\-20210725160448139\.png\] ![](</blogs/_assets/lakebook/d8ae5e377b760648cbf80166.png>)

执行命令：

```shell
redis-cli --cluster add-node  192.168.150.101:7004 192.168.150.101:7001
```

通过命令查看集群状态：

```shell
redis-cli -p 7001 cluster nodes
```

如图，7004加入了集群，并且默认是一个master节点：

\[原笔记图片附件缺失：assets/image\-20210725161007099\.png\] ![](</blogs/_assets/lakebook/29ad4be793e09c8cffbaa169.png>)

但是，可以看到7004节点的插槽数量为0，因此没有任何数据可以存储到7004上

### 4\.3\.4\.转移插槽 \-\-&gt; 实现 的 是物理移动节点中的插槽, 内部的数据会全部迁移\(拷贝删除\)

我们要将num存储到7004节点，因此需要先看看num的插槽是多少：

\[原笔记图片附件缺失：assets/image\-20210725161241793\.png\] ![](</blogs/_assets/lakebook/067984735b4e0e4f2365bdcf.png>)

如上图所示，num的插槽为2765\.

我们可以将0\~3000的插槽从7001转移到7004，命令格式如下：

\[原笔记图片附件缺失：assets/image\-20210725161401925\.png\] ![](</blogs/_assets/lakebook/e3460da97ad0e92b0db05ae1.png>)

具体命令如下：

建立连接：

redis\-cli \-\-cluster reshard ip : 端口号

\[原笔记图片附件缺失：assets/image\-20210725161506241\.png\] ![](</blogs/_assets/lakebook/37dc506750ef6b6360ff4c41.png>)

得到下面的反馈：

核心交互步骤与参数如下：

<table class="ne-table" id="tmNky"><tbody><tr><td width="250"><p class="ne-p" id="u85c2e58c"><span class="ne-text">交互提示/参数</span></p></td><td width="250"><p class="ne-p" id="u952c3cff"><span class="ne-text">含义</span></p></td><td width="250"><p class="ne-p" id="uf7a842fe"><span class="ne-text">说明</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u8c84f35d"><code class="ne-code"><strong><span class="ne-text">How many slots do you want to move?</span></strong></code></p></td><td width="250"><p class="ne-p" id="u5d3ecb2b"><span class="ne-text">你想移动多少个槽位？</span></p></td><td width="250"><p class="ne-p" id="u24401988"><span class="ne-text">你需要输入一个</span><strong><span class="ne-text">数字</span></strong><span class="ne-text">（例如</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">1000</span></code></p><p class="ne-p" id="u02bc7b6c"><span class="ne-text">），而不是“全部”。</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u0a5e54a8"><code class="ne-code"><strong><span class="ne-text">What is the receiving node ID?</span></strong></code></p></td><td width="250"><p class="ne-p" id="u72ef56ba"><span class="ne-text">接收节点的 ID 是什么？</span></p></td><td width="250"><p class="ne-p" id="u18840b2d"><span class="ne-text">填入</span><strong><span class="ne-text">目标节点</span></strong><span class="ne-text">的 ID。所有迁移的槽位最终都会属于这个节点。</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ua0d88275"><code class="ne-code"><strong><span class="ne-text">Please enter all the source node IDs.</span></strong></code></p></td><td width="250"><p class="ne-p" id="uf49831aa"><span class="ne-text">请输入所有源节点的 ID。</span></p></td><td width="250"><p class="ne-p" id="u01f56aa5"><span class="ne-text">填入</span><strong><span class="ne-text">源节点</span></strong><span class="ne-text">的 ID。你可以输入单个 ID，多个 ID（用逗号分隔），或者输入</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">all</span></code></p><p class="ne-p" id="u221bbbcd"><span class="ne-text"> </span><span class="ne-text">让所有其他主节点都作为源节点。</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u60a46e37"><code class="ne-code"><strong><span class="ne-text">Do you want to proceed with the proposed reshard plan?</span></strong></code></p></td><td width="250"><p class="ne-p" id="u0d87bb4c"><span class="ne-text">是否按计划执行？</span></p></td><td width="250"><p class="ne-p" id="u9b105a3d"><span class="ne-text">确认后，迁移正式开始。</span></p></td></tr></tbody></table>

\[原笔记图片附件缺失：assets/image\-20210725161540841\.png\] ![](</blogs/_assets/lakebook/90bb42faa7d5640f1e7264da.png>)

询问要移动多少个插槽，我们计划是3000个：

新的问题来了：

\[原笔记图片附件缺失：assets/image\-20210725161637152\.png\] ![](</blogs/_assets/lakebook/d034d52a23171eaf90ae5ef3.png>)

那个node来接收这些插槽？？

显然是7004，那么7004节点的id是多少呢？

\[原笔记图片附件缺失：assets/image\-20210725161731738\.png\] ![](</blogs/_assets/lakebook/0caeac25bc02ef8d6a954753.png>)

复制这个id，然后拷贝到刚才的控制台后：

\[原笔记图片附件缺失：assets/image\-20210725161817642\.png\] ![](</blogs/_assets/lakebook/cf0f244af5484ca43b551104.png>)

这里询问，你的插槽是从哪里移动过来的？

- all：代表全部，也就是三个节点各转移一部分
- 具体的id：目标节点的id
- done：没有了

这里我们要从7001获取，因此填写7001的id：

\[原笔记图片附件缺失：assets/image\-20210725162030478\.png\] ![](</blogs/_assets/lakebook/cc235214b2b26833aa11877f.png>)

填完后，点击done，这样插槽转移就准备好了：

\[原笔记图片附件缺失：assets/image\-20210725162101228\.png\] ![](</blogs/_assets/lakebook/2013fbec47c70b55cd565cce.png>)

确认要转移吗？输入yes：

然后，通过命令查看结果：

\[原笔记图片附件缺失：assets/image\-20210725162145497\.png\]  ![](</blogs/_assets/lakebook/7d79dd301bbb82aa796b1ac7.png>)

可以看到：

\[原笔记图片附件缺失：assets/image\-20210725162224058\.png\] ![](</blogs/_assets/lakebook/491d19c5e52c1942681f0015.png>)

目的达成。

## 4\.4\.故障转移

集群初识状态是这样的：

\[原笔记图片附件缺失：assets/image\-20210727161152065\.png\] ![](</blogs/_assets/lakebook/c47b463073a678c730b0a862.png>)

其中7001、7002、7003都是master，我们计划让7002宕机。

### 4\.4\.1\.自动故障转移 \-\-&gt; 防止主节点挂了之后 , 会出现信息丢失

当集群中有一个master宕机会发生什么呢？

直接停止一个redis实例，例如7002： \-\-&gt; 主节点宕机 \-\-&lt; 从节点 自动 上升

```shell
redis-cli -p 7002 shutdown
```

1）首先是该实例与其它实例失去连接

2）然后是疑似宕机：

\[原笔记图片附件缺失：assets/image\-20210725162319490\.png\] ![](</blogs/_assets/lakebook/95d146479d106ab0b6374cb0.png>)

3）最后是确定下线，自动提升一个slave为新的master：

\[原笔记图片附件缺失：assets/image\-20210725162408979\.png\] ![](</blogs/_assets/lakebook/70841c2f6a71c221a4f361ff.png>)

4）当7002再次启动，就会变为一个slave节点了：

\[原笔记图片附件缺失：assets/image\-20210727160803386\.png\]

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1778987513738-1241e5ff-c7af-47e7-bb81-44c5824daa05.png>)

### 4\.4\.2\.手动故障转移 \-\-&gt; 目的性让高性能设备作为主节点

利用cluster failover命令可以手动让集群中的某个master宕机，切换到执行cluster failover命令的这个slave节点，实现无感知的数据迁移。其流程如下：

\[原笔记图片附件缺失：assets/image\-20210725162441407\.png\] ![](</blogs/_assets/lakebook/b1a904f5803953df60391942.png>)

这种failover命令可以指定三种模式：

- 缺省：默认的流程，如图1\~6歩
- force：省略了对offset的一致性校验
- takeover：直接执行第5歩，忽略数据一致性、忽略master状态和其它master的意见

**案例需求**：在7002这个slave节点执行手动故障转移，重新夺回master地位

步骤如下：

1）利用redis\-cli连接7002这个节点

2）执行cluster failover命令

如图：

\[原笔记图片附件缺失：assets/image\-20210727160037766\.png\] ![](</blogs/_assets/lakebook/f202c8a542322d89a0b226cb.png>)

效果：

\[原笔记图片附件缺失：assets/image\-20210727161152065\.png\]

![](</blogs/_assets/lakebook/e6d3aece1b0812986a74da97.png>)

## 4\.5\.RedisTemplate访问分片集群

RedisTemplate底层同样基于lettuce实现了分片集群的支持，而使用的步骤与哨兵模式基本一致：

1）引入redis的starter依赖

2）配置分片集群地址

3）配置读写分离

与哨兵模式相比，其中只有分片集群的配置方式略有差异，如下：

```yaml
spring:
  redis:
    cluster:
      nodes:
        - 192.168.150.101:7001
        - 192.168.150.101:7002
        - 192.168.150.101:7003
        - 192.168.150.101:8001
        - 192.168.150.101:8002
        - 192.168.150.101:8003
```
