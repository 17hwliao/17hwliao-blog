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

```text
package Today.Study.Study;

import java.util.ArrayList;

public class SequentialList<T> {
    private int size = 0 ;   //顺序表大小

    private int len = 100 ;

    private Object[] array = new Object[len] ;

    public void add(T element , int pos){
        if(pos < 0 || pos > len)
            throw new IndexOutOfBoundsException("超出数组范围" + size);
        if(size >= len){
            int Len = len + (len >> 1 ) ;    //扩容1.5 倍
            Object[] newArray = new Object[Len] ;
            System.arraycopy(array, 0, newArray, 0, len);
            array = newArray ;
            len = Len ;
        }
        for( int i = size ; i > pos ; i--)
                array[i] = array[i-1] ;
            array[pos] = element ;
            size++ ;
    }
    @SuppressWarnings("unchecked")
    public T remove(int pos){
        if(pos < 0 || pos > len)
            throw new IndexOutOfBoundsException("ws是gay") ;
        T result = (T)array[pos] ;
        for(int i = pos ; i < size ; i++ )
            array[i] = array[i+1] ;
        size -- ;
        return result ;
    }
    @Override
    public String toString(){
        StringBuilder builder = new StringBuilder();
        for(int i = 0 ; i < size ; i++) builder.append(array[i]).append(" ");
        return builder.toString();
    }
}
```

```text
package Today.Study;

import Today.Study.Study.SequentialList;

import java.util.ArrayList;

public class Main {

    public static void main(String[] args) {
        SequentialList<String> list = new SequentialList<>();
        list.add("WS" , 0) ;
        list.add("是gay", 0 ) ;
        System.out.println(list.toString());
    }

}
```
