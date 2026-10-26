Java实现数组顺序表:

```text
ArrayList<String> list = new ArrayList<>();   //内部实现的链表
list.add(0 , "A");          //add( 插入位置 , 数据 )
list.addFirst("B");
list.addLast("C");
list.contains( Object ) //Boolean型,判断是否包含元素
toArray() 转化为Object型数组
System.out.println(list);    //打印出来带[ ]
```

```text
package Today.Study.Study;

import java.util.ArrayList;

public class SequentialList<T> {
    private int size = 0 ;   //顺序表大小

    private int len = 100 ;         //限制大小

    private Object[] array = new Object[len] ;  
    //增添元素
    public void add(T element , int pos){
        if(pos < 0 || pos > len)
            throw new IndexOutOfBoundsException("超出数组范围" + size);   //抛出异常
        //超出容量限制时设置扩容操作
        if(size >= len){
            int Len = len + (len >> 1 ) ;    //扩容1.5 倍
            Object[] newArray = new Object[Len] ;
            System.arraycopy(array, 0, newArray, 0, len);
            array = newArray ;      //JVM的回收机制 , 无需担心
            len = Len ;
        }
        for( int i = size ; i > pos ; i--)
                array[i] = array[i-1] ;
            array[pos] = element ;
            size++ ;
    }
    @SuppressWarnings("unchecked")     //抑制编译器产生的未检查警告 , 已知有安全问题选择忽视
    //删除元素 , 返回被删除元素
    public T remove(int pos){
        if(pos < 0 || pos > len)
            throw new IndexOutOfBoundsException("ws是gay") ;
        T result = (T)array[pos] ;
        for(int i = pos ; i < size ; i++ )
            array[i] = array[i+1] ;
        size -- ;
        return result ;
    }
    方法重写 ( Object中的该函数 )
    @Override
    public String toString(){
        StringBuilder builder = new StringBuilder();
        for(int i = 0 ; i < size ; i++) builder.append(array[i]).append(" ");
        return builder.toString();
    }
}
```

Java实现链表 :

```text
List<String> list2 = new LinkedList<>() ;
list2.add(2 , "A");  //实现的尾插
list2.remove("B");
```

add尾插的内部实现 :

void Linklast\( T t \)\{

final Node&lt;T&gt; l \= last ;

final Node&lt;T&gt; newcode \= new Node&lt;&gt;\(前指 , 赋值 , 后指\( null \)\)

last \= newcode ;

判断是否为空 l \= null 头指针指向 first \= newcode ; //节点为空时让节点为first 不为空直接 l\.next \= newcode ;

\}

```text
package Today.Study.Study;

import java.util.ArrayList;
public class LinkList<T> {
    private Node<T> head = new Node<T>(null) ;

    private int size = 0 ;

    public void add(T element , int pos){
        if(pos < 0 || pos > size)
            throw new IndexOutOfBoundsException("ws+gay") ;
        Node<T> prev = head ;
        for(int i = 0 ; i < pos ; i ++ )
            prev = prev.next ;
        Node<T> node = new Node<>(element) ;
        node.next = prev.next ;
        prev.next = node ;
    }
    public T remove(int pos){
        if(pos < 0 || pos > size)
            throw new IndexOutOfBoundsException("ws") ;
        Node<T> prev = head ;
        for(int i = 0 ; i < pos ; i ++ )
            prev = prev.next ;
        T t = prev.next.element;
        prev.next = prev.next.next;  //JVM自动回收机制魅力时刻
        return t ; 
    }

    private static class Node<T> {      //节点类
       T element ;                      //节点储存元素
       Node<T> next;                    //下一个节点的索引
       Node(T element) {
           this.element = element;
       }
   }
}
```

Java实现栈 : 使用单链表实现 , push , pop , isEmpty操作方法都需要自己实现

Java实现队列 : 使用单链表实现 , push,pop,front ,back 方法需要手动实现

其他数据结构后期补
