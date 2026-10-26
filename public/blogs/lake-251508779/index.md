- 泛型类 \( 类型参数 \)

Object : 1\. 需要强制类型转化 ; 2 \. 需要具体场景传参

```text
public class New_class<T  ( S , M ) > {
    String name ;
    int date ;
    T value ;
    New_class(String name , int date , T vlaue){
        this.name = name;
        this.date = date;
        this.value = vlaue;
    } ;
}
在Main中代码
创建泛型类 New_class<String> ws0 = new New_class<>("ws", 1, "是gay"); <> 可以实现自己推导 ,对象不可省 , 类可省 
String name = ws0.value ;  ( 无需类型转化 )
```

实现编写代码时就可以明确类型

但在类的内部方法中 T型参数仍然会被当作 Object 类型去处理 , 形参无法实现实例化

New\_class&lt;?&gt; ws2 \= ws1 ;

使用 ? 通配符 : 可以支持任意类型的泛型 , 类型不确定仍会被当作Object类

仍然需要强制类型转化

Test&lt;?&gt; test \= new Test&lt;类型&gt;\(\) ; 实行转化为不同中的泛型类

创建方法是也可以创建未知类型的

基本类型不可以写入泛型类中 , 但数组可以 \( 引用类型 \) New\_class&lt;int\[ \]&gt;

T : 甚至可以写为另外的一个类

- 支持泛型修改 , 泛型在多态下的表现 : 多态 : 实行 方法重写 , 继承 , 向上转型

```text
abstract class New<T> {  //抽象类
    T name ;
}

interface New1<T> {     //接口
    T study(T name) ;
}

record Date<T>(T data){} ;   //记录类
```

```text
static class Test implements New1<String>{
    @Override
    public String study(String n) {
        return "";
    }
```

```text
static class Test1<T> implements New1<T>{
    @Override
    public T study(T name) {
        return null;
    }
}
```
