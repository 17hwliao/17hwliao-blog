设置最大的数 : 0x3f3f3f3f

lambda 表达式 : \(a , b\) \-&gt; \{return a \- b \} ; 具体排序规则见下表中汇总 ; \\

总结 : 负数 \+ 0 为假 , 不会换位置 , 正数 为真, 会实现换位 ;

C\+\+ 中对数组自定义排序 ;

```text
sort(arr.begin(), arr.end(), [](const vector<int>& x, const vector<int>& y) {
        // 第一优先级：第一个元素降序
        if (x[0] != y[0]) {
            return x[0] > y[0];  // 降序：大的在前
        }
        // 第二优先级：第二个元素升序
        if (x[1] != y[1]) {
            return x[1] < y[1];  // 升序：小的在前
        }
        // 第三优先级：第三个元素降序
        return x[2] > y[2];  // 降序：大的在前
    });
```

### 2\. **返回值规则**

<table class="ne-table" id="IEUAU"><tbody><tr><td width="250"><p class="ne-p" id="u44a25ace"><span class="ne-text">返回值</span></p></td><td width="250"><p class="ne-p" id="ubecc3575"><span class="ne-text">含义</span></p></td><td width="250"><p class="ne-p" id="u0007ab17"><span class="ne-text">结果</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uf806715e"><strong><span class="ne-text">负数</span></strong><span class="ne-text"> </span><span class="ne-text">(&lt; 0)</span></p></td><td width="250"><p class="ne-p" id="u27815d2b"><span class="ne-text">a 应该排在 b 前面</span></p></td><td width="250"><p class="ne-p" id="ud83c9fa9"><span class="ne-text">保持 a, b 顺序</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uc2d422c4"><strong><span class="ne-text">0</span></strong></p></td><td width="250"><p class="ne-p" id="ufa00cf85"><span class="ne-text">a 和 b 相等</span></p></td><td width="250"><p class="ne-p" id="u05ed23bf"><span class="ne-text">顺序不变</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uf1b4014a"><strong><span class="ne-text">正数</span></strong><span class="ne-text"> </span><span class="ne-text">(&gt; 0)</span></p></td><td width="250"><p class="ne-p" id="u9242c535"><span class="ne-text">a 应该排在 b 后面</span></p></td><td width="250"><p class="ne-p" id="u1a7d176b"><span class="ne-text">交换 a, b 顺序</span></p></td></tr></tbody></table>

```text
for (Map.Entry<String, Integer> entry : map.entrySet()) {
            if (entry.getValue() < 3) {
                entry.setValue(entry.getValue() * 10);  // 直接修改
            }
        }
```

listIterator\(\) 双向迭代器支持增删改查 操作;

建议使用迭代器 : // 后面转lambda 表达式 :

直接使用lambda 表达式 : list\.removeIf\(item \-&gt; item\.equals\("B"\)\);

```text
Integer<String> it = list.iterator() ; 
while (it.hasNext()){
    String item = it.next();
    if(item.equals("A")){
        it.remove() ; 
    }
}
```

可以直接使用for\(var it : list\) 实现直接遍历容器 , 但不能实现修改list 操作 : 增删查改等

while\( T \-\-&gt; 0\) 先执行 1 \. 判断 T \=\= 0 ; 2 \. 然后 T \-\- ; 类似C\+\+ 中while\( T\-\- \)

Arrays\.asList\(\{数组\} , 普通数组\) ;

面对需要取mod的情况时候 , 需要使用Math\.toIntExact\(\) 约束 , 防止超出限制,防止报错

```text
// 确保结果能安全转回int，否则抛出异常
long temp = (res * i) % Origin.mod;
res = Math.toIntExact(temp);  // 如果temp超出int范围，抛出ArithmeticException
```

调用HashMap 需要头文件HashMap\(实现类\) , Map\( 实现接口 , 实现put, get , Entry&lt;&gt;接口 //使用Set类型存储\) ,

一个文件可以有多个class ,但只能有一个public class, 必须与文件名一致 ;

```text
class Origin{
    public static long mod = 1000000007L;
}
```

会占空间 ArrayList&lt;String&gt; list \= new ArrayList&lt;&gt;\(\); 创建动态数组 ;

\.indexof\(\) \=\= \.find\(\) ; \.add\(\) ;

储存数值 : &lt;\= 1e7

```text
Arrays  →  Array + s      → 处理数组
Collections → Collection + s  → 处理所有集合
```

数组输出Arrays\.toString ;

String 获取下标调用 \.charAt\( \) ;

int\[\]\[\] matrix \= new int\[3\]\[4\];

max \= Math\.max\(max, num\);

return new int\[\]\{1, 2, 3\};

```text
return new int[][]{
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };
```

int index \= Arrays\.binarySearch\(arr, target\); \=\= lower\_bound \(\) ;

Arrays\.binarySearch 支持数组 , 找到返回下标 , 未找到返回 \- \(插入点\) \- 1 ; \( Math\.abs\(\) \- 1 \)

\.get\(0 获取数值O\(1\) ;

char\[\] arr \= str\.toCharArray\(\); string \-&gt; char\[\] ;

String s \= new String\(arr\) ;

set\.contains\(c\) ; \( n &lt; 2 \) \( return bool\)

Map&lt;Integer,Integer&gt; map \= new HashMap&lt;&gt;\(\) ; //使用map存储 键值对 ,底层实现 数组\(下标访问\) , 链表 , 红黑树 \(这俩都是解决哈希冲突 \) ;

使用containKey\( int a \) 实现O\(1\) 的查询 ;

Set&lt;Map\.Entry&lt;String, Integer&gt;&gt; entries \= map\.entrySet\(\); 实现获取键值对

Map\.Entry\(\)//内部接口 ; 键值对的内部构造方法 ; 需要返回set\(\) ; 类型 , 需要使用entrySet转化格式实现接口对用

```text
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    // 处理 entry   //getvalue() ; / getkey() ; 
}
```

Integer missing \= map\.get\("grape"\); 直接调用\.get\(\) 方法直接获取键对应的值即可 ;
