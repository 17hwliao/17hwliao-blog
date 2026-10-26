## 初识Redis

基于我本地使用 redis :

使用 compose : 容器化管理 redis ;

使用图形化界面 管理 redis :

可以直接使用 Hexhub 实现图形化管理 :

超级方便 ;

使用

docker exec \-it redis bash

作用：在已经运行的 Redis 容器内部启动一个 交互式的 bash 终端。

进入的是：容器的操作系统环境（类似于一个轻量级的 Linux 系统）。

你能做什么：执行 Linux 命令，例如 ls 查看文件列表、ps aux 查看进程、cat 查看文件、apk 安装软件（Alpine 系统）、以及运行 redis\-cli 等程序。

提示符示例：/data \# 或 root@容器ID:/data\#

可以理解为：你通过 SSH 登录到了这台“迷你虚拟机”（容器）里。

redis\-cli \[\-h \-p \-a\] \[\]

\-h / \-p / \-a : 访问的redis 的节点 / 访问连接端口默认为 6379 / 指定redis 的访问密码 ;

使用 auth 指定使用密码登陆 ;

也可以使用 auth 指定用户名 密码实现登陆 ;

作用：Redis 的命令行客户端，用于向 Redis 服务器发送命令。

进入的是：Redis 命令交互界面（一个专门与 Redis 通信的 REPL 环境）。

你能做什么：执行 Redis 命令，例如 SET, GET, PING, INFO, CONFIG 等。

提示符示例：127\.0\.0\.1:6379&gt;

可以理解为：你打开了一个专门操作 Redis 的“控制台”。

Redis是一种键值型的NoSQL数据库，这里有两个关键字

- 键值型
- NoSQL

其中`键值型`是指Redis中存储的数据都是以Key\-Value键值对的形式存储

**key可以为 id 而Value的形式多种多样，可以使字符串、数值甚至Json**

而NoSQL则是相对于传统关系型数据库而言，有很大差异的一种数据库\.

### 认识NoSQL

`NoSql`可以翻译做Not Only Sql（不仅仅是SQL），或者是No Sql（非Sql的）数据库。

是相对于传统关系型数据库而言，有很大差异的一种特殊的数据库，因此也称之为`非关系型数据库`。

#### 结构化与非结构化

传统关系型数据库是结构化数据，每张表在创建的时候都有严格的约束信息，如字段名、字段数据类型、字段约束等，插入的数据必须遵循这些约束

而NoSQL则对数据库格式没有约束，可以是键值型，也可以是文档型，甚至是图格式

#### 关联与非关联

传统数据库的表与表之间往往存在关联，例如外键约束  
而非关系型数据库不存在关联关系，要维护关系要么靠代码中的业务逻辑，要么靠数据之间的耦合

<table class="ne-table" id="QjKkz"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="htEtz"><code>{&#10;  id: 1,&#10;  name: "张三",&#10;  orders: [&#10;    {&#10;       id: 1,&#10;       item: {&#10;	 id: 10, title: "荣耀6", price: 4999&#10;       }&#10;    },&#10;    {&#10;       id: 2,&#10;       item: {&#10;	 id: 20, title: "小米11", price: 3999&#10;       }&#10;    }&#10;  ]&#10;}</code></pre></td></tr></tbody></table>

#### 查询方式

传统关系型数据库会基于Sql语句做查询，语法有统一的标准

<table class="ne-table" id="FwcwT"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="cmoi0"><code>SELECT id, age FROM tb_user WHERE id = 1</code></pre></td></tr></tbody></table>

而不同的非关系型数据库查询语法差异极大

<table class="ne-table" id="jAgRv"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="jvuxe"><code>Redis:  get user:1&#10;MongoDB: db.user.find({_id: 1})&#10;elasticsearch:  GET http://localhost:9200/users/1</code></pre></td></tr></tbody></table>

#### 事务

传统关系型数据库能满足事务的ACID原则\(原子性、一致性、独立性及持久性\)  
而非关系型数据库汪汪不支持事务，或者不能要个保证ACID的特性，只能实现计本的一致性

#### 总结

<table class="ne-table" id="QAUEU"><tbody><tr><td width="250"></td><td width="250"><p class="ne-p" id="uebe96810"><span class="ne-text">SQL</span></p></td><td width="250"><p class="ne-p" id="u8a5e1e1a"><span class="ne-text">NoSQL</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u976660f8"><span class="ne-text">数据结构</span></p></td><td width="250"><p class="ne-p" id="uaeaad055"><span class="ne-text">结构化(Structured)</span></p></td><td width="250"><p class="ne-p" id="u3b51be7d"><span class="ne-text">非结构化</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u16abdc9d"><span class="ne-text">数据关联</span></p></td><td width="250"><p class="ne-p" id="u87ab41ba"><span class="ne-text">关联的(Relational)</span></p></td><td width="250"><p class="ne-p" id="u592efe79"><span class="ne-text">无关联的</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u7824be7d"><span class="ne-text">查询方式</span></p></td><td width="250"><p class="ne-p" id="ud5e36a17"><span class="ne-text">SQL查询</span></p></td><td width="250"><p class="ne-p" id="uc37c389c"><span class="ne-text">非SQL</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ufa07882d"><span class="ne-text">事务特性</span></p></td><td width="250"><p class="ne-p" id="ue99931f7"><span class="ne-text">ACID</span></p></td><td width="250"><p class="ne-p" id="u98e613dc"><span class="ne-text">BASE</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ue4606fa1"><span class="ne-text">存储方式</span></p></td><td width="250"><p class="ne-p" id="u8d258593"><span class="ne-text">磁盘</span></p></td><td width="250"><p class="ne-p" id="uce923397"><span class="ne-text">内存</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u8c985955"><span class="ne-text">扩展性</span></p></td><td width="250"><p class="ne-p" id="u608e7392"><span class="ne-text">垂直</span></p></td><td width="250"><p class="ne-p" id="u086dd815"><span class="ne-text">水平</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ue372f9b0"><span class="ne-text">使用场景</span></p></td><td width="250"><p class="ne-p" id="ue34649e4"><span class="ne-text">1）数据结构固定<br/></span><span class="ne-text">2)对一致性、安全性要求不高</span></p></td><td width="250"><p class="ne-p" id="u5a43bff4"><span class="ne-text">1)数据结构不固定<br/></span><span class="ne-text">2)相关业务对数据安全性、一致性要求较高<br/></span><span class="ne-text">3）对性能要求</span></p></td></tr></tbody></table>

- 存储方式

- 关系型数据库基于磁盘进行存储，会有大量的磁盘IO，对性能有一定影响
- 非关系型数据库，他们的操作更多的是依赖于内存来操作，内存的读写速度会非常快，性能自然会好一些

- 扩展性

- 关系型数据库集群模式一般是主从，主从数据一致，起到数据备份的作用，称为垂直扩展。
- 非关系型数据库可以将数据拆分，存储在不同机器上，可以保存海量数据，解决内存大小有限的问题。称为水平扩展。
- 关系型数据库因为表之间存在关联关系，如果做水平扩展会给数据查询带来很多麻烦

![](</blogs/_assets/lakebook/4fc6511baa00caa54b7a1995.png>)

### 认识Redis

#### Redis简介

- Redis是用C语言开发的一个开源的、高性能的键值对\(key\-value\)数据库，官方提供的数据是可以达到100000\+的QPS（每秒内查询次数）。它存储的value类型比较丰富，也被称为结构化NoSql数据库
- NoSql\(Not Only Sql\)，不仅仅是SQL，泛指非关系型数据库，NoSql数据库并不是要取代关系型数据库，而是关系型数据库的补充

关系型数据库\(RDBMS\)：MySQL、Oracl、DB2、SQLServer  
非关系型数据库\(NoSql\)：Redis、Mongo DB、MemCached

- Redis应用场景：缓存、消息队列、任务队列、分布式锁

Redis诞生于2009年，全称是Remote Dictionary Server远程词典服务器，是一个基于内存的键值型NoSQL数据库。

特征：

- 键值\(Key\-Value\)型，Value支持多种不同的数据结构，功能丰富
- 单线程，每个命令具有原子性
- 低延迟，速度快\(基于内存、IO多路复用、良好的编码\)
- 支持数据持久化
- 支持主从集群、分片集群
- 支持多语言客户端

作者：Antirez

Redis官网：[https://redis\.io/](https://redis.io/)

### 安装Redis

### 下载与安装

- 这里我们在Linux和Windows上都装一下

- Windows 版：[https://github\.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases)
- Linux 版：[https://download\.redis\.io/releases/](https://download.redis.io/releases/)

#### Windows安装Redis

- Windows 版：[https://github\.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases)
- 直接下载对应版本的`.zip`压缩包，直接解压之后

#### Linux安装Redis

- Linux系统安装Redis步骤：

1. 将Redis安装包上传到Linux
2. 解压安装包，改成你自己的redis版本，路径我习惯解压到`/usr/local`

<table class="ne-table" id="t3s1G"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="YrAEz"><code>tar -zxvf redisVersion.tar.gz -C /usr/local</code></pre></td></tr></tbody></table>

1. 安装Redis的依赖环境gcc，我的云服务器已经装过了，本地的Linux还没装

<table class="ne-table" id="IbUqk"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="M41Ei"><code>## 安装依赖环境&#10;yum install gcc-c++</code></pre></td></tr></tbody></table>

1. 进入`/usr/local/redis根目录`，进行编译

<table class="ne-table" id="xVWLs"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="tkatB"><code>## 进入到根目录&#10;cd /usr/local/redis根目录&#10;&#10;## 编译&#10;make</code></pre></td></tr></tbody></table>

1. 进入redis的src目录，进行安装

<table class="ne-table" id="tyzez"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="Cn9U1"><code>## 进入到src目录&#10;cd /usr/local/redis根目录/src&#10;## 进行安装&#10;make install</code></pre></td></tr></tbody></table>

#### redis的服务启动与停止

##### Linux启动与停止

- 进入到`/src`目录下，执行`redis-server`即可启动服务，默认端口号为`6379`

<table class="ne-table" id="kBYgv"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="R4s04"><code>## 进入到根目录&#10;cd /usr/local/redis根目录/src&#10;&#10;## 执行redis-server&#10;./redis-server</code></pre></td></tr></tbody></table>

##### Linux设置后台运行

- 进入到redis根目录下，修改配置redis\.conf文件

<table class="ne-table" id="AzV4h"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="KSZtu"><code>## 进入到redis根目录下&#10;cd /usr/local/redis根目录&#10;&#10;## 修改配置文件&#10;vim redis.conf</code></pre></td></tr></tbody></table>

- 找到`daemonize on`字段，将其修改为`daemonize yes`
- 在redis根目录以redis\.conf作为配置文件在后台运行

<table class="ne-table" id="VYQr9"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="dUjQI"><code>src/redis-server ./redis.conf</code></pre></td></tr></tbody></table>

##### Linux开启密码校验

- 还是修改redis\.conf配置文件，找到`requirepass`这行，将其注释去掉，并在后面写上自己的密码
- 然后杀掉原进程再重新启动

<table class="ne-table" id="wWRo5"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="cENM7"><code>## 重新启动&#10;src/redis-server ./redis.conf &#10;&#10;## 登录时同时进行认证&#10;src/redis-cli -h localhost -p 6379 -a 密码</code></pre></td></tr></tbody></table>

- 修改完毕之后还是杀进程，然后重启服务

##### Linux开启远程连接

- 还是修改redis\.conf配置文件，找到`bind 127.0.0.1`这行，把这行注释掉
- 之后设置防火墙，开启6379端口

<table class="ne-table" id="JS9wk"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="RjiQZ"><code>## 开启6379端口&#10;firewall-cmd --zone=public --add-port=6379/tcp --permanent&#10;&#10;## 设置立即生效&#10;firewall-cmd --reload&#10;&#10;## 查看开放的端口&#10;firewall-cmd --zone=public --list-ports</code></pre></td></tr></tbody></table>

[![](</blogs/_assets/lakebook/82fe52cbcdbf1cd86603d7bb.png>)](https://pic1.imgdb.cn/item/634cd4d116f2c2beb19194c9.jpg)

[![](</blogs/_assets/lakebook/a2fd1e5438a2d1395c759966.png>)](https://pic1.imgdb.cn/item/634cd56d16f2c2beb1926804.jpg)

- 最后在Windows的redis根目录下，按住Shift\+右键打开PowerShell窗口，连接Linux的Redis

<table class="ne-table" id="muLFv"><tbody><tr><td width="750"><p class="ne-p" id="u18351140"><span class="ne-text">.\redis-cli.ext -h 服务器地址 -p 6379 -a 密码</span></p></td></tr></tbody></table>

## Redis数据类型

### 介绍

Redis存储的是key\-value结构的数据，其中key是字符串类型，value有5中常用的数据类型

- 字符串：String
- 哈希：Hash
- 列表：List
- 集合：Set
- 有序集合：Sorted Set

![](</blogs/_assets/lakebook/d21df3fd7181a44ec256dfbb.png>)

#### 字符串\(String\)常用命令

<table class="ne-table" id="PxjI2"><tbody><tr><td width="375"><p class="ne-p" id="u3d754a91"><span class="ne-text">命令</span></p></td><td width="375"><p class="ne-p" id="ue44c08e3"><span class="ne-text">描述</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ufe25a14e"><span class="ne-text">SET key value</span></p></td><td width="375"><p class="ne-p" id="uc3b3cc8a"><span class="ne-text">设置指定key的值</span></p></td></tr><tr><td width="375"><p class="ne-p" id="udae17748"><span class="ne-text">GET key</span></p></td><td width="375"><p class="ne-p" id="u71cafa10"><span class="ne-text">获取指定key的值</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u7e64f31e"><span class="ne-text">SETEX key seconds value</span></p></td><td width="375"><p class="ne-p" id="u3ae59c6f"><span class="ne-text">设置指定key的值，并将key的过期时间设为seconds秒</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u10a036e3"><span class="ne-text">SETNX key value</span></p></td><td width="375"><p class="ne-p" id="u4ae2a304"><span class="ne-text">只有在key不存在时设置key的值</span></p></td></tr></tbody></table>

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1777983100914-16c57829-f2e9-4bf6-b7b6-9c9e8d81b9dc.png>)

#### 哈希\(Hash\)常用命令

`Redis Hash`是一个`String`类型的`Field`和`Value`的映射表，`Hash`特别适合用于存储对象

![](</blogs/_assets/lakebook/a6eab2fad0b58861c02d36f3.png>)

<table class="ne-table" id="Z6s9g"><tbody><tr><td width="375"><p class="ne-p" id="ue2e89f85"><span class="ne-text">命令</span></p></td><td width="375"><p class="ne-p" id="ua349542c"><span class="ne-text">描述</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uef47140b"><span class="ne-text">HSET key field value  / 每个都是完整的键值 </span></p></td><td width="375"><p class="ne-p" id="u89305f64"><span class="ne-text">将哈希表key 中的字段field的值设为value</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u840310e2"><span class="ne-text">HGET key field value</span></p></td><td width="375"><p class="ne-p" id="ud68e108d"><span class="ne-text">获取存储在哈希表中指定字段的值</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u62ce9fbb"><span class="ne-text">HDEL key field </span></p></td><td width="375"><p class="ne-p" id="u81f54b05"><span class="ne-text">删除存储在哈希表中的指定字段</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uc4f9bf67"><span class="ne-text">HKEYS key</span></p></td><td width="375"><p class="ne-p" id="u8f5cb582"><span class="ne-text">获取哈希表中所有字段</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u2553cab5"><span class="ne-text">HVALS key</span></p></td><td width="375"><p class="ne-p" id="ud12b556b"><span class="ne-text">获取哈希表中所有值</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ud6277205"><span class="ne-text">HGETALL key</span></p></td><td width="375"><p class="ne-p" id="ud5f97fa8"><span class="ne-text">获取在哈希表中指定key的所有字段和值</span></p></td></tr></tbody></table>

可以创建一个 HashMap , 然后使用 HSet 第二个参数直接传入即可, 现在不带 M 也可以实现多传 ;

#### 列表\(List\)常用命令

`Redis List`是简单的字符串列表，按照插入顺序排序

<table class="ne-table" id="bUwGg"><tbody><tr><td width="375"><p class="ne-p" id="uc4462e34"><span class="ne-text">命令</span></p></td><td width="375"><p class="ne-p" id="u5ddbc6e8"><span class="ne-text">描述</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ucb703b1a"><code class="ne-code"><span class="ne-text">LPUSH</span></code></p><p class="ne-p" id="u25a639a1"><span class="ne-text"> key value1 [value2] /</span></p><p class="ne-p" id="u2178ef8a"><span class="ne-text">RPUSH </span></p></td><td width="375"><p class="ne-p" id="ud61cd225"><span class="ne-text">将一个或多个值插入到列表头部</span></p><p class="ne-p" id="u7ce837e3"><span class="ne-text">使用 L 实现的插入顺序是 和书写顺序相反   </span></p><p class="ne-p" id="uabe312ee"><span class="ne-text">        使用 R 实现的插入顺序 和 书写顺序一致 </span></p></td></tr><tr><td width="375"><p class="ne-p" id="u9eabc944"><code class="ne-code"><span class="ne-text">LRANGE</span></code></p><p class="ne-p" id="ua7eb08f3"><span class="ne-text"> key start stop / </span></p></td><td width="375"><p class="ne-p" id="ud7889034"><span class="ne-text">获取列表指定范围内的元素</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u8a17eab2"><code class="ne-code"><span class="ne-text">RPOP</span></code></p><p class="ne-p" id="u4f140cc0"><span class="ne-text"> </span><span class="ne-text">key</span></p></td><td width="375"><p class="ne-p" id="u2869312d"><span class="ne-text">移除并获取列表最后一个元素</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ufb317ffa"><code class="ne-code"><span class="ne-text">LLEN</span></code></p><p class="ne-p" id="u628e6589"><span class="ne-text"> </span><span class="ne-text">key</span></p></td><td width="375"><p class="ne-p" id="ucfaebc90"><span class="ne-text">获取列表长度</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u24cf2602"><code class="ne-code"><span class="ne-text">BRPOP</span></code></p><p class="ne-p" id="udabceea7"><span class="ne-text"> </span><span class="ne-text">key1 [key2] timeout</span></p></td><td width="375"><p class="ne-p" id="u9c240c5a"><span class="ne-text">移出并获取列表的最后一个元素<br/></span><span class="ne-text">如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止 , 创建一个阻塞时期 ; </span></p></td></tr></tbody></table>

#### 集合\(Set\)常用命令

`Redis set`是`String`类型的无序集合。集合成员是唯一的，这就意味着集合中不能出现重复的数据

<table class="ne-table" id="jHhbA"><tbody><tr><td width="375"><p class="ne-p" id="u3b3e7ed0"><span class="ne-text">命令</span></p></td><td width="375"><p class="ne-p" id="u1d121f44"><span class="ne-text">描述</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ubb3aea48"><span class="ne-text">SADD key member1 [member2]</span></p></td><td width="375"><p class="ne-p" id="u01b764d2"><span class="ne-text">向集合添加一个或多个成员</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u1a12b5bd"><span class="ne-text">SMEMBERS key</span></p></td><td width="375"><p class="ne-p" id="u40843246"><span class="ne-text">返回集合中的所有成员</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uec095d86"><span class="ne-text">SCARD key </span></p></td><td width="375"><p class="ne-p" id="u347520ff"><span class="ne-text">获取集合的成员数</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uea3c4e67"><span class="ne-text">SINTER key1 [key2]</span></p></td><td width="375"><p class="ne-p" id="u4c3713a1"><span class="ne-text">返回给定所有集合的交集</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ubec74d35"><span class="ne-text">SUNION key1 [key2]</span></p></td><td width="375"><p class="ne-p" id="u68c4ecfb"><span class="ne-text">返回所有给定集合的并集</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ue894b36c"><span class="ne-text">SDIFF key1 [key2]</span></p></td><td width="375"><p class="ne-p" id="ue0111ba9"><span class="ne-text">返回给定所有集合的差集</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u2ee52293"><span class="ne-text">SREM key member1 [member2]</span></p></td><td width="375"><p class="ne-p" id="ub263058d"><span class="ne-text">移除集合中一个或多个成员</span></p></td></tr></tbody></table>

#### 有序集合\(Sorted Set\)常用命令

`Redis Sorted Set`有序集合是`String`类型元素的集合，且不允许重复的成员。每个元素都会关联一个`double`类型的分数\(`score`\) 。`Redis`正是通过分数来为集合中的成员进行从小到大排序。有序集合的成员是唯一的，但分数却可以重复。

<table class="ne-table" id="PCq92"><tbody><tr><td width="375"><p class="ne-p" id="u970ba215"><span class="ne-text">命令</span></p></td><td width="375"><p class="ne-p" id="u129eecb2"><span class="ne-text">描述</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uba5c3977"><span class="ne-text">ZADD key score1 member1 [score2 member2]</span></p></td><td width="375"><p class="ne-p" id="u783f0c59"><span class="ne-text">向有序集合添加一个或多个成员，或者更新已存在成员的分数</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u22c59933"><span class="ne-text">ZRANGE key start stop [WITHSCORES]</span></p></td><td width="375"><p class="ne-p" id="ua3a869b3"><span class="ne-text">通过索引区间返回有序集合中指定区间内的成员</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u308b894c"><span class="ne-text">ZINCRBY key increment member</span></p></td><td width="375"><p class="ne-p" id="u0db65dc4"><span class="ne-text">有序集合中对指定成员的分数加上增量increment</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u452c1f4d"><span class="ne-text">ZREM key member [member …]</span></p></td><td width="375"><p class="ne-p" id="u613b9e60"><span class="ne-text">移除有序集合中的一个或多个成员</span></p></td></tr></tbody></table>

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1777987972761-56ecedff-1d68-46d7-83db-f29b27a0de48.png>)

#### 通用命令 \( 大部分都可以实现多个使用 \)

EXPIRE key 数字\. 默认单位是 秒 级别的 , 可以创建一个 以秒为单位代谢的 key ;

● 返回 \-1：键存在，但没有设置过期时间（永久有效）。

● 返回 \-2：键不存在（可能因为已经过期被自动删除，或者该键从未被创建）。

● 返回 大于 0 的数字：键还有多少秒存活。

<table class="ne-table" id="KlteF"><tbody><tr><td width="375"><p class="ne-p" id="u6d0b2812"><span class="ne-text">命令</span></p></td><td width="375"><p class="ne-p" id="u8b927b1a"><span class="ne-text">描述</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u67b4f680"><span class="ne-text">KEYs pattern</span></p></td><td width="375"><p class="ne-p" id="u83fe02c8"><span class="ne-text">查找所有符合给定模式(pattern)的key</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u4b866990"><span class="ne-text">KEYS *  / KEYS a* </span></p></td><td width="375"><p class="ne-p" id="u2c5800ae"><span class="ne-text">查找全部的key  / 查找全部开头为a的key</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uf1f8e543"><span class="ne-text">EXISTs key</span></p></td><td width="375"><p class="ne-p" id="ufbdcfdf7"><span class="ne-text">检查给定key是否存在</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u45b57ddf"><span class="ne-text">TYPE key</span></p></td><td width="375"><p class="ne-p" id="ub3fc6b42"><span class="ne-text">返回key所储存的值的类型</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u880c40a6"><span class="ne-text">EXPIRE diaosi:user:1 10</span></p></td><td width="375"><p class="ne-p" id="u6a67df16"><span class="ne-text">设置剩余的key的剩余保存时间</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ue7fa2e4a"><span class="ne-text">TTL key </span></p></td><td width="375"><p class="ne-p" id="ue2e46d7f"><span class="ne-text">返回给定key的剩余生存时间(TTL, time to live)，以秒为单位</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u64241f65"><span class="ne-text">MSET [名字 名字 名字]</span></p></td><td width="375"><p class="ne-p" id="u7673f95e"><span class="ne-text">批量产出 key字段  </span></p></td></tr><tr><td width="375"><p class="ne-p" id="uaebb86b5"><span class="ne-text">DEL key/[名字 名字 名字 ]</span></p></td><td width="375"><p class="ne-p" id="ub956ab9c"><span class="ne-text">该命令用于在key存在是删除key / 批量删除</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uaf1eb175"><span class="ne-text">SELECT 表名</span></p></td><td width="375"><p class="ne-p" id="ud5198c66"><span class="ne-text">实现切换当前使用的数据库表 ; </span></p></td></tr><tr><td width="375"><p class="ne-p" id="u94d374be"><span class="ne-text">Help  @选择模块</span></p></td><td width="375"><p class="ne-p" id="u335ef3e0"><span class="ne-text">可以快速获取到使用的模块 </span></p></td></tr></tbody></table>

- **NX**：Only set if key does **N**ot e**X**ist（键不存在时才设置）
- **XX**：Only set if key e**X**ists（键存在时才设置）
- **EX**：设置过期时间（单位：秒）
- **PX**：设置过期时间（单位：毫秒）

创建 key 时 可以设置层名 实现分层 查询 set com:user:1 ; 实现放置包名 ;

这样创建 可以生成层级结构 :

创建出的层级样式 只有使用 了 空格才会开始区分 key , value ;

可以实现 快捷管理 :

![](</blogs/_assets/lakebook/854bf4d7b0a236a57fe01af5.png>)

更多详细的命令可以查看官方文档：[https://www\.redis\.net\.cn/order/](https://www.redis.net.cn/order/)

## Java中使用Redis

### 简介

java客户端 ;

http://redis\.io/clients

- Redis的Java客户端有很多，官方推荐的有三种

- `Jedis`
- `Lettuce`
- `Redisson`

- Spring对Redis客户端进行了整合，提供了SpringDataRedis，在Spring Boot项目中还提供了对应的Starter，即`spring-boot-starter-data-redis`

&lt;http://github\.com/redis/jedis&gt;

### Jedis

- 使用Jedis的步骤

1. 获取连接
2. 执行操作
3. 关闭连接

- 在此之前我们需要导入一下Jedis的maven坐标

<table class="ne-table" id="e8vJj"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="xqBjM"><code>&lt;dependency&gt;&#10;    &lt;groupId&gt;redis.clients&lt;/groupId&gt;&#10;    &lt;artifactId&gt;jedis&lt;/artifactId&gt;&#10;    &lt;version&gt;2.8.0&lt;/version&gt;&#10;&lt;/dependency&gt;</code></pre></td></tr></tbody></table>

- 编写测试类 , 命名时不要和 依赖名 重复 ;

<table class="ne-table" id="hWESN"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="HVFCw"><code>@SpringBootTest&#10;class RedisTestApplicationTests {&#10;&#10;    @Test&#10;    void contextLoads() {&#10;        //1. 获取连接&#10;        Jedis jedis = new Jedis("localhost", 6379);&#10;        //2. 执行具体操作&#10;        jedis.set("name", "Hades");&#10;&#10;        jedis.hset("stu", "name", "Jerry");&#10;        jedis.hset("stu", "age", "18");&#10;        jedis.hset("stu", "num", "4204000400");&#10;&#10;        Map&lt;String, String&gt; map = jedis.hgetAll("stu");&#10;        Set&lt;String&gt; keySet = map.keySet();&#10;        for (String key : keySet) {&#10;            String value = map.get(key);&#10;            System.out.println(key + ":" + value);&#10;        }&#10;        String name = jedis.get("name");&#10;        System.out.println(name);&#10;        //3. 关闭连接&#10;        jedis.close();&#10;    }&#10;&#10;}</code></pre></td></tr></tbody></table>

- 输出结果

```text
num:4204000400
name:Jerry
age:18
Hades
```

- Jedis我们了解一下即可，大多数情况下我们还是用SpringDataRedis的

### 3\.1\.2\.连接池

Jedis本身是线程不安全的，并且频繁的创建和销毁连接会有性能损耗，因此我们推荐大家使用Jedis连接池代替Jedis的直连方式。

```java
package com.heima.jedis.util;

import redis.clients.jedis.*;

public class JedisConnectionFactory {

    private static JedisPool jedisPool;

    static {
        // 配置连接池
        JedisPoolConfig poolConfig = new JedisPoolConfig();
        poolConfig.setMaxTotal(8);
        poolConfig.setMaxIdle(8);
        poolConfig.setMinIdle(0);
        poolConfig.setMaxWaitMillis(1000);
        // 创建连接池对象，参数：连接池配置、服务端ip、服务端端口、超时时间、密码
        jedisPool = new JedisPool(poolConfig, "192.168.150.101", 6379, 1000, "123321");
    }

    public static Jedis getJedis(){
        return jedisPool.getResource();
    }
}
```

使用了下面的配置编写redis 的话 , 只需要 更改 一下 \.yml配置文件就行 ;

### Spring Data Redis

- SpringBoot项目中，可以使用SpringDataRedis来简化Redis（常用）
- Spring Data Redis中提供了一个高度封装的类：RedisTemplate，针对jedis客户端中大量api进行了归类封装，将同一类型操作封装为operation接口，具体分类如下：

- ValueOperations：简单K\-V操作
- SetOperations：set类型数据操作
- ZSetOperations：zset类型数据操作
- HashOperations：针对map类型的数据操作
- ListOperations：针对list类型的数据操作

- 使用SpringDataRedis，我们首先需要导入它的maven坐标

<table class="ne-table" id="e4eZh"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="LPh6O"><code>&lt;!--Spring Boot-redis的依赖包--&gt;&#10;&lt;dependency&gt;&#10;    &lt;groupId&gt;org.springframework.boot&lt;/groupId&gt;&#10;    &lt;artifactId&gt;spring-boot-starter-data-redis&lt;/artifactId&gt;&#10;&lt;/dependency&gt;</code></pre></td></tr></tbody></table>

- 之后重新设置一下序列化器，防止出现乱码，在config包下创建`RedisConfig`配置类

<table class="ne-table" id="tMXNh"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="Q7RQa"><code>@Configuration&#10;public class RedisConfig extends CachingConfigurerSupport {&#10;    @Bean&#10;    public RedisTemplate&lt;Object, Object&gt; redisTemplate(RedisConnectionFactory connectionFactory) {&#10;&#10;        RedisTemplate&lt;Object, Object&gt; redisTemplate = new RedisTemplate&lt;&gt;();&#10;&#10;        //默认的Key序列化器为：JdkSerializationRedisSerializer&#10;        redisTemplate.setKeySerializer(new StringRedisSerializer());&#10;        redisTemplate.setHashKeySerializer(new StringRedisSerializer());&#10;&#10;        redisTemplate.setConnectionFactory(connectionFactory);&#10;&#10;        return redisTemplate;&#10;    }&#10;}</code></pre></td></tr></tbody></table>

- 随后配置一下连接redis的相关配置

<table class="ne-table" id="Q3F1n"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="Ve5uX"><code>spring:&#10;  redis:&#10;    host: localhost&#10;    port: 6379&#10;    #password: root&#10;    database: 0 #操作的是0号数据库&#10;    jedis:&#10;      #Redis连接池配置&#10;      pool:&#10;        max-active: 8 #最大连接数&#10;        max-wait: 1ms #连接池最大阻塞等待时间&#10;        max-idle: 4 #连接池中的最大空闲连接&#10;        min-idle: 0 #连接池中的最小空闲连接</code></pre></td></tr></tbody></table>

##### 1\. `String`类型数据操作

<table class="ne-table" id="fTS87"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="cNE8Y"><code>@Test&#10;void stringTest() {&#10;    //获取对象&#10;    ValueOperations valueOperations = redisTemplate.opsForValue();&#10;    //设置name为Hades&#10;    valueOperations.set("name","Hades");&#10;    String name = (String) valueOperations.get("name");&#10;    System.out.println(name);&#10;    //设置age为9527，有效时间10秒&#10;    valueOperations.set("age", "9527", 10, TimeUnit.SECONDS);&#10;    String age = (String) valueOperations.get("age");&#10;    System.out.println(age);&#10;    //如果不存在，则设置name为Kyle&#10;    Boolean aBoolean = valueOperations.setIfAbsent("name", "Kyle");&#10;    System.out.println(aBoolean);&#10;}</code></pre></td></tr></tbody></table>

输出结果如下，由于name已经存在，故Kyle设置失败，最后返回false，10秒过后，我们再去redis中get name，则输出`nil`，表示不存在

```text
Hades
9527
false
```

##### 2\. `Hash`类型数据操作

<table class="ne-table" id="FtLmE"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="JuAbc"><code>@Test&#10;void hashTest() {&#10;    HashOperations hashOperations = redisTemplate.opsForHash();&#10;    hashOperations.put("4204000400", "name", "Hades");&#10;    hashOperations.put("4204000400", "age", "18");&#10;    hashOperations.put("4204000400", "hobby", "Apex");&#10;    //获取map集合&#10;    Map&lt;String, String&gt; map = hashOperations.entries("4204000400");&#10;    Set&lt;String&gt; keySet = map.keySet();&#10;    for (String hashKey : keySet) {&#10;        System.out.println(hashKey + ":" + map.get(hashKey));&#10;    }&#10;    System.out.println("$$$$$$$$$$$$$$$");&#10;    //只获取keys&#10;    Set&lt;String&gt; keys = hashOperations.keys("4204000400");&#10;    for (String key : keys) {&#10;        System.out.println(key);&#10;    }&#10;    System.out.println("$$$$$$$$$$$$$$$");&#10;    //只获取values&#10;    List&lt;String&gt; values = hashOperations.values("4204000400");&#10;    for (String value : values) {&#10;        System.out.println(value);&#10;    }&#10;}</code></pre></td></tr></tbody></table>

输出结果如下

```text
name:Hades
age:18
hobby:Apex
$$$$$$$$$$$$$$$
name
age
hobby
$$$$$$$$$$$$$$$
Hades
18
Apex
```

##### 3\. `List`类型数据操作

<table class="ne-table" id="TOOpt"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="RoJZj"><code>@Test&#10;void listTest() {&#10;    ListOperations listOperations = redisTemplate.opsForList();&#10;    //存数据&#10;    listOperations.leftPush("testData", "A");&#10;    listOperations.leftPushAll("testData", "B", "C", "D");&#10;    List&lt;String&gt; testDatas = listOperations.range("testData", 0, -1);&#10;    //遍历&#10;    for (String tableData : testDatas) {&#10;        System.out.print(tableData + " ");&#10;    }&#10;    System.out.println();&#10;    //获取当前list长度，用于遍历&#10;    Long size = listOperations.size("testData");&#10;    int value = size.intValue();&#10;    //遍历输出并删除&#10;    for (int i = 0; i &lt; value; i++) {&#10;        System.out.print(listOperations.leftPop("testData") + " ");&#10;    }&#10;    //最后输出一下当前list长度&#10;    System.out.println();&#10;    System.out.println(listOperations.size("testData"));&#10;}</code></pre></td></tr></tbody></table>

输出结果如下

```text
D C B A
D C B A
0
```

##### 4\. `Set`类型数据操作

<table class="ne-table" id="spAJx"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="bEght"><code>@Test&#10;void setTest() {&#10;    SetOperations setOperations = redisTemplate.opsForSet();&#10;    //存数据，这里存了两个a&#10;    setOperations.add("tmp", "a", "b", "c", "d", "a");&#10;    遍历输出&#10;    Set&lt;String&gt; tmpData = setOperations.members("tmp");&#10;    for (String value : tmpData) {&#10;        System.out.print(value + " ");&#10;    }&#10;    System.out.println();&#10;    System.out.println("$$$$$$$$$$$$$$$$$$$");&#10;    //删除bc&#10;    setOperations.remove("tmp", "b", "c");&#10;    //再次遍历输出&#10;    tmpData = setOperations.members("tmp");&#10;    for (String value : tmpData) {&#10;        System.out.print(value + " ");&#10;    }&#10;}</code></pre></td></tr></tbody></table>

输出结果如下，符合预期

```text
d b c a
$$$$$$$$$$$$$$$$$$$
d a
```

##### 5\. `ZSet`类型数据操作

<table class="ne-table" id="PgBX4"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="ApQgK"><code>@Test&#10;void zsetTest() {&#10;    ZSetOperations zSetOperations = redisTemplate.opsForZSet();&#10;    //存值&#10;    zSetOperations.add("myZset", "a", 0.0);&#10;    zSetOperations.add("myZset", "b", 1.0);&#10;    zSetOperations.add("myZset", "c", 2.0);&#10;    zSetOperations.add("myZset", "a", 3.0);&#10;    //取值&#10;    Set&lt;String&gt; myZset = zSetOperations.range("myZset", 0, -1);&#10;    for (String s : myZset) {&#10;        System.out.println(s);&#10;    }&#10;    //修改分数&#10;    zSetOperations.incrementScore("myZset", "b", 4.0);&#10;    //取值&#10;    System.out.println("$$$$$$$$$$$$$$$$$$$$$$$$$");&#10;    myZset = zSetOperations.range("myZset", 0, -1);&#10;    for (String s : myZset) {&#10;        System.out.println(s);&#10;    }&#10;    //删除成员&#10;    zSetOperations.remove("myZset", "a", "b");&#10;    //取值&#10;    System.out.println("$$$$$$$$$$$$$$$$$$$$$$$$$");&#10;    myZset = zSetOperations.range("myZset", 0, -1);&#10;    for (String s : myZset) {&#10;        System.out.println(s);&#10;    }&#10;}</code></pre></td></tr></tbody></table>

```text
输出结果如下
b
c
a
$$$$$$$$$$$$$$$$$$$$$$$$$
c
a
b
$$$$$$$$$$$$$$$$$$$$$$$$$
c
```

- 通用的数据类型操作

<table class="ne-table" id="udeug"><tbody><tr><td width="750"><pre class="ne-codeblock language-plain" data-language="plain" id="dmtci"><code>@Test&#10;void commonTest() {&#10;    //查看所有key&#10;    Set&lt;String&gt; keys = redisTemplate.keys("*");&#10;    for (String key : keys) {&#10;        System.out.println(key);&#10;    }&#10;    //查看是否存在指定key&#10;    System.out.println("$$$$$$$$$$$$$$$$$$$$$$$$$");&#10;    System.out.println(redisTemplate.hasKey("Random"));&#10;    System.out.println("$$$$$$$$$$$$$$$$$$$$$$$$$");&#10;    //删除指定key，并再次查看&#10;    redisTemplate.delete("myZset");&#10;    keys = redisTemplate.keys("*");&#10;    for (String key : keys) {&#10;        System.out.println(key);&#10;    }&#10;    System.out.println("$$$$$$$$$$$$$$$$$$$$$$$$$");&#10;    //输出指定key的类型&#10;    System.out.println(redisTemplate.type("tmp"));&#10;}</code></pre></td></tr></tbody></table>

输出结果如下

```text
tmp
name
4204000400
stu
myData
$$$$$$$$$$$$$$$$$$$$$$$$$
false
$$$$$$$$$$$$$$$$$$$$$$$$$
tmp
name
4204000400
stu
myData
$$$$$$$$$$$$$$$$$$$$$$$$$
SET
```

### 3\.2\.2\.自定义序列化

RedisTemplate可以接收任意Object作为值写入Redis：

使用的底层 是 Object 流 :

ObjectOutputStream : 用的 输出流 ;

只不过写入前会把Object序列化为字节形式，默认是采用JDK序列化，得到的结果是这样的：

下面的就是 key , value : 全部 都被序列化了 \.

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1778052742221-f2d3c441-cc3e-446a-9637-642f0308d3d6.png>)

缺点：

- 可读性差
- 内存占用较大

我们可以自定义RedisTemplate的序列化方式，代码如下：

```java
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory){
        // 创建RedisTemplate对象
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        // 设置连接工厂
        template.setConnectionFactory(connectionFactory);
        // 创建JSON序列化工具
        GenericJackson2JsonRedisSerializer jsonRedisSerializer = 
                                        new GenericJackson2JsonRedisSerializer();
        // 设置Key的序列化
        template.setKeySerializer(RedisSerializer.string());
        template.setHashKeySerializer(RedisSerializer.string());
        // 设置Value的序列化
        template.setValueSerializer(jsonRedisSerializer);
        template.setHashValueSerializer(jsonRedisSerializer);
        // 返回
        return template;
    }
}
```

所以使用前最好修改一下 RedisSerializer 的序列化对象的方式 :

处理 JDK , 可以使用 StringRedisSerializer , GenericJackson2JsonRedisSeriallizar ;

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1778053117417-0b5ac60c-8313-4242-bbb3-85738348bcc4.png>)

展示代码中设置的 key 可以实现 String转型 , value 可以实现使用 JSON 实现转型;

整体可读性有了很大提升，并且能将Java对象自动的序列化为JSON字符串，并且查询时能自动把JSON反序列化为Java对象。不过，其中记录了序列化时对应的class名称，目的是为了查询时实现自动反序列化。这会带来额外的内存开销。

因为内部需要实现反序列化返回 JSON 数据 \-\-&gt; String 类型 ;

需要使用 类的类型存储内部 数据 ;

### 3\.2\.3\.StringRedisTemplateStringRedisTemplate

开始解决携带 类本身定义 的 繁杂问题 , 还要处理反序列化 问题 ;

为了节省内存空间，我们可以不使用JSON序列化器来处理value，而是统一使用String序列化器，要求只能存储String类型的key和value。当需要存储Java对象时，手动完成对象的序列化和反序列化。

\[原笔记图片附件缺失：assets/Ip9TKSY\.png\]

因为存入和读取时的序列化及反序列化都是我们自己实现的，SpringDataRedis就不会将class信息写入Redis了。

这种用法比较普遍，因此SpringDataRedis就提供了RedisTemplate的子类：StringRedisTemplate，它的key和value的序列化方式默认就是String方式。

省去了我们自定义RedisTemplate的序列化方式的步骤，而是直接使用：

```java
@Autowired
private StringRedisTemplate stringRedisTemplate;
// JSON序列化工具 , 可以使用自己熟练使用的转化JSON 工具 ; 
private static final ObjectMapper mapper = new ObjectMapper();

@Test
void testSaveUser() throws JsonProcessingException {
    // 创建对象
    User user = new User("虎哥", 21);
    // 手动序列化
    String json = mapper.writeValueAsString(user); 
    // 写入数据
    stringRedisTemplate.opsForValue().set("user:200", json);

    // 获取数据
    String jsonUser = stringRedisTemplate.opsForValue().get("user:200");
    // 手动反序列化
    User user1 = mapper.readValue(jsonUser, User.class);
    System.out.println("user1 = " + user1);
}
```

手动实现序列化和反序列化 ,常规开发完全够用, 支持多线程安全 ;

@Autowried

private StringRedisTemple stringRedisTemple ;

private static final ObjectMapper mapper \= new ObjectMapper\(\) ;

@Test

void testSaveUser\(\) \{

User user \= new User\(\) ;

String json \= mapper\.writeValueAssString\(user\) ;

//存储到redis 中去 ;

stringRedisTemple\.opsForValue\(\)\.set\("user:200" , json\) ;

String user1 \= \-\-&gt; 获取到 get ;

User Json \= mapper\.readValue\(user1 , User\.class\) ;

输出即可 ;

\}
