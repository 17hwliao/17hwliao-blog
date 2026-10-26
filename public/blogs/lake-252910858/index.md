```text
package Today;

import java.util.*;
import java.util.function.UnaryOperator;

public class Main {
    public static void main(String[] args) {
       List<String> list1 = new ArrayList<>(Arrays.asList("ws0" ,"==0","gay0")) ;
       List<String> list2 = new LinkedList<>(Arrays.asList("ws1", "==1","gay1") ) ;
       list1.addAll(1 , list2) ;
       String[] string =  list1.toArray(new String[0]);    // //将 list1 转化为类型数组
       String[] strings = list1.toArray(String[]::new);    //方法引用和上面一个样
        list1.sort(new Comparator<String>() {
            @Override
            public int compare(String o1, String o2) {
                return o1.compareTo(o2);
            }
        }) ;
        list1.sort((o1 , o2) -> o2.compareTo(o1));  //通过交换o1 , o2 实现改变排序思路
        list1.removeIf(str -> str.contains("a")) ; //contains() 就是用来 检查一个集合里是否包含某个元素。
        //Java的 Lambda表达式 会自动推导类型, str就相当于传入的参数
        list1.replaceAll(new UnaryOperator<String>() {     //实现对每个元素进行操作
            @Override
            public String apply(String s) {
                return "" ;
            }
        });
        list1.replaceAll(str -> str+":");
        System.out.println(Arrays.toString(strings));
        System.out.println(list1);
        System.out.println(list1.contains("gay"));
        System.out.println(list1.indexOf("gay"));  //查找元素出现首次下标 , 未出现输出-1 ;
    }
}
```

```text
package Today;

import javax.swing.*;
import java.util.*;

public class Main{

    public static void main(String[] args) {
        List <String>list = Arrays.asList("A","B","C","D","E","F","G","H","I");
        for (String s : list) {
            System.out.println(s);
        }
        Iterator<String> iterator = list.iterator();   //获取到迭代器
        while(iterator.hasNext()){
            String next = iterator.next();
            System.out.println(next);
            iterator.remove();
        }
        list.forEach(System.out::println);
        ListIterator<String> iterator1 = list.listIterator();
        while(iterator1.hasNext()){         //正着来
            int i = iterator1.nextIndex() ;
            String next = iterator1.next() ;
        }
        while(iterator1.hasPrevious()){     //反着来
            int i = iterator1.previousIndex() ;
            String next = iterator1.previous() ;
            System.out.println(next);

        }

    }

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

}
```
