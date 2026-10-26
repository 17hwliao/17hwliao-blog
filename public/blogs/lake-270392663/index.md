# Redis原理篇

## 1、原理篇\-Redis数据结构

### 1\.1 Redis数据结构\-动态字符串 总结 :

#### redis内部创建的结构体 替换 原C 中的char数组 ;

- `len`：字符串当前长度（已用字节数，不含结尾 `\0`）
- `alloc`：已分配的总字节数（不含 header 和 `\0`）
- `flags`：低 3 位表示类型（`sdshdr5`/`8`/`16`/`32`/`64`），高 5 位在 `sdshdr5` 中存长度，其他类型不用高 5 位。
- `buf[]`：柔性数组，存储实际字符（C 字符串，以 `\0` 结尾，方便重用 C 函数）。

2\. 五种 SDS 类型（根据位宽）

<table class="ne-table" id="NgGdj"><tbody><tr><td width="250"><p class="ne-p" id="u30c3aa4d"><span class="ne-text">类型</span></p></td><td width="250"><p class="ne-p" id="uc899e377"><code class="ne-code"><span class="ne-text">len</span></code></p><p class="ne-p" id="u1ea6f2aa"><span class="ne-text">/</span><code class="ne-code"><span class="ne-text">alloc</span></code></p><p class="ne-p" id="u44e69e1f"><span class="ne-text"> </span><span class="ne-text">的位宽</span></p></td><td width="250"><p class="ne-p" id="u8b3c9802"><span class="ne-text">适用字符串最大长度</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u4e73e8ba"><code class="ne-code"><span class="ne-text">sdshdr5</span></code></p></td><td width="250"><p class="ne-p" id="u771e7cbe"><span class="ne-text">5 bits（复用 flags 高5位）</span></p></td><td width="250"><p class="ne-p" id="u6fa1c989"><span class="ne-text">32 字节以内（极少用）</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u74d50e4c"><code class="ne-code"><span class="ne-text">sdshdr8</span></code></p></td><td width="250"><p class="ne-p" id="ubca99dae"><span class="ne-text">uint8_t（1字节）</span></p></td><td width="250"><p class="ne-p" id="u48f8b633"><span class="ne-text">255 字节</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u173ac5c7"><code class="ne-code"><span class="ne-text">sdshdr16</span></code></p></td><td width="250"><p class="ne-p" id="u26d454c8"><span class="ne-text">uint16_t（2字节）</span></p></td><td width="250"><p class="ne-p" id="ua75d07b8"><span class="ne-text">65535 字节</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uc015f188"><code class="ne-code"><span class="ne-text">sdshdr32</span></code></p></td><td width="250"><p class="ne-p" id="ub7e6bfaf"><span class="ne-text">uint32_t（4字节）</span></p></td><td width="250"><p class="ne-p" id="u9e1b57d7"><span class="ne-text">4GB+</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u39670306"><code class="ne-code"><span class="ne-text">sdshdr64</span></code></p></td><td width="250"><p class="ne-p" id="ufd741c29"><span class="ne-text">uint64_t（8字节）</span></p></td><td width="250"><p class="ne-p" id="u6628ed70"><span class="ne-text">海量</span></p></td></tr></tbody></table>

**存储形式**：根据字符串长度自动选择最紧凑的类型，节省内存。

#### 1\. 动态扩容的预分配规则（你写得很对）

当对 SDS 进行追加操作（如 `sdscat`）需要扩容时：

- **新长度 &lt; 1 MB**：新分配空间 \= **新长度 × 2**（即预分配同样大小的空闲空间）
- **新长度 ≥ 1 MB**：新分配空间 \= **新长度 \+ 1 MB**

并且最后还要 \+1 字节存放结尾的 `\0`（不计入 `len` 和 `alloc`）。

**为什么要预分配**：  
减少频繁内存重分配的次数，提升性能（典型的空间换时间）。

#### 2\. 惰性释放

当缩短字符串时（如 `sdstrim`），不会立即释放多余内存，而是通过修改 `len` 并保留 `alloc`。这些多出的空间可以供下次追加使用。

我们都知道Redis中保存的Key是字符串，value往往是字符串或者字符串的集合。可见字符串是Redis中最常用的一种数据结构。

![](</blogs/_assets/lakebook/2df5357b4632c619a733df6b.png>)

Redis构建了一种新的字符串结构，称为简单动态字符串（Simple Dynamic String），简称SDS。  
例如，我们执行命令：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653984583289\.png\] ![](</blogs/_assets/lakebook/bdf6d22a6d426e6ed2644b48.png>)

那么Redis将在底层创建**两个SDS**，其中一个是包含“name”的SDS，另一个是包含“虎哥”的SDS。

Redis是C语言实现的，**其中SDS是一个结构体**，源码如下：

内部设置了 SDS 五种数据类型 通过比特位不同大小从小到大 : , ![](</blogs/_assets/lakebook/63c829e1688e3fe277338688.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653984624671\.png\] ![](</blogs/_assets/lakebook/23400ba8caa978a99394444f.png>)

例如，一个包含字符串“name”的sds结构如下：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653984648404\.png\] ![](</blogs/_assets/lakebook/dfbf69eae8f8e36b7ef459a3.png>)

SDS之所以叫做动态字符串，是因为它具备动态扩容的能力，例如一个内容为“hi”的SDS：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653984787383\.png\] ![](</blogs/_assets/lakebook/fe51ccf16f959db12a426a12.png>)

假如我们要给SDS追加一段字符串“,Amy”，这里首先会申请新内存空间：

**如果新字符串小于1M，则新空间为扩展后字符串长度的两倍\+1\('\\0'\)；**

如果新字符串大于1M，则新空间为扩展后字符串长度\+1M\+1。称为内存预分配。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653984822363\.png\] ![](</blogs/_assets/lakebook/246b58923c66420d32e88d90.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653984838306\.png\] ![](</blogs/_assets/lakebook/e12c74a13b8670d24202db69.png>)

### 1\.2 Redis数据结构\-intset

总结　:

```text
typedef struct intset {
    uint32_t encoding;  // 编码方式，标识contents数组中每个元素的大小
    uint32_t length;    // 元素个数
    int8_t contents[];  // 柔性数组，实际存储整数的原始字节
} intset;
```

#### 编码模式（encoding 的三种值）

<table class="ne-table" id="fQfFP"><tbody><tr><td width="250"><p class="ne-p" id="ub7a1cc40"><span class="ne-text">encoding 值</span></p></td><td width="250"><p class="ne-p" id="u2591dba9"><span class="ne-text">含义</span></p></td><td width="250"><p class="ne-p" id="u507d62c5"><span class="ne-text">每个元素占字节数</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u77ec16de"><code class="ne-code"><span class="ne-text">INTSET_ENC_INT16</span></code></p></td><td width="250"><p class="ne-p" id="uf3fe6ead"><span class="ne-text">元素是 int16_t 类型</span></p></td><td width="250"><p class="ne-p" id="u65e69c89"><span class="ne-text">2 字节</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u0d8a180e"><code class="ne-code"><span class="ne-text">INTSET_ENC_INT32</span></code></p></td><td width="250"><p class="ne-p" id="u03516df3"><span class="ne-text">元素是 int32_t 类型</span></p></td><td width="250"><p class="ne-p" id="u022c5edf"><span class="ne-text">4 字节</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u42eae76a"><code class="ne-code"><span class="ne-text">INTSET_ENC_INT64</span></code></p></td><td width="250"><p class="ne-p" id="u8e04f337"><span class="ne-text">元素是 int64_t 类型</span></p></td><td width="250"><p class="ne-p" id="u505bbedf"><span class="ne-text">8 字节</span></p></td></tr></tbody></table>

#### 升级机制（自动升级）

当插入一个超出当前 `encoding` 表示范围的大整数时，IntSet 会**自动升级**到更大范围的编码。

**升级流程**（你给的例子）：  
当前 `int16_t` 数组，要插入 `50000`（超出 int16 范围）：

1. 确定新编码为 `INTSET_ENC_INT32`
2. 根据新编码和元素数量（原 length \+ 1）重新分配内存
3. 将原数组中的元素**从后往前**依次复制到新内存的**正确位置**（保持升序）
4. 将新元素放入合适位置
5. 更新 `encoding` 和 `length`

**为什么要从后往前复制？**  
为了避免覆盖未复制的数据，类似原地插入排序的搬移。

#### 2\. 降级（不支持降级）

IntSet **只支持升级，不支持降级**。即使所有元素都变成小整数，编码也不会自动回退（避免反复升级/降级造成开销）。

#### 3\. 元素唯一且有序

- 插入时会做去重判断（通过二分查找定位）
- 元素始终按升序存储，保证查找可用二分查找

#### 4\. 查找方式：二分查找

因为有序，所以 `intsetSearch` 使用二分查找，时间复杂度 O\(log N\)。

#### 5\. 内存节省

通过使用最小所需位宽（int16 / int32 / int64）来存储整数，当元素较小时比直接用普通数组或链表更省内存。

IntSet是Redis中set集合的一种实现方式，基于整数数组来实现，并且具备长度可变、有序等特征。  
结构如下：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653984923322\.png\] ![](</blogs/_assets/lakebook/511f37bcfc0ff0a862a274c3.png>)

其中的encoding包含三种模式，表示存储的整数大小不同：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653984942385\.png\] ![](</blogs/_assets/lakebook/5e2038fbf3f494e43094c1f8.png>)

为了方便查找，Redis会将intset中所有的整数按照升序依次保存在contents数组中，结构如图：

![](</blogs/_assets/lakebook/3278552edde51f37372e076d.png>)

现在，数组中每个数字都在int16\_t的范围内，因此采用的编码方式是INTSET\_ENC\_INT16，每部分占用的字节大小为：  
encoding：4字节  
length：4字节

Header : 固定为 8个字节   
contents：2字节 \* 3 \= 6字节

![](</blogs/_assets/lakebook/c0017828b6c204d54d6f8a11.png>)

我们向该其中添加一个数字：50000，这个数字超出了int16\_t的范围，intset会自动升级编码方式到合适的大小。  
以当前案例来说流程如下：

// 根据 encoding 将 contents 转换为对应的整数指针类型

- `((int16_t*)is->contents)` 将 `contents` 的起始地址强制转换为 `int16_t*` 类型的指针
- 然后使用数组下标 `[pos]` 直接取第 `pos` 个元素  
  编译器会计算地址：`起始地址 + pos * sizeof(int16_t)`
- **寻址公式 : startPtr \+ \(sizeof\(int64\) \* index\) \-\-&gt; 角标从0开始 , 每一个大小都需要固定 ;**

- 升级编码为INTSET\_ENC\_INT32, 每个整数占4字节，并按照新的编码方式及元素个数扩容数组
- 倒序依次将数组中的元素拷贝到扩容后的正确位置
- 将待添加的元素放入数组末尾
- 最后，将inset的encoding属性改为INTSET\_ENC\_INT32，将length属性改为4

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985276621\.png\] ![](</blogs/_assets/lakebook/7558e9f250d071642879bd38.png>)

源码如下：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985304075\.png\] ![](</blogs/_assets/lakebook/345468255dc0f2090252b9f6.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985327653\.png\] ![](</blogs/_assets/lakebook/308489862aaf3195da8dbcb5.png>)

小总结：

Intset可以看做是特殊的整数数组，具备一些特点：

- Redis会确保Intset中的元素唯一、有序
- 具备类型升级机制，可以节省内存空间
- 底层采用二分查找方式来查询

### 1\.3 Redis数据结构\-Dict

总结 :

#### Dict 的三层结构

text

```text
dict (字典)
├── ht[0] : dictht (哈希表)
├── ht[1] : dictht (用于 rehash)
└── rehashidx : int (rehash 进度)

dictht (哈希表)
├── table : dictEntry** (指向桶数组的指针)
├── size : unsigned long (桶数组大小，2^n)
├── sizemask : unsigned long (size - 1，用于取模)
└── used : unsigned long (已有节点数)

dictEntry (哈希节点)
├── key : void* (键)
├── v : union (值，可以是指针/整数/double)
└── next : dictEntry* (链表指针，解决哈希冲突)
```

#### 存储核心机制

- **数组 \+ 链表**：哈希桶数组中的每个元素是一个单向链表的头指针。
- **索引计算**：`index = hash & sizemask`（等价于 `hash % size`，因 size 为 2^n）。
- **哈希冲突解决**：链地址法，新节点插入链表头部（头插法）。

###### 必须记住的 Dict 核心知识点（从你材料中提取）

###### 1\. 扩容触发条件

<table class="ne-table" id="QNNEa"><tbody><tr><td width="250"><h6 id="xHQ6u"><span class="ne-text">条件</span></h6></td><td width="250"><h6 id="pb2qs"><span class="ne-text">是否允许扩容</span></h6></td><td width="250"><h6 id="RGlKv"><span class="ne-text">说明</span></h6></td></tr><tr><td width="250"><h6 id="XgsUU"><code class="ne-code"><span class="ne-text">负载因子 &gt;= 1</span></code></h6><h6 id="TKryV"><span class="ne-text"> </span><span class="ne-text">且</span><span class="ne-text"> </span><strong><span class="ne-text">没有</span></strong><span class="ne-text"> </span><span class="ne-text">子进程（BGSAVE/BGREWRITEAOF）</span></h6></td><td width="250"><h6 id="jk63G"><span class="ne-text">✅</span></h6></td><td width="250"><h6 id="g5bje"><span class="ne-text">正常扩容</span></h6></td></tr><tr><td width="250"><h6 id="W8SgP"><code class="ne-code"><span class="ne-text">负载因子 &gt;= 5</span></code></h6></td><td width="250"><h6 id="h6FL8"><span class="ne-text">✅</span><span class="ne-text"> </span><strong><span class="ne-text">强制</span></strong></h6></td><td width="250"><h6 id="TryNa"><span class="ne-text">即使有子进程也立刻扩容</span></h6></td></tr><tr><td width="250"><h6 id="uQ0U2"><code class="ne-code"><span class="ne-text">负载因子 &lt; 1</span></code></h6><h6 id="V4Bzv"><span class="ne-text"> </span><span class="ne-text">且有子进程</span></h6></td><td width="250"><h6 id="lonNd"><span class="ne-text">❌</span></h6></td><td width="250"><h6 id="QPB1S"><span class="ne-text">避免与写时复制冲突</span></h6></td></tr></tbody></table>

###### 1\. 负载因子 \= `used / size`

###### 2\. 收缩触发条件

###### `负载因子 < 0.1` 时触发收缩（前提是 `used > 4` 且没在 rehash）

###### 3\. 扩容 / 收缩大小计算

<table class="ne-table" id="fW9X5"><tbody><tr><td width="375"><h6 id="HC0Cr"><span class="ne-text">操作</span></h6></td><td width="375"><h6 id="n7I8N"><span class="ne-text">新 size 计算规则</span></h6></td></tr><tr><td width="375"><h6 id="BVLBa"><span class="ne-text">扩容</span></h6></td><td width="375"><h6 id="wpP7r"><span class="ne-text">第一个 ≥</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">used + 1</span></code></h6><h6 id="IhDuo"><span class="ne-text"> </span><span class="ne-text">的 2^n</span></h6></td></tr><tr><td width="375"><h6 id="fmd5r"><span class="ne-text">收缩</span></h6></td><td width="375"><h6 id="q1h0m"><span class="ne-text">第一个 ≥</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">used</span></code></h6><h6 id="uyO2e"><span class="ne-text"> </span><span class="ne-text">的 2^n（且最小值 4）</span></h6></td></tr></tbody></table>

###### 4\. 渐进式 rehash

###### 不一次性迁移所有键，而是分批迁移

###### 标记 `rehashidx = 0` 开始，每次对 dict 执行查找、插入、删除操作时，顺便迁移一个桶（`rehashidx` 位置的链表）

###### `rehashidx == -1` 表示 rehash 结束

###### 5\.rehash 期间的操作规则

<table class="ne-table" id="OyT5t"><tbody><tr><td width="375"><p class="ne-p" id="u56a46e6e"><span class="ne-text">操作</span></p></td><td width="375"><p class="ne-p" id="u6fe2f32d"><span class="ne-text">行为</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uf219fb4f"><span class="ne-text">新增（add）</span></p></td><td width="375"><p class="ne-p" id="uff5b815e"><span class="ne-text">直接写入</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">ht[1]</span></code></p><p class="ne-p" id="u6cf41871"><span class="ne-text">（保证</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">ht[0]</span></code></p><p class="ne-p" id="u14047fc8"><span class="ne-text"> </span><span class="ne-text">只减不增）</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u7097b09d"><span class="ne-text">查找（find）</span></p></td><td width="375"><p class="ne-p" id="u9248f7cf"><span class="ne-text">先查</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">ht[0]</span></code></p><p class="ne-p" id="uca049196"><span class="ne-text">，再查</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">ht[1]</span></code></p></td></tr><tr><td width="375"><p class="ne-p" id="u26230fb4"><span class="ne-text">更新（update）</span></p></td><td width="375"><p class="ne-p" id="u25884bab"><span class="ne-text">同查找，找到后更新对应表</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ubb876258"><span class="ne-text">删除（delete）</span></p></td><td width="375"><p class="ne-p" id="ufb6fea64"><span class="ne-text">同查找，找到后删除</span></p></td></tr></tbody></table>

###### 6\. 与 BGSAVE / BGREWRITEAOF 的交互

- Redis 会临时设置 `dict_can_resize = 0`，禁止低阈值扩容（负载因子 ≥1）
- 但负载因子 ≥5 时，会强制忽略 `dict_can_resize` 直接扩容

我们知道Redis是一个键值型（Key\-Value Pair）的数据库，我们可以根据键实现快速的增删改查。而键与值的映射关系正是通过Dict来实现的。

hashmap \-\-&gt; 保存 entry 的数组  
Dict由三部分组成，分别是：哈希表（DictHashTable）、哈希节点（DictEntry）、字典（Dict）

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985396560\.png\] union C语言内部使用联合体 \-\-&gt; 和泛型很像 , 可以为 允许的泛型类型中任意一个不能多成立 ; ![](</blogs/_assets/lakebook/a7c58471304ac30c25e55b08.png>)

当我们向Dict添加键值对时，Redis首先根据key计算出hash值（h），

然后利用 h &amp; sizemask来计算元素应该存储到数组中的哪个索引位置。

由于是二进制数 所以 求&amp; 和实现 求余运算完全一致 ;

我们存储k1\=v1，假设k1的哈希值h \=1，则1&amp;3 \=1，因此k1\=v1要存储到数组角标1位置。

Redis 的字典 `dict` 使用哈希表作为底层实现。哈希表（`dictht`）是一个 `dictEntry` 的指针数组（`dictEntry **table`），数组的每个元素就是一个“哈希桶”（bucket）。

当发生哈希冲突时，Redis 会使用“链地址法”来解决。`dictEntry` 结构体中有一个 `struct dictEntry *next` 指针，正是用来将冲突的多个键值对节点串联成一个**单向链表**

**可以实现查到冲突的entry \-\-&gt; 找到只是时间问题 ;**

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985497735\.png\] ![](</blogs/_assets/lakebook/adc7e7a06754a0abf0a97337.png>)

Dict由三部分组成，分别是：哈希表（DictHashTable）、哈希节点（DictEntry）、字典（Dict）

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985570612\.png\] ![](</blogs/_assets/lakebook/b68c2a7715004fd027f1a1f2.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985586543\.png\] ![](</blogs/_assets/lakebook/c955cb40abdf8c8a9388a808.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985640422\.png\] ![](</blogs/_assets/lakebook/34fdb016857c118cb60e0f77.png>)

**Dict的扩容**

Dict中的HashTable就是数组结合单向链表的实现，当集合中元素较多时，必然导致哈希冲突增多，链表过长，则查询效率会大大降低。  
Dict在每次新增键值对时都会检查负载因子（LoadFactor \= used/size） ，满足以下两种情况时会触发哈希表扩容：  
哈希表的 LoadFactor &gt;\= 1，并且服务器没有执行 BGSAVE 或者 BGREWRITEAOF 等后台进程；  
哈希表的 LoadFactor &gt; 5 , 一定会执行, 会忽视后台数据 的运行 '

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985716275\.png\] ![](</blogs/_assets/lakebook/a25a319c965e80b2ae0fcbdc.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985743412\.png\] ![](</blogs/_assets/lakebook/7d3f00e0f6218b8b79bdf2de.png>)

![](</blogs/_assets/lakebook/c04e765d1aab1e11ae085604.png>)

**Dict的rehash**

不管是扩容还是收缩，必定会创建新的哈希表，导致哈希表的size和sizemask变化，而key的查询与sizemask有关。因此必须对哈希表中的每一个key重新计算索引，插入新的哈希表，这个过程称为rehash。过程是这样的：

- 计算新hash表的realeSize，值取决于当前要做的是扩容还是收缩：

- 如果是扩容，则新size为第一个大于等于dict\.ht\[0\]\.used \+ 1的2^n
- 如果是收缩，则新size为第一个大于等于dict\.ht\[0\]\.used的2^n （不得小于4）

- 按照新的realeSize申请内存空间，创建dictht，并赋值给dict\.ht\[1\]

- 设置dict\.rehashidx \= 0，标示开始rehash
- 将dict\.ht\[0\]中的每一个dictEntry都rehash到dict\.ht\[1\]
- 将dict\.ht\[1\]赋值给dict\.ht\[0\]，给dict\.ht\[1\]初始化为空哈希表，释放原来的dict\.ht\[0\]的内存
- 将rehashidx赋值为\-1，代表rehash结束

- 在rehash过程中，新增操作，则直接写入ht\[1\]，查询、修改和删除则会在dict\.ht\[0\]和dict\.ht\[1\]依次查找并执行。这样可以确保ht\[0\]的数据只减不增，随着rehash最终为空

整个过程可以描述成：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985824540\.png\] ![](</blogs/_assets/lakebook/525373bf82c5e313a2cd39b5.png>)

小总结：

Dict的结构：

- 类似java的HashTable，底层是数组加链表来解决哈希冲突
- Dict包含两个哈希表，ht\[0\]平常用，ht\[1\]用来rehash

Dict的伸缩：

- ![](</blogs/_assets/lakebook/94d34b2b59320064e985d20f.png>)

- ![](</blogs/_assets/lakebook/004a4aba08a261e3a63d08ae.png>)

### 1\.4 Redis数据结构\-ZipList 压缩列表 , 申请连续内存

ZipList 是一种特殊的“双端链表” ，由一系列特殊编码的连续内存块组成。可以在任意一端进行压入/弹出操作, 并且该操作的时间复杂度为 O\(1\)。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653985987327\.png\] ![](</blogs/_assets/lakebook/a79fe5a43f669ea4f21c735b.png>)

![](</blogs/_assets/lakebook/ff757a53ef9c1e2c64d72953.png>)

<table class="ne-table" id="hlQpG"><tbody><tr><td width="187"><p class="ne-p" id="u1b685978"><strong><span class="ne-text">属性</span></strong></p></td><td width="187"><p class="ne-p" id="u37cf42f3"><strong><span class="ne-text">类型</span></strong></p></td><td width="187"><p class="ne-p" id="u85797605"><strong><span class="ne-text">长度</span></strong></p></td><td width="187"><p class="ne-p" id="u3025e61a"><strong><span class="ne-text">用途</span></strong></p></td></tr><tr><td width="187"><p class="ne-p" id="uf1343a85"><span class="ne-text">zlbytes</span></p></td><td width="187"><p class="ne-p" id="u34379dc9"><span class="ne-text">uint32_t</span></p></td><td width="187"><p class="ne-p" id="uf9dd2892"><span class="ne-text">4 字节</span></p></td><td width="187"><p class="ne-p" id="ua1e54240"><span class="ne-text">记录整个压缩列表占用的内存字节数</span></p></td></tr><tr><td width="187"><p class="ne-p" id="u1fa3bf20"><span class="ne-text">zltail</span></p></td><td width="187"><p class="ne-p" id="u0e2b00a3"><span class="ne-text">uint32_t</span></p></td><td width="187"><p class="ne-p" id="u911f4602"><span class="ne-text">4 字节</span></p></td><td width="187"><p class="ne-p" id="u4454aca9"><span class="ne-text">记录压缩列表表尾节点距离压缩列表的起始地址有多少字节，通过这个偏移量，可以确定表尾节点的地址。  --&gt; 可以直接计算出末尾元素的位置</span></p></td></tr><tr><td width="187"><p class="ne-p" id="ue5095e07"><span class="ne-text">zllen</span></p></td><td width="187"><p class="ne-p" id="u82794140"><span class="ne-text">uint16_t</span></p></td><td width="187"><p class="ne-p" id="u5d4a76e2"><span class="ne-text">2 字节</span></p></td><td width="187"><p class="ne-p" id="uc9b20261"><span class="ne-text">记录了压缩列表包含的节点数量。 最大值为UINT16_MAX （65534），如果超过这个值，此处会记录为65535，但节点的真实数量需要遍历整个压缩列表才能计算得出。</span></p></td></tr><tr><td width="187"><p class="ne-p" id="ub155bd22"><span class="ne-text">entry</span></p></td><td width="187"><p class="ne-p" id="u0630abe4"><span class="ne-text">列表节点</span></p></td><td width="187"><p class="ne-p" id="u0cb98abe"><span class="ne-text">不定</span></p></td><td width="187"><p class="ne-p" id="uefa73b20"><span class="ne-text">压缩列表包含的各个节点，节点的长度由节点保存的内容决定。</span></p></td></tr><tr><td width="187"><p class="ne-p" id="u6d77ef5e"><span class="ne-text">zlend</span></p></td><td width="187"><p class="ne-p" id="u67245ae7"><span class="ne-text">uint8_t</span></p></td><td width="187"><p class="ne-p" id="u599cd55a"><span class="ne-text">1 字节</span></p></td><td width="187"><p class="ne-p" id="u37461d3c"><span class="ne-text">特殊值 0xFF （十进制 255 ），用于标记压缩列表的末端。</span></p></td></tr></tbody></table>

**优点**：内存紧凑，节省指针开销（8 字节 → 可变长度编码）。  
**缺点**：更新可能引发**连锁更新**，最坏 O\(N²\)。

**ZipListEntry**

ZipList 中的Entry并不像普通链表那样记录前后节点的指针，因为记录两个指针要占用16个字节，浪费内存。而是采用了下面的结构：

计算下一个节点的位置 : 首个字节的长度 \+ encoding 内部 \+ 本身 \-\-&gt; 下一个节点起始位置

计算上一个 节点的位置 : 首个字段的起始位置 \- 上一节点的长度值

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986055253\.png\] ![](</blogs/_assets/lakebook/2532e0800dd2c375102551fa.png>)

- previous\_entry\_length：前一节点的长度，占1个或5个字节。

- 如果前一节点的长度小于254字节，则采用1个字节来保存这个长度值
- 如果前一节点的长度大于254字节，则采用5个字节来保存这个长度值，第一个字节为0xfe，后四个字节才是真实长度数据

- encoding：编码属性，记录content的数据类型（字符串还是整数）以及长度，占用1个、2个或5个字节
- contents：负责保存节点的数据，可以是字符串或整数

ZipList中所有存储长度的数值均采用小端字节序，即低位字节在前，高位字节在后。例如：数值0x1234，采用小端字节序后实际存储值为：0x3412

**Encoding编码**

ZipListEntry中的encoding编码分为字符串和整数两种：  
字符串：如果encoding是以“00”、“01”或者“10”开头，则证明content是字符串 , 11 , content 是数字 ;

<table class="ne-table" id="Eo827"><tbody><tr><td width="250"><p class="ne-p" id="ud96591e9"><strong><span class="ne-text">编码</span></strong></p></td><td width="250"><p class="ne-p" id="u5c522d66"><strong><span class="ne-text">编码长度</span></strong></p></td><td width="250"><p class="ne-p" id="u12252dc7"><strong><span class="ne-text">字符串大小</span></strong></p></td></tr><tr><td width="250"><p class="ne-p" id="ua1c336d4"><span class="ne-text">|00pppppp|</span></p></td><td width="250"><p class="ne-p" id="ud124ebc0"><span class="ne-text">1 bytes</span></p></td><td width="250"><p class="ne-p" id="uce22ea8c"><span class="ne-text">&lt;= 63 bytes</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u4f1e4a6f"><span class="ne-text">|01pppppp|qqqqqqqq|</span></p></td><td width="250"><p class="ne-p" id="uf1ebf1c2"><span class="ne-text">2 bytes</span></p></td><td width="250"><p class="ne-p" id="uec31da84"><span class="ne-text">&lt;= 16383 bytes</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u77fcf05f"><span class="ne-text">|10000000|qqqqqqqq|rrrrrrrr|ssssssss|tttttttt|</span></p></td><td width="250"><p class="ne-p" id="u1b8d6502"><span class="ne-text">5 bytes</span></p></td><td width="250"><p class="ne-p" id="u2ab93e45"><span class="ne-text">&lt;= 4294967295 bytes</span></p></td></tr></tbody></table>

例如，我们要保存字符串：“ab”和 “bc”

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986172002\.png\] ![](</blogs/_assets/lakebook/e3d28c763e3ffa78fba2f3d3.png>)

ZipListEntry中的encoding编码分为字符串和整数两种：

- 整数：如果encoding是以“11”开始，则证明content是整数，且encoding固定只占用1个字节

<table class="ne-table" id="OAiXn"><tbody><tr><td width="250"><p class="ne-p" id="uf05b7261"><strong><span class="ne-text">编码</span></strong></p></td><td width="250"><p class="ne-p" id="u0d6771b8"><strong><span class="ne-text">编码长度</span></strong></p></td><td width="250"><p class="ne-p" id="u8310c467"><strong><span class="ne-text">整数类型</span></strong></p></td></tr><tr><td width="250"><p class="ne-p" id="u9f531fcc"><span class="ne-text">11000000</span></p></td><td width="250"><p class="ne-p" id="ua1fdd17c"><span class="ne-text">1</span></p></td><td width="250"><p class="ne-p" id="ua0240ac9"><span class="ne-text">int16_t（2 bytes）</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u64b766ae"><span class="ne-text">11010000</span></p></td><td width="250"><p class="ne-p" id="u969c5988"><span class="ne-text">1</span></p></td><td width="250"><p class="ne-p" id="uc1aa0372"><span class="ne-text">int32_t（4 bytes）</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uac243f19"><span class="ne-text">11100000</span></p></td><td width="250"><p class="ne-p" id="uea0a42cb"><span class="ne-text">1</span></p></td><td width="250"><p class="ne-p" id="ufabc49c8"><span class="ne-text">int64_t（8 bytes）</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ub3c39714"><span class="ne-text">11110000</span></p></td><td width="250"><p class="ne-p" id="u90f66c36"><span class="ne-text">1</span></p></td><td width="250"><p class="ne-p" id="ufc950ab4"><span class="ne-text">24位有符整数(3 bytes)</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u8ded6135"><span class="ne-text">11111110</span></p></td><td width="250"><p class="ne-p" id="u96dbea56"><span class="ne-text">1</span></p></td><td width="250"><p class="ne-p" id="u9331d716"><span class="ne-text">8位有符整数(1 bytes)</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u5d441b4a"><span class="ne-text">1111xxxx</span></p></td><td width="250"><p class="ne-p" id="u5d7eba4c"><span class="ne-text">1</span></p></td><td width="250"><p class="ne-p" id="udb2bca62"><span class="ne-text">直接在xxxx位置保存数值，范围从0001~1101，减1后结果为实际值</span></p></td></tr></tbody></table>

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986282879\.png\] ![](</blogs/_assets/lakebook/043a125834dce5ef2b7b27b1.png>)

![](</blogs/_assets/lakebook/1d69a75ad63d63b9034695d2.png>)

### 1\.5 Redis数据结构\-ZipList的连锁更新问题

ZipList的每个Entry都包含previous\_entry\_length来记录上一个节点的大小，长度是1个或5个字节：  
如果前一节点的长度小于254字节，则采用1个字节来保存这个长度值  
如果前一节点的长度大于等于254字节，则采用5个字节来保存这个长度值，第一个字节为0xfe，后四个字节才是真实长度数据  
现在，假设我们有N个连续的、长度为250\~253字节之间的entry，

因此entry的previous\_entry\_length属性用1个字节即可表示，如图所示：

**但是中间插入了一个节点 为 大街店 , 后续的 记录节点都会变化为 5字节, 万一连续 后续会直接连锁更新 ;**

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986328124\.png\] ![](</blogs/_assets/lakebook/c417327d440d72d62b774f4b.png>)

ZipList这种特殊情况下产生的连续多次空间扩展操作称之为连锁更新（Cascade Update）。新增、删除都可能导致连锁更新的发生。

**小总结：**

**ZipList特性：**

- 压缩列表的可以看做一种连续内存空间的"双向链表"
- 列表的节点之间不是通过指针连接，而是记录上一节点和本节点长度来寻址，内存占用较低
- 如果列表数据过多，导致链表过长，可能影响查询性能
- 增或删较大数据时有可能发生连续更新问题

### 1\.6 Redis数据结构\-QuickList

问题1：ZipList虽然节省内存，但申请内存必须是连续空间，如果内存占用较多，申请内存效率很低。怎么办？

答：为了缓解这个问题，我们必须限制ZipList的长度和entry大小。

问题2：但是我们要存储大量数据，超出了ZipList最佳的上限该怎么办？

答：我们可以创建多个ZipList来分片存储数据。 \-\-&gt; 数据分片思想

问题3：数据拆分后比较分散，不方便管理和查找，这多个ZipList如何建立联系？

答：Redis在3\.2版本引入了新的数据结构QuickList，它是一个双端链表，只不过链表中的每个节点都是一个ZipList。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986474927\.png\] ![](</blogs/_assets/lakebook/ec6b65cac80e74147d099b69.png>)

为了避免QuickList中的每个ZipList中entry过多，Redis提供了一个配置项：

list\-max\-ziplist\-size来限制。  
如果值为正，则代表ZipList的允许的entry个数的最大值

如果值为负，则代表ZipList的最大内存大小，分5种情况：

- \-1：每个ZipList的内存占用不能超过4kb
- \-2：每个ZipList的内存占用不能超过8kb
- \-3：每个ZipList的内存占用不能超过16kb
- \-4：每个ZipList的内存占用不能超过32kb
- \-5：每个ZipList的内存占用不能超过64kb

其默认值为 \-2：可以使用 set , get 命令实现定义 和 查看

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986642777\.png\] ![](</blogs/_assets/lakebook/7ff2a457ed66d974e24fc367.png>)

以下是QuickList的和QuickListNode的结构源码：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986667228\.png\] ![](</blogs/_assets/lakebook/a23b525e5377a04b13da8a99.png>)

我们接下来用一段流程图来描述当前的这个结构

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986718554\.png\] ![](</blogs/_assets/lakebook/534a8dbbc999ced0724bc2bc.png>)

总结：

QuickList的特点：

- 是一个节点为ZipList的双端链表
- 节点采用ZipList，解决了传统链表的内存占用问题
- 控制了ZipList大小，解决连续内存空间申请效率问题
- 首尾两个节点不做压缩处理\. 但中间节点可以压缩，进一步节省了内存

###### 1\.7 Redis数据结构\-SkipList

SkipList（跳表）首先是链表，但与传统链表相比有几点差异：  
元素按照升序排列存储  
节点可能包含多个指针，指针跨度不同。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986771309\.png\] ![](</blogs/_assets/lakebook/97de4ae1c39705399cdaa1df.png>)

SkipList（跳表）首先是链表，但与传统链表相比有几点差异：  
元素按照升序排列存储  
节点可能包含多个指针，指针跨度不同。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986813240\.png\] ![](</blogs/_assets/lakebook/a98fd5a8207adfc8c0495610.png>)

SkipList（跳表）首先是链表，但与传统链表相比有几点差异：  
元素按照升序排列存储  
节点可能包含多个指针，指针跨度不同。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986877620\.png\] ![](</blogs/_assets/lakebook/a6e010c2587f8092a4d05d8b.png>)

小总结：

SkipList的特点：

- 跳跃表是一个双向链表，每个节点都包含score和ele值
- 节点按照score值排序，score值一样则按照ele字典排序
- 每个节点都可以包含多层指针，层数是1到32之间的随机数
- 不同层指针到下一个节点的跨度不同，层级越高，跨度越大
- 一级指针正常指向下一个值 , 二级 三级会依次向上递增实现跳表;
- 增删改查效率与红黑树基本一致，实现却更简单

### 1\.7 Redis数据结构\-RedisObject

Redis中的任意数据类型的键和值都会被封装为一个RedisObject，也叫做Redis对象，源码如下：

1、什么是redisObject：  
从Redis的使用者的角度来看，⼀个Redis节点包含多个database（非cluster模式下默认是16个，cluster模式下只能是1个），而一个database维护了从key space到object space的映射关系。这个映射关系的key是string类型，⽽value可以是多种数据类型，比如：  
string, list, hash、set、sorted set等。我们可以看到，key的类型固定是string，而value可能的类型是多个。  
⽽从Redis内部实现的⾓度来看，database内的这个映射关系是用⼀个dict来维护的。dict的key固定用⼀种数据结构来表达就够了，这就是动态字符串sds。而value则比较复杂，为了在同⼀个dict内能够存储不同类型的value，这就需要⼀个通⽤的数据结构，这个通用的数据结构就是robj，全名是redisObject。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653986956618\.png\] ![](</blogs/_assets/lakebook/a7c3b1e65f93ea09ca1671cc.png>)

Redis的编码方式

Redis中会根据存储的数据类型不同，选择不同的编码方式，共包含11种不同类型：

<table class="ne-table" id="TVpuV"><tbody><tr><td width="250"><p class="ne-p" id="u85c67dcc"><strong><span class="ne-text">编号</span></strong></p></td><td width="250"><p class="ne-p" id="u8ba12586"><strong><span class="ne-text">编码方式</span></strong></p></td><td width="250"><p class="ne-p" id="u6d3f787a"><strong><span class="ne-text">说明</span></strong></p></td></tr><tr><td width="250"><p class="ne-p" id="u73680138"><span class="ne-text">0</span></p></td><td width="250"><p class="ne-p" id="uba001151"><span class="ne-text">OBJ_ENCODING_RAW</span></p></td><td width="250"><p class="ne-p" id="u7cead9c3"><span class="ne-text">raw编码动态字符串</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u51b08909"><span class="ne-text">1</span></p></td><td width="250"><p class="ne-p" id="u3211788a"><span class="ne-text">OBJ_ENCODING_INT</span></p></td><td width="250"><p class="ne-p" id="u6e37e8bd"><span class="ne-text">long类型的整数的字符串</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ub99b182b"><span class="ne-text">2</span></p></td><td width="250"><p class="ne-p" id="u172c806b"><span class="ne-text">OBJ_ENCODING_HT</span></p></td><td width="250"><p class="ne-p" id="u6353fd19"><span class="ne-text">hash表（字典dict）</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u9b5272c0"><span class="ne-text">3</span></p></td><td width="250"><p class="ne-p" id="u038b0809"><span class="ne-text">OBJ_ENCODING_ZIPMAP</span></p></td><td width="250"><p class="ne-p" id="udde22b72"><span class="ne-text">已废弃</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uddab21f8"><span class="ne-text">4</span></p></td><td width="250"><p class="ne-p" id="u43f12945"><span class="ne-text">OBJ_ENCODING_LINKEDLIST</span></p></td><td width="250"><p class="ne-p" id="u0f4f6198"><span class="ne-text">双端链表</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u530721e3"><span class="ne-text">5</span></p></td><td width="250"><p class="ne-p" id="uf7c4060b"><span class="ne-text">OBJ_ENCODING_ZIPLIST</span></p></td><td width="250"><p class="ne-p" id="u160c88b2"><span class="ne-text">压缩列表</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u190b70c0"><span class="ne-text">6</span></p></td><td width="250"><p class="ne-p" id="ud07cbb17"><span class="ne-text">OBJ_ENCODING_INTSET</span></p></td><td width="250"><p class="ne-p" id="u908c4fa1"><span class="ne-text">整数集合</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u678bce76"><span class="ne-text">7</span></p></td><td width="250"><p class="ne-p" id="ua532aac7"><span class="ne-text">OBJ_ENCODING_SKIPLIST</span></p></td><td width="250"><p class="ne-p" id="u5b1e8286"><span class="ne-text">跳表</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u2d12d164"><span class="ne-text">8</span></p></td><td width="250"><p class="ne-p" id="u313a8df0"><span class="ne-text">OBJ_ENCODING_EMBSTR</span></p></td><td width="250"><p class="ne-p" id="ufcff2a87"><span class="ne-text">embstr的动态字符串</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u7afb0dc1"><span class="ne-text">9</span></p></td><td width="250"><p class="ne-p" id="uc61e8db2"><span class="ne-text">OBJ_ENCODING_QUICKLIST</span></p></td><td width="250"><p class="ne-p" id="u73e626ec"><span class="ne-text">快速列表</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ucb342285"><span class="ne-text">10</span></p></td><td width="250"><p class="ne-p" id="u7571ca35"><span class="ne-text">OBJ_ENCODING_STREAM</span></p></td><td width="250"><p class="ne-p" id="u4c949ef4"><span class="ne-text">Stream流</span></p></td></tr></tbody></table>

五种数据结构

Redis中会根据存储的数据类型不同，选择不同的编码方式。每种数据类型的使用的编码方式如下：

<table class="ne-table" id="bICP0"><tbody><tr><td width="375"><p class="ne-p" id="u5cbc920c"><strong><span class="ne-text">数据类型</span></strong></p></td><td width="375"><p class="ne-p" id="u989aefc1"><strong><span class="ne-text">编码方式</span></strong></p></td></tr><tr><td width="375"><p class="ne-p" id="u950f2d9f"><span class="ne-text">OBJ_STRING</span></p></td><td width="375"><p class="ne-p" id="u953fbcfb"><span class="ne-text">int、embstr、raw</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u7609db5f"><span class="ne-text">OBJ_LIST</span></p></td><td width="375"><p class="ne-p" id="u22a05119"><span class="ne-text">LinkedList和ZipList(3.2以前)、QuickList（3.2以后）</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u746db709"><span class="ne-text">OBJ_SET</span></p></td><td width="375"><p class="ne-p" id="u72422bb1"><span class="ne-text">intset、HT (就是 dict )</span></p></td></tr><tr><td width="375"><p class="ne-p" id="uc1b84418"><span class="ne-text">OBJ_ZSET</span></p></td><td width="375"><p class="ne-p" id="u8f1f8bfb"><span class="ne-text">ZipList、HT、SkipList</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ub11632ee"><span class="ne-text">OBJ_HASH</span></p></td><td width="375"><p class="ne-p" id="ua07bb1ab"><span class="ne-text">ZipList、HT</span></p></td></tr></tbody></table>

### 1\.8 Redis数据结构\-String

String是Redis中最常见的数据存储类型：

其基本编码方式是RAW，基于简单动态字符串（SDS）实现，存储上限为512mb。

如果存储的SDS长度小于44字节，则会采用EMBSTR编码，此时object head与SDS是一段连续空间。申请内存时

只需要调用一次内存分配函数，效率更高。

（1）底层实现⽅式：动态字符串sds 或者 long  
String的内部存储结构⼀般是sds（Simple Dynamic String，可以动态扩展内存），但是如果⼀个String类型的value的值是数字，那么Redis内部会把它转成long类型来存储，从⽽减少内存的使用。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653987103450\.png\] ![](</blogs/_assets/lakebook/76ef4d9ec8bdaadd3b9f9a84.png>)

如果存储的字符串是整数值，并且大小在LONG\_MAX范围内，则会采用INT编码：直接将数据保存在RedisObject的ptr指针位置（刚好8字节），不再需要SDS了。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653987159575\.png\] ![](</blogs/_assets/lakebook/9c86ab01c174ae0e1a37777d.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653987172764\.png\] ![](</blogs/_assets/lakebook/148bf1066ab51e8ec81afce5.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653987202522\.png\] ![](</blogs/_assets/lakebook/1e580ea52a6b403b21366798.png>)

确切地说，String在Redis中是⽤⼀个robj来表示的。

用来表示String的robj可能编码成3种内部表⽰：

OBJ\_ENCODING\_RAW 会创建一个 SDS空间 , 单独存储但是调用需要实现两次 ;

OBJ\_ENCODING\_EMBSTR 44字节以内

OBJ\_ENCODING\_INT。8个比特位什么数字都可以实现存储 ;   
其中前两种编码使⽤的是sds来存储，最后⼀种OBJ\_ENCODING\_INT编码直接把string存成了long型。  
在对string进行incr, decr等操作的时候，如果它内部是OBJ\_ENCODING\_INT编码，那么可以直接行加减操作；如果它内部是OBJ\_ENCODING\_RAW或OBJ\_ENCODING\_EMBSTR编码，那么Redis会先试图把sds存储的字符串转成long型，如果能转成功，再进行加减操作。对⼀个内部表示成long型的string执行append, setbit, getrange这些命令，针对的仍然是string的值（即⼗进制表示的字符串），而不是针对内部表⽰的long型进⾏操作。比如字符串”32”，如果按照字符数组来解释，它包含两个字符，它们的ASCII码分别是0x33和0x32。当我们执行命令setbit key 7 0的时候，相当于把字符0x33变成了0x32，这样字符串的值就变成了”22”。⽽如果将字符串”32”按照内部的64位long型来解释，那么它是0x0000000000000020，在这个基础上执⾏setbit位操作，结果就完全不对了。因此，在这些命令的实现中，会把long型先转成字符串再进行相应的操作。

### 1\.9 Redis数据结构\-List

Redis的List类型可以从首、尾操作列表中的元素：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653987240622\.png\] ![](</blogs/_assets/lakebook/2487fc18fbc1c58b3486f731.png>)

哪一个数据结构能满足上述特征？

- LinkedList ：普通链表，可以从双端访问，内存占用较高，内存碎片较多
- ZipList ：压缩列表，可以从双端访问，内存占用低，存储上限低
- QuickList：LinkedList \+ ZipList，可以从双端访问，内存占用较低，包含多个ZipList，存储上限高

Redis的List结构类似一个双端链表，可以从首、尾操作列表中的元素：

在3\.2版本之前，Redis采用ZipList和LinkedList来实现List，当元素数量小于512并且元素大小小于64字节时采用ZipList编码，超过则采用LinkedList编码。

在3\.2版本之后，Redis统一采用QuickList来实现List：

类型是list , 编码是 QuickList ;

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653987313461\.png\] ![](</blogs/_assets/lakebook/4b198e9690d311469ad948f7.png>)

![](</blogs/_assets/lakebook/24b2efccec94aa94eb310d66.png>)

### 2\.0 Redis数据结构\-Set结构

Set是Redis中的单列集合，满足下列特点：

- 不保证有序性
- 保证元素唯一
- 求交集、并集、差集

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653987342550\.png\] ![](</blogs/_assets/lakebook/0cf7c2e8897ea0759e533f94.png>)

可以看出，Set对查询元素的效率要求非常高，思考一下，什么样的数据结构可以满足？  
HashTable，也就是Redis中的Dict，不过Dict是双列集合（可以存键、值对） \-\-&gt; 使用Dict可以实现随机查找查询;

Set是Redis中的集合，不一定确保元素有序，可以满足元素唯一、查询效率要求极高。  
为了查询效率和唯一性，**set采用HT编码（Dict）。Dict中的key用来存储元素，value统一为null。**  
当存储的所有数据都是整数，并且元素数量不超过set\-max\-intset\-entries时，Set会采用IntSet编码，以节省内存

正数就会直接插入, 但还要实现检查, 判断为 非 int 类型 可以直接设置 一个key \- value但是 value为 null ,采用默认的 HT编码

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653987388177\.png\] ![](</blogs/_assets/lakebook/0b896e268b19ba450fc84884.png>)

结构如下：

![](</blogs/_assets/lakebook/8db223301b152c7036140e06.png>)

![](</blogs/_assets/lakebook/d5704b10e473063722590380.png>)

![](</blogs/_assets/lakebook/ae0d9e9eabc97bc819d280a1.png>)  \[原笔记图片附件缺失：\.\\原理篇\.assets\\1653987454403\.png\]

### 2\.1、Redis数据结构\-ZSET

此处实现补充一下使用 dict 的概念 :

#### Dict 的三个核心结构

<table class="ne-table" id="sEs7Y"><tbody><tr><td width="250"><p class="ne-p" id="u1fcaa2a2"><span class="ne-text">结构</span></p></td><td width="250"><p class="ne-p" id="u911990f8"><span class="ne-text">作用</span></p></td><td width="250"><p class="ne-p" id="u895245d7"><span class="ne-text">关键字段</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u8494e74c"><strong><span class="ne-text">dict</span></strong></p></td><td width="250"><p class="ne-p" id="u8833f96f"><span class="ne-text">字典整体</span></p></td><td width="250"><p class="ne-p" id="uf760ba94"><code class="ne-code"><span class="ne-text">ht[2]</span></code></p><p class="ne-p" id="u2763f427"><span class="ne-text"> </span><span class="ne-text">(两张哈希表),</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">rehashidx</span></code></p><p class="ne-p" id="u6445bd02"><span class="ne-text"> </span><span class="ne-text">(进度标记)</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u02848228"><strong><span class="ne-text">dictht</span></strong></p></td><td width="250"><p class="ne-p" id="ua45be5cf"><span class="ne-text">哈希表</span></p></td><td width="250"><p class="ne-p" id="ud497825b"><code class="ne-code"><span class="ne-text">table</span></code></p><p class="ne-p" id="u1d1aa919"><span class="ne-text"> </span><span class="ne-text">(桶数组),</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">size</span></code></p><p class="ne-p" id="ud8521ae5"><span class="ne-text"> </span><span class="ne-text">(桶数量，2^n),</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">sizemask</span></code></p><p class="ne-p" id="u3dc990aa"><span class="ne-text"> </span><span class="ne-text">(size-1),</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">used</span></code></p><p class="ne-p" id="uefeb714d"><span class="ne-text"> </span><span class="ne-text">(已有节点数)</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u915cc84f"><strong><span class="ne-text">dictEntry</span></strong></p></td><td width="250"><p class="ne-p" id="uc6bdfbc5"><span class="ne-text">哈希节点</span></p></td><td width="250"><p class="ne-p" id="ufc3f9e96"><code class="ne-code"><span class="ne-text">key</span></code></p><p class="ne-p" id="u933920d8"><span class="ne-text">,</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">v</span></code></p><p class="ne-p" id="u42cc532f"><span class="ne-text"> </span><span class="ne-text">(值，用 union 支持多种类型),</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">next</span></code></p><p class="ne-p" id="u2e10e325"><span class="ne-text"> </span><span class="ne-text">(链表指针)</span></p></td></tr></tbody></table>

**直接总结 :**

Redis 中 **ZSet 在元素较少时的底层实现** —— 使用 **ZipList** 来节省内存，并巧妙地借助 ZipList 的有序特性实现了按 score 排序。

#### Zset 的两种底层实现（重点记忆）

<table class="ne-table" id="CXAQp"><tbody><tr><td width="250"><p class="ne-p" id="ua8f77e44"><span class="ne-text">数据量 / 元素大小</span></p></td><td width="250"><p class="ne-p" id="u6b50dd05"><span class="ne-text">底层编码</span></p></td><td width="250"><p class="ne-p" id="uc1a91492"><span class="ne-text">数据结构</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u6c406c77"><strong><span class="ne-text">元素少 &amp;&amp; 元素小</span></strong></p></td><td width="250"><p class="ne-p" id="u40d0622c"><code class="ne-code"><span class="ne-text">ziplist</span></code></p><p class="ne-p" id="u7c04cca4"><span class="ne-text"> </span><span class="ne-text">(Redis 5.x 及之前) 或</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">listpack</span></code></p><p class="ne-p" id="u95d7f32f"><span class="ne-text"> </span><span class="ne-text">(Redis 7.0+)</span></p></td><td width="250"><p class="ne-p" id="u7ee3cc30"><span class="ne-text">压缩列表，内存紧凑</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u923d3995"><strong><span class="ne-text">元素多 或 元素大</span></strong></p></td><td width="250"><p class="ne-p" id="u6a66edce"><code class="ne-code"><span class="ne-text">skiplist</span></code></p><p class="ne-p" id="uec27dbae"><span class="ne-text"> + </span><code class="ne-code"><span class="ne-text">dict</span></code><span class="ne-text">--&gt; 使用的是 key - value 格式实现存储 ; </span></p></td><td width="250"><p class="ne-p" id="uaa098d22"><span class="ne-text">跳表（按 score 排序）+ 哈希表（按 member 查找）</span></p></td></tr></tbody></table>

注意：Redis 7\.0 后将 `ziplist` 替换为 `listpack`，解决了连锁更新问题，但**设计思想一致**。

#### ZipList 如何实现 ZSet 的存储与排序（你给出的关键点）

#### 1\. 存储方式

ZipList 本身没有“键值对”概念，但 ZSet 通过**连续两个 entry** 来表示一个元素：

- text\[member\_entry\] \[score\_entry\] \[member\_entry\] \[score\_entry\] \.\.\.

- `member`（元素值）在前，`score`（分数）在后。
- 这两个 entry 在内存中紧挨着。

#### 2\. 排序方式

- ZipList 本身是一个**顺序列表**，插入位置由程序控制。
- ZSet 在插入时，会**遍历 ZipList，找到第一个 score 大于新 score 的位置**，然后将新元素的 `member+score` 两个 entry 插入到该位置前面。
- 最终效果：**ZipList 中按照 score 值升序排列**（score 小的靠近表头，score 大的靠近表尾）。

#### 3\. 查询方式

- **根据 member 查 score**：需要遍历整个 ZipList，逐个比对 member entry，找到后再读取下一个 entry 获取 score。时间复杂度 O\(N\)。
- **根据 score 查 member**：同样需要遍历（但因为有顺序，可以提前结束）。

因此 ZipList 只适合**小数据量**场景，一旦元素变多，就会转为 SkipList\+Dict。

#### 为什么用 SkipList \+ Dict 组合？

<table class="ne-table" id="bBnl8"><tbody><tr><td width="250"><p class="ne-p" id="u078723d3"><span class="ne-text">需求</span></p></td><td width="250"><p class="ne-p" id="uec560f80"><span class="ne-text">使用的结构</span></p></td><td width="250"><p class="ne-p" id="ua8975cd8"><span class="ne-text">时间复杂度</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u9876ccf7"><span class="ne-text">按 score 排序 &amp; 范围查询</span></p></td><td width="250"><p class="ne-p" id="u4ee24e7e"><span class="ne-text">SkipList</span></p></td><td width="250"><p class="ne-p" id="ue485bdcc"><span class="ne-text">O(log N)</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uc5ff253f"><span class="ne-text">根据 member 查 score</span></p></td><td width="250"><p class="ne-p" id="ucaf9d7ff"><span class="ne-text">Dict (哈希表)</span></p></td><td width="250"><p class="ne-p" id="ua1b8f98b"><span class="ne-text">O(1)</span></p></td></tr></tbody></table>

两者**共享元素**，不额外拷贝数据，所以内存增加有限，但功能完美覆盖。

使用 ziplist 编码/ listpack 编码\(redis 7\.0 \+ \)

ZSet也就是SortedSet，其中每一个元素都需要指定一个score值和member值：

- 可以根据score值排序后
- member必须唯一
- 可以根据member查询分数

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653992091967\.png\] ![](</blogs/_assets/lakebook/a27a92f19d148e70c4a7ad87.png>)

因此，zset底层数据结构必须满足键值存储、键必须唯一、可排序这几个需求。之前学习的哪种编码结构可以满足？

- SkipList：可以排序，并且可以同时存储score和ele值（member）
- HT（Dict）：可以键值存储，并且可以根据key找value

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653992121692\.png\] ![](</blogs/_assets/lakebook/aa686b00312855e53b8ff4b0.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653992172526\.png\] ![](</blogs/_assets/lakebook/7e3c228f814c78ec7ceb7ee4.png>)

当元素数量不多时，HT和SkipList的优势不明显，而且更耗内存。因此zset还会采用ZipList结构来节省内存，不过需要同时满足两个条件：

- 元素数量小于zset\_max\_ziplist\_entries，默认值128
- 每个元素都小于zset\_max\_ziplist\_value字节，默认值64

ziplist本身没有排序功能，而且没有键值对的概念，因此需要有zset通过编码实现：

- ZipList是连续内存，因此score和element是紧挨在一起的两个entry， element在前，score在后
- score越小越接近队首，score越大越接近队尾，按照score值升序排列

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653992238097\.png\] ![](</blogs/_assets/lakebook/6bb7a2a45a3b94226d793d52.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653992299740\.png\] ![](</blogs/_assets/lakebook/91dbb70a6957b32c8f8e2a89.png>)

### 2\.2 、Redis数据结构\-Hash

#### 总结 :

### 底层编码（两种）

<table class="ne-table" id="e4SmL"><tbody><tr><td width="250"><p class="ne-p" id="ua112393b"><span class="ne-text">编码</span></p></td><td width="250"><p class="ne-p" id="ua1da29c9"><span class="ne-text">适用条件</span></p></td><td width="250"><p class="ne-p" id="ud0b41499"><span class="ne-text">存储形式</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u97f89909"><strong><span class="ne-text">ziplist</span></strong><span class="ne-text"> </span><span class="ne-text">(Redis 5.x) /</span><span class="ne-text"> </span><strong><span class="ne-text">listpack</span></strong><span class="ne-text"> </span><span class="ne-text">(Redis 7.0+)</span></p></td><td width="250"><p class="ne-p" id="u38c80870"><span class="ne-text">同时满足：</span><span class="ne-text"><br/></span><span class="ne-text">1. 元素个数 &lt;</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">hash-max-ziplist-entries</span></code></p><p class="ne-p" id="u2d1b354d"><span class="ne-text"> </span><span class="ne-text">(默认512)</span><span class="ne-text"><br/></span><span class="ne-text">2. 每个 field 和 value 长度 &lt;</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">hash-max-ziplist-value</span></code></p><p class="ne-p" id="ua928784c"><span class="ne-text"> </span><span class="ne-text">(默认64字节)</span></p></td><td width="250"><p class="ne-p" id="uceb81bc8"><span class="ne-text">连续内存，field 和 value 相邻存放：</span><code class="ne-code"><span class="ne-text">[field1][value1][field2][value2]...</span></code></p></td></tr><tr><td width="250"><p class="ne-p" id="u34c850a5"><strong><span class="ne-text">dict</span></strong><span class="ne-text"> </span><span class="ne-text">(哈希表)</span></p></td><td width="250"><p class="ne-p" id="u7a325549"><span class="ne-text">任一条件不满足（元素过多 或 有超大 field/value）</span></p></td><td width="250"><p class="ne-p" id="u16a5f7bb"><span class="ne-text">数组 + 链表，O(1) 查找</span></p></td></tr></tbody></table>

Redis 7\.0\+ 中参数名改为 `hash-max-listpack-entries` 和 `hash-max-listpack-value`，行为相同。

#### 常用命令

- `HSET key field value` – 设置 field 值
- `HGET key field` – 获取 field 值
- `HDEL key field` – 删除 field
- `HGETALL key` – 获取所有 field 和 value
- `HINCRBY key field increment` – 整数自增

---

#### 一句话总结

**Redis Hash 是小数据量时用 listpack/ziplist（内存紧凑），大数据量时自动转为 dict（哈希表）的键值对集合，支持对单个 field 的高效读写。**

Hash结构与Redis中的Zset非常类似：

- 都是键值存储
- 都需求根据键获取值
- field 必须唯一 , 但是 value 可以重复

区别如下：

- zset的键是member，值是score；hash的键和值都是任意值
- zset要根据score排序；hash则无需排序

（1）底层实现方式：压缩列表ziplist 或者 字典dict  
当Hash中数据项比较少的情况下，Hash底层才⽤压缩列表ziplist进⾏存储数据，随着数据的增加，底层的ziplist就可能会转成dict，具体配置如下：

hash\-max\-ziplist\-entries 512

hash\-max\-ziplist\-value 64

当满足上面两个条件其中之⼀的时候，Redis就使⽤dict字典来实现hash。  
Redis的hash之所以这样设计，是因为当ziplist变得很⼤的时候，它有如下几个缺点：

- 每次插⼊或修改引发的realloc操作会有更⼤的概率造成内存拷贝，从而降低性能。
- ⼀旦发生内存拷贝，内存拷贝的成本也相应增加，因为要拷贝更⼤的⼀块数据。
- 当ziplist数据项过多的时候，在它上⾯查找指定的数据项就会性能变得很低，因为ziplist上的查找需要进行遍历。

总之，ziplist本来就设计为各个数据项挨在⼀起组成连续的内存空间，这种结构并不擅长做修改操作。⼀旦数据发⽣改动，就会引发内存realloc，可能导致内存拷贝。

hash结构如下：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653992339937\.png\] ![](</blogs/_assets/lakebook/d1811e61eab334263f948451.png>)

zset集合如下：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653992360355\.png\] ![](</blogs/_assets/lakebook/d5fd97a00edb78f6983b530b.png>)

因此，Hash底层采用的编码与Zset也基本一致，只需要把排序有关的SkipList去掉即可：

Hash结构默认采用ZipList编码，用以节省内存。 ZipList中相邻的两个entry 分别保存field和value

当数据量较大时，Hash结构会转为HT编码，也就是Dict，触发条件有两个：

- ZipList中的元素数量超过了hash\-max\-ziplist\-entries（默认512）
- ZipList中的任意entry大小超过了hash\-max\-ziplist\-value（默认64字节）

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653992413406\.png\] ![](</blogs/_assets/lakebook/c0c18b7fbec9cdb75e03a227.png>)

## 2、原理篇\-Redis网络模型

### 2\.1 用户空间和内核态空间

服务器大多都采用Linux系统，这里我们以Linux为例来讲解:

ubuntu和Centos 都是Linux的发行版，发行版可以看成对linux包了一层壳，任何Linux发行版，其系统内核都是Linux。我们的应用都需要通过Linux内核与硬件交互

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653844970346\.png\] ![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1779181305867-a7aeef63-22e9-494f-923c-afcb4f260ff6.png>)

用户的应用，比如redis，mysql等其实是没有办法去执行访问我们操作系统的硬件的，所以我们可以通过发行版的这个壳子去访问内核，再通过内核去访问计算机硬件

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653845147190\.png\] ![](</blogs/_assets/lakebook/1ce70aff47472571ebb205c7.png>)

计算机硬件包括，如cpu，内存，网卡等等，内核（通过寻址空间）可以操作硬件的，但是内核需要不同设备的驱动，有了这些驱动之后，内核就可以去对计算机硬件去进行 内存管理，文件系统的管理，进程的管理等等

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653896065386\.png\] ![](</blogs/_assets/lakebook/97e9efb28f31e1cbd7167028.png>)

我们想要用户的应用来访问，计算机就必须要通过对外暴露的一些接口，才能访问到，从而简介的实现对内核的操控，但是内核本身上来说也是一个应用，所以他本身也需要一些内存，cpu等设备资源，用户应用本身也在消耗这些资源，如果不加任何限制，用户去操作随意的去操作我们的资源，就有可能导致一些冲突，甚至有可能导致我们的系统出现无法运行的问题，因此我们需要把用户和**内核隔离开**

进程的寻址空间划分成两部分：

**内核空间 用户空间**

什么是寻址空间呢？我们的应用程序也好，还是内核空间也好，都是没有办法直接去物理内存的，而是通过分配一些虚拟内存映射到物理内存中，我们的内核和应用程序去访问虚拟内存的时候，就需要一个虚拟地址，这个地址是一个无符号的整数，比如一个32位的操作系统，他的带宽就是32，他的虚拟地址就是2的32次方，也就是说他寻址的范围就是0\~2的32次方，

这片寻址空间对应的就是2的32个字节，就是4GB

这个4GB，会有3个GB分给用户空间，会有1GB给内核系统

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653896377259\.png\] ![](</blogs/_assets/lakebook/4956927af76a4b0f334b27f8.png>)

CPU 中划分为 R 0 \~ 3 , 风险由高到低

在linux中，他们权限分成两个等级，0和3

用户空间只能执行受限的命令（Ring3），而且不能直接调用系统资源

必须通过内核提供的接口来访问内核空间可以执行特权命令（Ring0），调用一切系统资源，所以一般情况下，用户的操作是运行在用户空间，而内核运行的数据是在内核空间的，而有的情况下，一个应用程序需要去调用一些特权资源，去调用一些内核空间的操作，所以此时他俩需要在用户态和内核态之间进行切换。

比如：

Linux系统为了提高IO效率，会在用户空间和内核空间都加入缓冲区：

写数据时，要把用户缓冲数据拷贝到内核缓冲区，然后写入设备

读数据时，要从设备读取数据到内核缓冲区，然后拷贝到用户缓冲区

针对这个操作：我们的用户在写读数据时，会去向内核态申请，想要读取内核的数据，而内核数据要去等待驱动程序从硬件上读取数据，当从磁盘上加载到数据之后，内核会将数据写入到内核的缓冲区中，然后再将数据拷贝到用户态的buffer中，然后再返回给应用程序，整体而言，速度慢，就是这个原因，为了加速，我们希望read也好，还是wait for data也最好都不要等待，或者时间尽量的短。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653896687354\.png\] ![](</blogs/_assets/lakebook/bb1d50cf196bb721dbf5f0fa.png>)

### 2\.2\.网络模型\-阻塞IO

在《UNIX网络编程》一书中，总结归纳了5种IO模型：

- 阻塞IO（Blocking IO）
- 非阻塞IO（Nonblocking IO）
- IO多路复用（IO Multiplexing）
- 信号驱动IO（Signal Driven IO）
- 异步IO（Asynchronous IO）

应用程序想要去读取数据，他是无法直接去读取磁盘数据的，他需要先到内核里边去等待内核操作硬件拿到数据，这个过程就是1，是需要等待的，等到内核从磁盘上把数据加载出来之后，再把这个数据写给用户的缓存区，这个过程是2，如果是阻塞IO，那么整个过程中，用户从发起读请求开始，一直到读取到数据，都是一个阻塞状态。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653897115346\.png\] ![](</blogs/_assets/lakebook/969ccb9716a96848c1c398cf.png>)

具体流程如下图：

用户去读取数据时，会去先发起recvform一个命令，去尝试从内核上加载数据，如果内核没有数据，那么用户就会等待，此时内核会去从硬件上读取数据，内核读取数据之后，会把数据拷贝到用户态，并且返回ok，整个过程，都是阻塞等待的，这就是阻塞IO

总结如下：

顾名思义，阻塞IO就是两个阶段都必须阻塞等待：

**阶段一：**

- 用户进程尝试读取数据（比如网卡数据）
- 此时数据尚未到达，内核需要等待数据
- 此时用户进程也处于阻塞状态

阶段二：

- 数据到达并拷贝到内核缓冲区，代表已就绪
- 将内核数据拷贝到用户缓冲区
- 拷贝过程中，用户进程依然阻塞等待
- 拷贝完成，用户进程解除阻塞，处理数据

可以看到，阻塞IO模型中，用户进程在两个阶段都是阻塞状态。

![](</blogs/_assets/lakebook/7517b6aefe484655413d6225.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653897270074\.png\]

### 2\.3 网络模型\-非阻塞IO

顾名思义，非阻塞IO的recvfrom操作会立即返回结果而不是阻塞用户进程。

阶段一：

- 用户进程尝试读取数据（比如网卡数据）
- 此时数据尚未到达，内核需要等待数据
- 返回异常给用户进程
- 用户进程拿到error后，再次尝试读取
- 循环往复，直到数据就绪

阶段二：

- 将内核数据拷贝到用户缓冲区
- 拷贝过程中，用户进程依然阻塞等待
- 拷贝完成，用户进程解除阻塞，处理数据
- 可以看到，非阻塞IO模型中，用户进程在第一个阶段是非阻塞，第二个阶段是阻塞状态。虽然是非阻塞，但性能并没有得到提高。而且忙等机制会导致CPU空转，CPU使用率暴增。

![](</blogs/_assets/lakebook/a4457b8c570bf8805d00b40a.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653897490116\.png\]

### 2\.4 网络模型\-IO多路复用

无论是阻塞IO还是非阻塞IO，用户应用在一阶段都需要调用recvfrom来获取数据，差别在于无数据时的处理方案：

如果调用recvfrom时，恰好没有数据，阻塞IO会使CPU阻塞，非阻塞IO使CPU空转，都不能充分发挥CPU的作用。  
如果调用recvfrom时，恰好有数据，则用户进程可以直接进入第二阶段，读取并处理数据

所以怎么看起来以上两种方式性能都不好

而在单线程情况下，只能依次处理IO事件，如果正在处理的IO事件恰好未就绪（数据不可读或不可写），线程就会被阻塞，所有IO事件都必须等待，性能自然会很差。

就比如服务员给顾客点餐，**分两步**：

- 顾客思考要吃什么（等待数据就绪）
- 顾客想好了，开始点餐（读取数据）

要提高效率有几种办法？

方案一：增加更多服务员（多线程）  
方案二：不排队，谁想好了吃什么（数据就绪了），服务员就给谁点餐（用户应用就去读取数据）

那么问题来了：用户进程如何知道内核中数据是否就绪呢？

所以接下来就需要详细的来解决多路复用模型是如何知道到底怎么知道内核数据是否就绪的问题了

这个问题的解决依赖于提出的

文件描述符（File Descriptor）：简称FD，是一个从0 开始的无符号整数，用来关联Linux中的一个文件。在Linux中，一切皆文件，例如常规文件、视频、硬件设备等，当然也包括网络套接字（Socket）。

通过FD，我们的网络模型可以利用一个线程监听多个FD，并在某个FD可读、可写时得到通知，从而避免无效的等待，充分利用CPU资源。

阶段一：

- 用户进程调用select，指定要监听的FD集合
- 核监听FD对应的多个socket
- 任意一个或多个socket数据就绪则返回readable
- 此过程中用户进程阻塞

阶段二：

- 接收到返回的数据readable后用户端反复返回recvfrom 调用资源
- 内核将数据拷贝到用户空间
- 用户进程处理数据

当用户去读取数据的时候，不再去直接调用recvfrom了，而是调用select的函数，select函数会将需要监听的数据交给内核，由内核去检查这些数据是否就绪了，如果说这个数据就绪了，就会通知应用程序数据就绪，然后来读取数据，再从内核中把数据拷贝给用户态，完成数据处理，如果N多个FD一个都没处理完，此时就进行等待。

用IO复用模式，可以确保去读数据的时候，数据是一定存在的，他的效率比原来的阻塞IO和非阻塞IO性能都要高

![](</blogs/_assets/lakebook/95fb99ddc1158f5acd072d34.png>)

IO多路复用是利用单个线程来同时监听多个FD，并在某个FD可读、可写时得到通知，从而避免无效的等待，充分利用CPU资源。不过监听FD的方式、通知的方式又有多种实现，常见的有：

- select
- poll \-\-&gt; select \+ poll 只能监测到有数据就绪但是监测不到是什么数据就绪 , 只能自己循环遍历
- epoll

其中select和pool相当于是当被监听的数据准备好之后，他会把你监听的FD整个数据都发给你，你需要到整个FD中去找，哪些是处理好了的，需要通过遍历的方式，所以性能也并不是那么好

而epoll，则相当于内核准备好了之后，他会把准备好的数据，直接发给你，咱们就省去了遍历的动作。

### 2\.5 网络模型\-IO多路复用\-select方式

**用户态维护一个 fd 集合（大小受限）**

**通过** `select` **系统调用把整个集合拷贝到内核；**

**内核遍历所有 fd**

**若无就绪则进程休眠，有就绪时唤醒内核并再次遍历设置就绪标志**

**然后将整个集合拷贝回用户态；用户态需要再次遍历集合才能找出哪些 fd 已就绪。**

select是Linux最早是由的I/O多路复用技术：

简单说，就是我们把需要处理的数据封装成FD，然后在用户态时创建一个fd的集合（这个集合的大小是要监听的那个FD的最大值\+1，但是大小整体是有限制的 ），这个集合的长度大小是有限制的，同时在这个集合中，标明出来我们要控制哪些数据，

比如要监听的数据，是1,2,5三个数据，此时会执行select函数，然后将整个fd发给内核态，内核态会去遍历用户态传递过来的数据，如果发现这里边都数据都没有就绪，就休眠，直到有数据准备好时，就会被唤醒，唤醒之后，再次遍历一遍，看看谁准备好了，然后再将处理掉没有准备好的数据，最后再将这个FD集合写回到用户态中去，此时用户态就知道了，奥，有人准备好了，但是对于用户态而言，并不知道谁处理好了，所以用户态也需要去进行遍历，然后找到对应准备好数据的节点，再去发起读请求，我们会发现，这种模式下他虽然比阻塞IO和非阻塞IO好，但是依然有些麻烦的事情， 比如说频繁的传递fd集合，频繁的去遍历FD等问题

执行一次 select \-&gt; 需要实现两次拷贝 : 用户空间 \-\-&gt; 内核空间 , 内部使用FD就绪后返回用户空间 ;

![](</blogs/_assets/lakebook/5793700774da49a9c254be50.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653900022580\.png\] ![](</blogs/_assets/lakebook/713e0fda006874e7e8819c34.png>)

### 2\.6 网络模型\-IO多路复用模型\-poll模式

**用户态创建** `pollfd` **数组（长度可自定义），**

**通过** `poll` **系统调用将整个数组拷贝到内核；内核将数组转为链表（无上限遍历），对所有 fd 进行遍历检查就绪状态；**

**若无就绪则进程休眠，有就绪或超时时，**

**内核将结果写回** `pollfd` **数组（通过** `revents` **字段标记），再将数组拷贝回用户态；**

**用户态遍历数组，检查** `revents` **找到就绪的 fd 并进行处理。**

你问到了关键点上：`poll` **并没有实现“直接定位”到就绪的 fd**，它和 `select` 一样，仍然需要**用户态遍历整个数组**才能找出就绪的 fd。

poll模式对select模式做了简单改进，但性能提升不明显，部分关键代码如下：

IO流程：

- 创建pollfd数组，向其中添加关注的fd信息，数组大小自定义
- 调用poll函数，将pollfd数组拷贝到内核空间，转链表存储，无上限
- 内核遍历fd，判断是否就绪
- 数据就绪或超时后，拷贝pollfd数组到用户空间，返回就绪fd数量n
- 用户进程判断 n 是否大于0,大于0则遍历pollfd数组，找到就绪的fd

**与select对比：**

- select模式中的 fd\_set 大小固定为1024，而pollfd在内核中采用链表，理论上无上限
- 监听FD越多，每次遍历消耗时间也越久，性能反而会下降

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653900721427\.png\] ![](</blogs/_assets/lakebook/9c4d4a528de0d14b80e33b32.png>)

### 2\.7 网络模型\-IO多路复用模型\-epoll函数

## `epoll` 如何解决 `select`/`poll` 的问题

<table class="ne-table" id="PVFsV"><tbody><tr><td width="250"><p class="ne-p" id="u072683b1"><span class="ne-text">问题</span></p></td><td width="250"><p class="ne-p" id="u4ccca679"><code class="ne-code"><span class="ne-text">select</span></code></p><p class="ne-p" id="ud74ba287"><span class="ne-text">/</span><code class="ne-code"><span class="ne-text">poll</span></code></p></td><td width="250"><p class="ne-p" id="uface6e30"><code class="ne-code"><span class="ne-text">epoll</span></code></p><p class="ne-p" id="u09402393"><span class="ne-text"> </span><span class="ne-text">的解法</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u09af3993"><strong><span class="ne-text">1. 监听 FD 数量上限</span></strong></p></td><td width="250"><p class="ne-p" id="u2181ed31"><span class="ne-text">有限（1024）或依赖数组大小</span></p></td><td width="250"><p class="ne-p" id="uc5f601ee"><span class="ne-text">红黑树存储，</span><strong><span class="ne-text">理论上无上限</span></strong><span class="ne-text">（受系统内存限制）</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ub55199a6"><strong><span class="ne-text">2. 每次调用都拷贝 FD 集合</span></strong></p></td><td width="250"><p class="ne-p" id="ud6ffb1e9"><span class="ne-text">每次</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">select</span></code></p><p class="ne-p" id="uafd467c2"><span class="ne-text">/</span><code class="ne-code"><span class="ne-text">poll</span></code></p><p class="ne-p" id="u9c22fd8c"><span class="ne-text"> </span><span class="ne-text">都要把全部 FD 拷到内核</span></p></td><td width="250"><p class="ne-p" id="ufdc3ce2d"><code class="ne-code"><span class="ne-text">epoll_ctl</span></code></p><p class="ne-p" id="u29d08977"><span class="ne-text"> </span><strong><span class="ne-text">一次添加</span></strong><span class="ne-text">，后续</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">epoll_wait</span></code></p><p class="ne-p" id="ua2a0b712"><span class="ne-text"> </span><strong><span class="ne-text">无需重复拷贝</span></strong></p></td></tr><tr><td width="250"><p class="ne-p" id="ue8bef5ad"><strong><span class="ne-text">3. 需要遍历所有 FD 判断就绪</span></strong></p></td><td width="250"><p class="ne-p" id="ud0a4db2e"><span class="ne-text">内核和用户态都要 O(n) 遍历</span></p><p class="ne-p" id="u36a206a5"><span class="ne-text">select --&gt; 调用 select 命令实现直接标清楚调用位置 ,  poll是实现内部的标记 1/0 实现</span></p></td><td width="250"><p class="ne-p" id="ud54d1a88"><span class="ne-text">内核通过</span><strong><span class="ne-text">回调</span></strong><span class="ne-text">将就绪 FD 主动加入就绪链表，</span><code class="ne-code"><span class="ne-text">epoll_wait</span></code></p><p class="ne-p" id="u1fa9e3d2"><span class="ne-text"> </span><span class="ne-text">直接返回就绪列表，</span><strong><span class="ne-text">无需遍历所有 FD</span></strong></p></td></tr></tbody></table>

epoll模式是对select和poll的改进，它提供了三个函数：

第一个是：eventpoll的函数，他内部包含两个东西

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1779243088406-f963184b-f777-490d-9df4-053813e54435.png>)

一个是：

1、红黑树\-&gt; 记录的事要监听的FD

2、一个是链表\-&gt;一个链表，记录的是就绪的FD

紧接着调用epoll\_ctl操作，将要监听的数据添加到红黑树上去，并且给每个fd设置一个监听函数，这个函数会在fd数据就绪时触发，就是准备好了，现在就把fd把数据添加到list\_head中去

3、调用epoll\_wait函数

就去等待，在用户态创建一个空的events数组，当就绪之后，我们的回调函数会把数据添加到list\_head中去，当调用这个函数的时候，会去检查list\_head，当然这个过程需要参考配置的等待时间，可以等一定时间，也可以一直等， 如果在此过程中，检查到了list\_head中有数据会将数据添加到链表中，此时将数据放入到events数组中，并且返回对应的操作的数量，用户态的此时收到响应后，从events中拿到对应准备好的数据的节点，再去调用方法去拿数据。

小总结：

select模式存在的三个问题：

- 能监听的FD最大不超过1024
- 每次select都需要把所有要监听的FD都拷贝到内核空间
- 每次都要遍历所有FD来判断就绪状态

poll模式的问题：

- poll利用链表解决了select中监听FD上限的问题，但依然要遍历所有FD，如果监听较多，性能会下降

epoll模式中如何解决这些问题的？

- 基于epoll实例中的红黑树保存要监听的FD，理论上无上限，而且增删改查效率都非常高
- 每个FD只需要执行一次epoll\_ctl添加到红黑树，以后每次epol\_wait无需传递任何参数，无需重复拷贝FD到内核空间
- 利用ep\_poll\_callback机制来监听FD状态，无需遍历所有FD，因此性能不会随监听的FD数量增多而下降

### 2\.8、网络模型\-epoll中的ET和LT

你的问题核心是：**ET 和 LT 是同时运作，还是指定其中一个运作？**

答案是：**一次只能指定一种模式运作**，它们互斥，不能同时生效。

- **默认模式**：当你使用 `epoll_ctl` 添加一个 FD 时，如果不加任何标志，就是 **LT（水平触发）**。

**启用 ET**：需要在 `events` 标志位中加上 `EPOLLET`，例如：

- c

```text
struct epoll_event ev;
ev.events = EPOLLIN | EPOLLET;  // 启用边沿触发
ev.data.fd = fd;
epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &ev);
```

- **两者不可共存**：同一个 FD 在 epoll 实例中要么是 LT，要么是 ET，没有“既 LT 又 ET”的模式。因为 ET 是 LT 的“升级版”，只是触发逻辑不同。
- **大多数通用网络库（如 libevent、Nginx 默认）使用 LT**：编程简单，不容易出错。
- **高性能场景（如 Redis、某些自定义网关）使用 ET**：减少 `epoll_wait` 返回次数，但必须配合非阻塞 I/O 和循环读取直到 `EAGAIN`。

<table class="ne-table" id="q7vTR"><tbody><tr><td width="187"><p class="ne-p" id="u5e092896"><span class="ne-text">模式</span></p></td><td width="187"><p class="ne-p" id="uee9f2a81"><span class="ne-text">第③步（第一次epoll_wait）</span></p></td><td width="187"><p class="ne-p" id="u294a958b"><span class="ne-text">第④步（读取1kb后，还剩1kb）</span></p></td><td width="187"><p class="ne-p" id="u44ecd9ec"><span class="ne-text">第⑤步（再次epoll_wait）</span></p></td></tr><tr><td width="187"><p class="ne-p" id="ubc2d15e4"><strong><span class="ne-text">LT</span></strong></p></td><td width="187"><p class="ne-p" id="uf3aab494"><span class="ne-text">得到通知（FD有数据）</span></p></td><td width="187"><p class="ne-p" id="u14d42ff9"><span class="ne-text">还剩1kb</span></p></td><td width="187"><p class="ne-p" id="u5fc32d4f"><strong><span class="ne-text">仍会立即返回通知</span></strong><span class="ne-text">（因为数据仍在）</span></p></td></tr><tr><td width="187"><p class="ne-p" id="u4cc5c92c"><strong><span class="ne-text">ET</span></strong></p></td><td width="187"><p class="ne-p" id="u23ecf68c"><span class="ne-text">得到通知（FD从无→有，状态变化）</span></p></td><td width="187"><p class="ne-p" id="u272daaba"><span class="ne-text">还剩1kb</span></p></td><td width="187"><p class="ne-p" id="uec801b7b"><strong><span class="ne-text">不会返回通知</span></strong><span class="ne-text">（状态无变化，仍是有数据状态，但无新边沿）</span></p></td></tr></tbody></table>

当FD有数据可读时，我们调用epoll\_wait（或者select、poll）可以得到通知。但是事件通知的模式有两种：

- LevelTriggered：简称LT，也叫做水平触发。只要某个FD中有数据可读，每次调用epoll\_wait都会得到通知。
- EdgeTriggered：简称ET，也叫做边沿触发。只有在某个FD有状态变化时，调用epoll\_wait才会被通知。

举个栗子：

- 假设一个客户端socket对应的FD已经注册到了epoll实例中
- 客户端socket发送了2kb的数据
- 服务端调用epoll\_wait，得到通知说FD就绪
- 服务端从FD读取了1kb数据回到步骤3（再次调用epoll\_wait，形成循环）

结论

如果我们采用LT模式，因为FD中仍有1kb数据，则第⑤步依然会返回结果，并且得到通知  
如果我们采用ET模式，因为第③步已经消费了FD可读事件，第⑤步FD状态没有变化，因此epoll\_wait不会返回，数据无法读取，客户端响应超时。

### 2\.9 网络模型\-基于epoll的服务器端流程

我们来梳理一下这张图

服务器启动以后，服务端会去调用epoll\_create，创建一个epoll实例，epoll实例中包含两个数据

1、红黑树（为空）：rb\_root 用来去记录需要被监听的FD

2、链表（为空）：list\_head，用来存放已经就绪的FD

创建好了之后，会去调用epoll\_ctl函数，此函数会会将需要监听的数据添加到rb\_root中去，并且对当前这些存在于红黑树的节点设置回调函数，当这些被监听的数据一旦准备完成，就会被调用，而调用的结果就是将红黑树的fd添加到list\_head中去\(但是此时并没有完成\)

3、当第二步完成后，就会调用epoll\_wait函数

这个函数会去校验是否有数据准备完毕（因为数据一旦准备就绪，就会被回调函数添加到list\_head中）

在等待了一段时间后\(可以进行配置\)

如果等够了超时时间，则返回没有数据，如果有，则进一步判断当前是什么事件，如果是建立连接时间，

则调用accept\(\) 接受客户端socket，拿到建立连接的socket，然后建立起来连接，如果是其他事件，则把数据进行写出

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653902845082\.png\]

### 3\.0 、网络模型\-信号驱动

信号驱动IO是与内核建立SIGIO的信号关联并设置回调，当内核有FD就绪时，会发出SIGIO信号通知用户，期间用户应用可以执行其它业务，无需阻塞等待。

阶段一：

- 用户进程调用sigaction，注册信号处理函数
- 内核返回成功，开始监听FD
- 用户进程不阻塞等待，可以执行其它业务
- 当内核数据就绪后，回调用户进程的SIGIO处理函数

阶段二：

- 收到SIGIO回调信号
- 调用recvfrom，读取
- 内核将数据拷贝到用户空间
- 用户进程处理数据

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653911776583\.png\] ![](</blogs/_assets/lakebook/465002112d4e519adb645d58.png>)

当有大量IO操作时，信号较多，SIGIO处理函数不能及时处理可能导致信号队列溢出，而且内核空间与用户空间的频繁信号交互性能也较低。

#### 3\.0\.1 异步IO

这种方式，不仅仅是用户态在试图读取数据后，不阻塞，而且当内核的数据准备完成后，也不会阻塞

他会由内核将所有数据处理完成后，由内核将数据写入到用户态中，然后才算完成，所以性能极高，不会有任何阻塞，全部都由内核完成，可以看到，异步IO模型中，用户进程在两个阶段都是非阻塞状态。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653911877542\.png\] ![](</blogs/_assets/lakebook/c7f59b7334fbf48559e8911c.png>)

#### 3\.0\.2 对比

最后用一幅图，来说明他们之间的区别

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653912219712\.png\] ![](</blogs/_assets/lakebook/4ba5963cfb4da7e3aaa0e3d5.png>)

### 3\.1 、网络模型\-Redis是单线程的吗？为什么使用单线程

**Redis到底是单线程还是多线程？**

- 如果仅仅聊Redis的核心业务部分（命令处理），答案是单线程
- 如果是聊整个Redis，那么答案就是多线程

在Redis版本迭代过程中，在两个重要的时间节点上引入了多线程的支持：

- Redis v4\.0：引入多线程异步处理一些耗时较旧的任务，例如异步删除命令\(BigKey\)unlink
- Redis v6\.0：**在核心网络模型中引入 多线程，进一步提高对于多核CPU的利用率**

因此，对于Redis的核心网络模型，在Redis 6\.0之前确实都是单线程。是利用epoll（Linux系统）这样的**IO多路复用**技术在事件循环中不断处理客户端情况。

**为什么Redis要选择单线程？**

**为啥快\-\-&gt; 都是内存操作 ,快的没法**

- 抛开持久化不谈，Redis是纯 内存操作，执行速度非常快，它的性能瓶颈是 网络延迟 而不是 执行速度，因此多线程并不会带来巨大的性能提升。
- 多线程会导致过多的上下文切换，带来不必要的开销
- 引入多线程会面临线程安全问题，必然要引入线程锁这样的安全手段，实现复杂度增高，而且性能也会大打折扣

### 3\.2 、Redis的单线程模型\-Redis单线程和多线程网络模型变更

epoll\-create 创建 一个红黑树\( 未处理FD事件 \) \+ 链表实现 保存已经处理后的 FD 事件 ; ![](</blogs/_assets/lakebook/2ec2a702f5021e2bf6e0d30f.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653982278727\.png\] ![](</blogs/_assets/lakebook/26d1a9879234ea0486d6860f.png>)

当我们的客户端想要去连接我们服务器，会去先到IO多路复用模型去进行排队，会有一个连接应答处理器，他会去接受读请求，然后又把读请求注册到具体模型中去，此时这些建立起来的连接，如果是客户端请求处理器去进行执行命令时，他会去把数据读取出来，然后把数据放入到client中， clinet去解析当前的命令转化为redis认识的命令，接下来就开始处理这些命令，从redis中的command中找到这些命令，然后就真正的去操作对应的数据了，当数据操作完成后，会去找到命令回复处理器，再由他将数据写出。

## 3、Redis通信协议\-RESP协议

Redis是一个CS架构的软件，通信一般分两步（不包括pipeline和PubSub）：

客户端（client）向服务端（server）发送一条命令

服务端解析并执行命令，返回响应结果给客户端

因此客户端发送命令的格式、服务端响应结果的格式必须有一个规范，这个规范就是通信协议。

而在Redis中采用的是RESP（Redis Serialization Protocol）协议：

Redis 1\.2版本引入了RESP协议

Redis 2\.0版本中成为与Redis服务端通信的标准，称为RESP2

Redis 6\.0版本中，从RESP2升级到了RESP3协议，增加了更多数据类型并且支持6\.0的新特性\-\-客户端缓存

但目前，默认使用的依然是RESP2协议，也是我们要学习的协议版本（以下简称RESP）。

在RESP中，通过首字节的字符来区分不同数据类型，常用的数据类型包括5种：

单行字符串：首字节是 ‘\+’ ，后面跟上单行字符串，以CRLF（ "\\r\\n" ）结尾。例如返回"OK"： "\+OK\\r\\n"

错误（Errors）：首字节是 ‘\-’ ，与单行字符串格式一样，只是字符串是异常信息，例如："\-Error message\\r\\n"

数值：首字节是 ‘:’ ，后面跟上数字格式的字符串，以CRLF结尾。例如：":10\\r\\n"

多行字符串：首字节是 ‘\$’ ，表示二进制安全的字符串，最大支持512MB：

如果大小为0，则代表空字符串："\$0\\r\\n\\r\\n"

如果大小为\-1，则代表不存在："\$\-1\\r\\n"

数组：首字节是 ‘\*’，后面跟上数组元素个数，再跟上元素，元素数据类型不限:

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653982993020\.png\] ![](</blogs/_assets/lakebook/e365daaed471d25ecd15679e.png>)

### 3\.1、Redis通信协议\-基于Socket自定义Redis的客户端

Redis支持TCP通信，因此我们可以使用Socket来模拟客户端，与Redis服务端建立连接：

```java
public class Main {

    static Socket s;
    static PrintWriter writer;
    static BufferedReader reader;

    public static void main(String[] args) {
        try {
            // 1.建立连接
            String host = "192.168.150.101";
            int port = 6379;
            s = new Socket(host, port);
            // 2.获取输出流、输入流
            writer = new PrintWriter(new OutputStreamWriter(s.getOutputStream(), StandardCharsets.UTF_8));
            reader = new BufferedReader(new InputStreamReader(s.getInputStream(), StandardCharsets.UTF_8));

            // 3.发出请求
            // 3.1.获取授权 auth 123321
            sendRequest("auth", "123321");
            Object obj = handleResponse();
            System.out.println("obj = " + obj);

            // 3.2.set name 虎哥
            sendRequest("set", "name", "虎哥");
            // 4.解析响应
            obj = handleResponse();
            System.out.println("obj = " + obj);

            // 3.2.set name 虎哥
            sendRequest("get", "name");
            // 4.解析响应
            obj = handleResponse();
            System.out.println("obj = " + obj);

            // 3.2.set name 虎哥
            sendRequest("mget", "name", "num", "msg");
            // 4.解析响应
            obj = handleResponse();
            System.out.println("obj = " + obj);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            // 5.释放连接
            try {
                if (reader != null) reader.close();
                if (writer != null) writer.close();
                if (s != null) s.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    private static Object handleResponse() throws IOException {
        // 读取首字节
        int prefix = reader.read();
        // 判断数据类型标示
        switch (prefix) {
            case '+': // 单行字符串，直接读一行
                return reader.readLine();
            case '-': // 异常，也读一行
                throw new RuntimeException(reader.readLine());
            case ':': // 数字
                return Long.parseLong(reader.readLine());
            case '$': // 多行字符串
                // 先读长度
                int len = Integer.parseInt(reader.readLine());
                if (len == -1) {
                    return null;
                }
                if (len == 0) {
                    return "";
                }
                // 再读数据,读len个字节。我们假设没有特殊字符，所以读一行（简化）
                return reader.readLine();
            case '*':
                return readBulkString();
            default:
                throw new RuntimeException("错误的数据格式！");
        }
    }

    private static Object readBulkString() throws IOException {
        // 获取数组大小
        int len = Integer.parseInt(reader.readLine());
        if (len <= 0) {
            return null;
        }
        // 定义集合，接收多个元素
        List<Object> list = new ArrayList<>(len);
        // 遍历，依次读取每个元素
        for (int i = 0; i < len; i++) {
            list.add(handleResponse());
        }
        return list;
    }

    // set name 虎哥
    private static void sendRequest(String ... args) {
        writer.println("*" + args.length);
        for (String arg : args) {
            writer.println("$" + arg.getBytes(StandardCharsets.UTF_8).length);
            writer.println(arg);
        }
        writer.flush();
    }
}

```

### 3\.2、Redis内存回收\-过期key处理

Redis之所以性能强，最主要的原因就是基于内存存储。然而单节点的Redis其内存大小不宜过大，会影响持久化或主从同步性能。  
我们可以通过修改配置文件来设置Redis的最大内存：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653983341150\.png\] ![](</blogs/_assets/lakebook/aa29370fac9446778884d318.png>)

当内存使用达到上限时，就无法存储更多数据了。为了解决这个问题，Redis提供了一些策略实现内存回收：

内存过期策略

在学习Redis缓存的时候我们说过，可以通过expire命令给Redis的key设置TTL（存活时间）：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653983366243\.png\] ![](</blogs/_assets/lakebook/865eb72eb09bf7ae112ca1e9.png>)

可以发现，当key的TTL到期以后，再次访问name返回的是nil，说明这个key已经不存在了，对应的内存也得到释放。从而起到内存回收的目的。

Redis本身是一个典型的key\-value内存存储数据库，因此所有的key、value都保存在之前学习过的Dict结构中。不过在其database结构体中，有两个Dict：一个用来记录key\-value；另一个用来记录key\-TTL。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653983423128\.png\] ![](</blogs/_assets/lakebook/26f8a92bb9e1042767aa0c25.png>)

![](</blogs/_assets/lakebook/1edf554fcfc6a3dd218eb682.png>)

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653983606531\.png\]

这里有两个问题需要我们思考：  
Redis是如何知道一个key是否过期呢？

利用两个Dict分别记录key\-value对及key\-ttl对

是不是TTL到期就立即删除了呢？

**惰性删除**

惰性删除：顾明思议并不是在TTL到期后就立刻删除，而是在访问一个key的时候，检查该key的存活时间，如果已经过期才执行删除。

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653983652865\.png\] ![](</blogs/_assets/lakebook/4c6bbe26f6fac2989aa9f6c2.png>)

**周期删除**

周期删除：顾明思议是通过一个定时任务，周期性的抽样部分过期的key，然后执行删除。执行周期有两种：  
Redis服务初始化函数initServer\(\)中设置定时任务，按照server\.hz的频率来执行过期key清理，模式为SLOW  
Redis的每个事件循环前会调用beforeSleep\(\)函数，执行过期key清理，模式为FAST

周期删除：顾明思议是通过一个定时任务，周期性的抽样部分过期的key，然后执行删除。执行周期有两种：  
Redis服务初始化函数initServer\(\)中设置定时任务，按照server\.hz的频率来执行过期key清理，模式为SLOW  
Redis的每个事件循环前会调用beforeSleep\(\)函数，执行过期key清理，模式为FAST

SLOW模式规则：

- 执行频率受server\.hz影响，默认为10，即每秒执行10次，每个执行周期100ms。
- 执行清理耗时不超过一次执行周期的25%\.默认slow模式耗时不超过25ms
- 逐个遍历db，逐个遍历db中的bucket，抽取20个key判断是否过期
- 如果没达到时间上限（25ms）并且过期key比例大于10%，再进行一次抽样，否则结束
- FAST模式规则（过期key比例小于10%不执行 ）：
- 执行频率受beforeSleep\(\)调用频率影响，但两次FAST模式间隔不低于2ms
- 执行清理耗时不超过1ms
- 逐个遍历db，逐个遍历db中的bucket，抽取20个key判断是否过期  
  如果没达到时间上限（1ms）并且过期key比例大于10%，再进行一次抽样，否则结束

小总结：

RedisKey的TTL记录方式：

在RedisDB中通过一个Dict记录每个Key的TTL时间

过期key的删除策略：

惰性清理：每次查找key时判断是否过期，如果过期则删除

定期清理：定期抽样部分key，判断是否过期，如果过期则删除。  
定期清理的两种模式：

SLOW模式执行频率默认为10，每次不超过25ms

FAST模式执行频率不固定，但两次间隔不低于2ms，每次耗时不超过1ms

### 3\.3 Redis内存回收\-内存淘汰策略

内存淘汰：就是当Redis内存使用达到设置的上限时，主动挑选部分key删除以释放更多内存的流程。Redis会在处理客户端命令的方法processCommand\(\)中尝试做内存淘汰：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653983978671\.png\] ![](</blogs/_assets/lakebook/841df137e8cde0d3dcd795d3.png>)

淘汰策略

Redis支持8种不同策略来选择要删除的key：

- noeviction： 不淘汰任何key，但是内存满时不允许写入新数据，默认就是这种策略。
- volatile\-ttl： 对设置了TTL的key，比较key的剩余TTL值，TTL越小越先被淘汰
- allkeys\-random：对全体key ，随机进行淘汰。也就是直接从db\-&gt;dict中随机挑选
- volatile\-random：对设置了TTL的key ，随机进行淘汰。也就是从db\-&gt;expires中随机挑选。
- allkeys\-lru： 对全体key，基于LRU算法进行淘汰
- volatile\-lru： 对设置了TTL的key，基于LRU算法进行淘汰
- allkeys\-lfu： 对全体key，基于LFU算法进行淘汰
- volatile\-lfu： 对设置了TTL的key，基于LFI算法进行淘汰  
  比较容易混淆的有两个：

- LRU（Least Recently Used），最少最近使用。用当前时间减去最后一次访问时间，这个值越大则淘汰优先级越高。
- LFU（Least Frequently Used），最少频率使用。会统计每个key的访问频率，值越小淘汰优先级越高。

Redis的数据都会被封装为RedisObject结构：

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653984029506\.png\] ![](</blogs/_assets/lakebook/d4caf160be0c56fc73976ffd.png>)

LFU的访问次数之所以叫做逻辑访问次数，是因为并不是每次key被访问都计数，而是通过运算：

- 生成0\~1之间的随机数R
- 计算 \(旧次数 \* lfu\_log\_factor \+ 1\)，记录为P
- 如果 R &lt; P ，则计数器 \+ 1，且最大不超过255
- 访问次数会随时间衰减，距离上一次访问时间每隔 lfu\_decay\_time 分钟，计数器 \-1

最后用一副图来描述当前的这个流程吧

\[原笔记图片附件缺失：\.\\原理篇\.assets\\1653984085095\.png\] ![](</blogs/_assets/lakebook/56969a78edfce1434d3d0646.png>)

## 4、结束语

亲爱的小伙伴们，我们的redis到这里就结束了，希望小伙伴们好好学习，找到一份满意的工作！传智为你加油。
