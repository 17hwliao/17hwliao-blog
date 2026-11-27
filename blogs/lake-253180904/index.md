- 栈和队列

接口之间的继承关系 : Deque&lt;T&gt;\( 双端队列 \) \-&gt; Queue&lt;T&gt;\( 队列 \) \-&gt; Collection&lt;T&gt; \-&gt; Iterable&lt;T&gt; \( 实现迭代器的创建方法的接口 \) \{ 子类 \-&gt; 父类 \}

1. LinkedList实现的接口 :

List&lt;T&gt;

Deque&lt;T&gt;

Cloneable

java\.io\.Serializable ;

2. ArrayList实现的接口 :

List&lt;T&gt;

RandomAccess

Cloneable

java\.io\.Serializable ;

数组 和 栈的具体实现 : LinkedList创建

接口中实现的队列操作 :

boolean add\( T t \) 尾插\( LIst也是尾插 \) , 插入失败会抛出异常 ;

boolean offer 添加 , 但插入失败不会抛出异常

T remove\(\) 实现移除 队首元素 : 队列为空 , 抛出异常 ;

T poll\(\) : 移除队首元素 , 队列为空 , return null ;

T elements\(\) ; 获取队首元素 ; 队列为空时抛出异常 ;

T peek\(\) 获取队首元素 , 队列为空 , return null ;

- 双端队列Deque :

队首插 : addFrist\(T t \) ;

队尾插 : addLast\(T t \) ;

offer替换add实现即可 ;

队首移除 : T removeFrist\(\) ;

队尾移除 : T removeLast\(\) ;

poll 替换 remove即可 ;

get \+ Frist / Last 实现在双端队列的前后获取数值 ;

peek替换get即可 ;

新增方法 : Boolean类型 :

removeFristOccurrence\(T t \)实现删除第一个出现的指定元素 ;

removeLastOccurrence\( T t \)实现删除最后一次出现的指定元素 ;

可以实现 栈 的push\(\) , pop\(\) 操作 ;

生成反向迭代器单向迭代 , 后 \-&gt; 前遍历 : Iterator&lt;T&gt; descendingIterator\( \); 基本没有区别 , while实现迭代的条件也不会发生改变 ;

优先级队列 :

Queue&lt;Integer&gt;queue \= new PriorityQueue&lt;&gt;\(\(i1 , i2 \)\-&gt; i2 \- i1\) ; 自定义实现出队的先后顺序 ;

queue\.offer\(\) ;

queue\.offer\(\) ;

- Set集合

Set集合基本就是直接从Collection继承来的方法 \( List , queue , deque \), 但对方法有更加特殊的定义 ; 不会维护顺序

内部方法全为继承

自动实现去重 ; Set&lt;String&gt; set \= new HashSet&lt;&gt;\(\) ;

HashSet&lt;&gt;\(\) 方法是使用哈希表进行实现 : 不支持随机访问 , 按数据的哈希值进行存储实现 ;

发生哈希冲突 , 使用链表形式 拼接;

在实现add , remove都是直接将元素本身传入进行操作 ;

输出: 直接输出set即可 ;

实现在Set中实现维持顺序 : 会自动维护

使用 LinkedHashSet ;

底层不再是哈希map, 而是 Linked 哈希 Map

可以借用链表实现记忆传值的顺序 ;

但本质还是哈希 , 就是不可以实现下标访问 ;

- TreeSet: 在元素插入时进行排序 ;

可以自己定义排序顺序 , 本身的排序是按照数字的大小来排序 ;

Set&lt;Integer&gt; set \= new TreeSet&lt;&gt;\(\(i1 ,i2 \) \-&gt; i2 \-i1\) ;

set\.add\( 数字 \) ;

可以实现按序
