```java
package Today;

public class New_Class<T>{

String name ;

int date ;

T ws ;

New_Class(String name , int date, T ws){

this.name = name ;

this.date = date;

this.ws = ws;

System.out.println(name + date + ws);

}

}

package Today;

import java.lang.reflect.Array;

import java.util.Arrays;

import java.util.Comparator;

public class Today{

public static void main(String[] args) {

New_Class<String> ws1 = new New_Class<>("ws0" , 1 , "是gay") ;

Integer s = test(21) ;

Integer[] arr = {1 , 2 ,4 ,5 ,4 , 3 ,12 } ;

Arrays.sort(arr , new Comparator<Integer>(){

public int compare(Integer o1 , Integer o2){

return o2 - o1 ;

}

}) ;

Integer[] brr = Arrays.copyOf(arr , 3) ;

System.out.println(Arrays.toString(arr)) ;

Today.<String>name() ;

String str = name() ;

Integer ws2 = test(12) ;

Tree tree = new Tree() ;

System.out.println(tree.study(",ws真的是gay"));

Tec<Integer> tec = new Tec<>(12);

}

private static <T extends Number> T test(T t ){

return t ;

}

private static <T> T name(){

return null ;

}

interface Study<T>{

T study(T t ) ;

}

static class Tree implements Study<String>{

public String study(String str){

return "ws是gay"+str ;

}

}

static class Tec<T>{

T name ;

public Tec(T name){

this.name = name ;

}

}

}

package Today;

public class Ws000<T extends Number> {

String name ;

int date ;

T ws ;

public Ws000(String name, int date , T ws) {

this.name = name;

this.date = date;

this.ws = ws ;

}

}
```
