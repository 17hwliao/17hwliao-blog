- 集合根接口 :

其他具体实现放十六天的不同集合中去了

1. boolean containsAll\( Collection&lt;?&gt; c \) ; //判断所给是否为子集

实际使用 : List1\.containsAll\(List2\)

2. default boolean removeIf\( Predicate&lt;? super T&gt; filter \) //按条件删除元素

boolean changed \= numbers\.removeIf\(n \-&gt; n % 2 \=\= 0\); //删除队内偶数

3. clear\( Collection&lt;?&gt; c \) //清除当前集合中的全部元素

4. boolean equals\( Object c \) //比较是否元素相等

int hashcode\(\) //不同集合中求hashcode的方法也不同

5. boolean\` addAll\(int pos , collection&lt;? extends T&gt;c \) 在指定位置插入指定集合的全部元素 : 底层迭代器实现

6. boolean containsAll\( Collection&lt;?&gt;c \)在尾部添加该列表的全部元素

7. default void replaceAll\( UNaryOperator&lt;T&gt; operator \) //对所有元素执行所给操作

8. default void sort\( Comparator &lt;? super T&gt;c \) //基础排序

9. get\( int pos \) //得到pos位置的数 , set\(int pos\) //设置pos位置的元素

10. 独特的搜索函数 : int indexof\( Object o\) 查询该元素在当前列表第一次出现下标 int lastIndexOf\( Object o \) 查询该元素在当前列表中的最后一次出现

11. List&lt;T&gt;subList\( int fromIndex , int toIndex \)返回当前集合在指定范围内的子集

12. 内部实现的ArrayList内部实现的add等方法 , 内部都会调用grow扩容方法 ; 底层 : private Object\[\] grow\( int mincapacity \)

列表内部空间大小 不为0时 , 按照当前长度 , 最小\( 传入 \)和推荐\( 当前大小的0\.5倍 \)长度三参数实现扩容操作 为0时, 初始化大小为max\(mincapacity , 10 \) 内部参数固定为10

扩容的辅助方法 : newlength\( int oldLength , int minGrowth , int prefGrowth \) 比较minGrowth和 prefGrowth得出新的长度 max\(,,,\) \+ old

超出 : return hugeLength\(int oldLenfth m int minGrowth\) 三种判断

&lt;0 超出int最大值 \|\| &lt;\= 最大长度范围 ,len \= 最大长度 \|\| 位于最大长度和int 范围之间的直接返回/抛出异常

\|\| 不加参数 , 重载调用的是容量\+1 , 操作

- List列表 \( 线性表 \)

在定义集合类时直接 List&lt;类型&gt; 名 \= new 需要实现的数据结构类型&lt;&gt;\(\) ;

接口定义 , 可以使用全部方法 , 方便之后转化类型

创建顺序表 : ArrayList&lt;&gt;\(\) ; LinkedList&lt;&gt;\(\) ;

实现创建列表 \+ 初始化为已知数组 : List&lt;类型&gt; 名\= Array\.asList\(\) ; 直接传多个元素 , 引用类型都是 OK 的

- Java迭代器

内部指针指向的是原数组中的元素的顺序不会变 ;

for\(var it : list\)\{\}

在编译后转化为 Iterator var2 \= list\.i terator\(\) ;

while\( var2\.hasNext\(\) \)\{ String s \= \(String\)var2\.next\(\) \} ;

集合类都支持 foreach 语句 :

Iterator 内部定义的方法 : boolean hasNext\(\) ;先判断才向后迭代

T next\(\) ; 遍历当前的元素 ;

迭代器名\.remove 移除上一个被遍历元素 ;

注意迭代器是一次性用品;

局部变量是不可放置在lambda方法中的 , 这里也不可以放置

转化为静态变量可实现 \+\+ ;

list\.forEach\(lambda语句\) : 内部实现依然是迭代器 \-&gt; for\(T t : this\) \-&gt; iterator 迭代器while循环实现 常见一般为输出语句 \-&gt; 可以转化为方法引用 ; \( 局部变量不可以输入 \)

- 最底层\( 低过Object \)的接口Iterable :

内部装载的是 Iterator 迭代器的创建方法 :

通过借Iterable提供迭代器生成方法, 只要实现类, 就可以调用foreach语法 :

```text
static class Test implements Iterable<String>{
    @Override
    public Iterator<String> iterator() {
        return new Iterator<String>(){   //生成匿名的Iterator对象
            @Override
            public boolean hasNext() {
                return true ;
            }
            @Override
            public String next(){
                return "gay" ;
            }
        } ;
    }
}
```

**ListIterator** 看作是 **Iterator** 版增强版 : 列表专用的

<table class="ne-table" id="B8QIQ"><tbody><tr><td width="250"></td><td width="250"><p class="ne-p" id="ufd12a55c"><span class="ne-text">属性</span></p></td><td width="250"><p class="ne-p" id="u10a36616"><span class="ne-text">Iterator</span></p></td><td width="250"><p class="ne-p" id="ufe9a4af7"><span class="ne-text">ListIterator</span></p></td></tr><tr><td width="250"></td><td width="250"><p class="ne-p" id="uf3b27333"><strong><span class="ne-text">遍历方向</span></strong></p></td><td width="250"><p class="ne-p" id="ucd4009fa"><span class="ne-text">只能向前（单向）</span></p></td><td width="250"><p class="ne-p" id="u183dd1e6"><span class="ne-text">双向（向前和向后）</span></p></td></tr><tr><td width="250"></td><td width="250"><p class="ne-p" id="udb50944d"><strong><span class="ne-text">获取索引</span></strong></p></td><td width="250"><p class="ne-p" id="u3e362895"><span class="ne-text">❌</span><span class="ne-text"> 不支持</span></p></td><td width="250"><p class="ne-p" id="u4472d1f5"><span class="ne-text">✅</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">nextIndex()</span></code></p><p class="ne-p" id="ue1e81111"><span class="ne-text">、</span><code class="ne-code"><span class="ne-text">previousIndex()</span></code></p></td></tr><tr><td width="250"></td><td width="250"><p class="ne-p" id="ud2024104"><strong><span class="ne-text">修改元素</span></strong></p></td><td width="250"><p class="ne-p" id="uaa5a49ff"><span class="ne-text">❌</span><span class="ne-text"> 不支持</span></p></td><td width="250"><p class="ne-p" id="u476208e0"><span class="ne-text">✅</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">set(E e)</span></code></p><p class="ne-p" id="u772a37ff"><span class="ne-text"> </span><span class="ne-text">替换当前元素</span></p></td></tr><tr><td width="250"></td><td width="250"><p class="ne-p" id="u8d52d2f0"><strong><span class="ne-text">添加元素</span></strong></p></td><td width="250"><p class="ne-p" id="u8e0a8ad8"><span class="ne-text">❌</span><span class="ne-text"> 不支持</span></p></td><td width="250"><p class="ne-p" id="u0cd37b98"><span class="ne-text">✅</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">add(E e)</span></code></p><p class="ne-p" id="u031215c1"><span class="ne-text"> </span><span class="ne-text">添加元素</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ub2c405ca"><span class="ne-text"> </span></p></td><td width="250"><p class="ne-p" id="uda2b3125"><strong><span class="ne-text">前一个元素</span></strong></p></td><td width="250"><p class="ne-p" id="ub16617ea"><span class="ne-text">❌</span><span class="ne-text"> 不支持</span></p></td><td width="250"><p class="ne-p" id="u8fefd841"><span class="ne-text">✅</span><span class="ne-text"> </span><code class="ne-code"><span class="ne-text">previous()</span></code></p><p class="ne-p" id="u7412d862"><span class="ne-text">、</span><code class="ne-code"><span class="ne-text">hasPrevious()</span></code></p></td></tr><tr><td width="250"></td><td width="250"><p class="ne-p" id="uf0c1eee5"><strong><span class="ne-text">适用范围</span></strong></p></td><td width="250"><p class="ne-p" id="ue0b485af"><span class="ne-text">所有Collection</span></p></td><td width="250"><p class="ne-p" id="u724023e4"><span class="ne-text">仅List及其子类</span></p></td></tr></tbody></table>

LisrtIterator&lt;String&gt; listIterator \= list\.listIterator\(\) ;

相当于创建了一个list的迭代器 :

可以实现动态加法 ; listIterator\.add\(" "\) ,每执行一次操作执行一次add操作 ;

实现向前迭代 :\( 使用的是ListIterator 创建迭代器\)

iterator\.hasPrevious\(\) \[ while条件 \]

String next \= iterator\.previous\(\) ; 向前迭代取值 ;

\`
