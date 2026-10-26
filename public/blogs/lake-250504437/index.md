- 内部类

在类里创建类 ：内部类 ;

内部类也可以含有成员变量和方法

```text
Test s = new Test(); 
Test.Inner inner = new Test() / s.new Inner() ;
```

内部类可以设置访问权限控制 \( 方法和成员变量 \)

成员内部类可以访问到外部变量\( 外面无法访问内部 \) ;

- 静态内部类 :

在之前的内部类前加static 即可 ;

```text
Test s = new Test("ws1");
Test.Inner inner = new Test.Inner("wss1") ;
```

只能访问外部的静态属性 , 不可能访问到外部的方法 ;

- 局部内部类

```text
class Inner{
    void text(){
        System.out.println("ws是gay");
    }
}

Inner inner0 = new Inner() ; 
inner.text("ws00");
```

- 匿名内部类

```text
Person p = new Person(){   //最常见的写法
    public void study(){} ; 
} ;
```

必须创建为public类的方法 : 方法重写不能更严格

匿名内部类中也是可以实现创建属性 :

但是创建方法在外部不会被调用 ;

但可以内部创建方法 实现辅助 抽象方法的实现 ;

### **十分重要 \!\!\!**

### Lambda 表达式 : 只限制在只有一个待实现方法的接口

在使用 lambda创建 函数式接口 , 在别的类中调用这个抽象接口时 , 区分不同的\(抽象\)接口 , 不是通过声明调用的接口名, 只用一种识别的方式 : **通过的是 原接口函数中的传参类型实现区分 ;**

**一个文件接入多个传参类型 相似 的抽象接口 后 , 实现区分调用 不同接口函数的方法 :**

**传参类型相同 , 但都是抽象函数 可不可以 ? : 不行 , 签名无法实现判定 ;**

### **再在这里引入下方法引用的理解 :**

**方法引用是通过函数式接口的抽象方法签名来推断参数的 ;**

**参数从目标类型获得;**

```text
Lambda 表达式的类型推断依赖目标类型的函数描述符（参数类型 + 返回类型）。
当两个不同的函数式接口具有完全相同的函数描述符时，
在需要推断的上下文中（如方法重载、var 变量）会产生歧义，导致编译错误。
```

1 \. 使用类型转换（强制指定）

```text
// 强制转换为特定接口类型
process((Calculator)(a, b) -> a + b);   // ✅ 明确指定
process((Processor)(a, b) -> a + b);    // ✅ 明确指定
```

2 \. 先赋值给变量

```text
Calculator calc = (a, b) -> a + b;
Processor proc = (a, b) -> a + b;

process(calc);  // ✅ 明确调用 process(Calculator)
process(proc);  // ✅ 明确调用 process(Processor)
```

```text
//正常实现接口方法 <要求仅需一个抽象方法>
Study study = new Study(){
    public void study() {
        System.out.println("ws是gay");
    }
} ;
study.study();
//使用lambda表达式实行
  Study study = (变量名)-> {   //无需声明变量类型
  System.out.println("ws是gay" + 变量名) ;  //变量名要保持一致 
  } ;
        study.study();
```

```text
test((a) ->{
        System.out.println("ws"+ a + "是gay");
    } ) ;
}

private static void test(Study s){
    s.study(123) ;
}
```

基本格式 : \(参数列表\) \-&gt; \{ 方法体 \} : 这一坨就代表一种方法（接口中待实现的方法）；

- 方法引用

```text
Add ws2 = Integer:: sum ;
System.out.println(ws2.add(1,2));
```

```text
Add ws1 = (a , b ) -> a + b  ;
System.out.println(ws1.add(1,2));
```

静态方法实现　：类名 :: 方法名 的形式

```text
Fulei ws22 = new Fulei("卢姥爷");
Study ss =  ws22::Lulao;
System.out.println(ss.study());
```

注意在实现方法引用的时候后面无\(\) ;

构造方法 :

String str \= new String\(\) ;

接口 变量名 \= 类名:: new ; 这里的new写法是统一的构造写法

```text
haoa a = String::length;
String ws111 = "得得得得得得得得得" ;
System.out.println(a.haoa(ws111));
```
