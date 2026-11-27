### 1\. Object 是所有类的父类 : 超类

`public Object object` 是一个**公有的 Object 类型成员变量声明**

object \= new Object\(\); 设计一个Object 对象 , 可以实现调用object内部所有函数

设计函数传入类型为Object obj 可以在调用函数的时候传入任意数据

- 深浅拷贝 :

浅拷贝 : 只会基础 复制值传给拷贝对象 , 对引用型 只会传递对象地址 , 实际还是原来的对象;

深拷贝 : 无论是引用还是基本类型 , 会将引用类型中的全部内容拷贝为一个新的对象 , 包含成员变量

clone 拷贝方法 : 在主方法调用时需要在方法后加上 throws CloneNotSupportedException

clone重写 : return super clone\(\) ; 后要加上接口 : 直接加上 Cloneable

拷贝出的对象 与 原对象 指向一个地址 : java 中的拷贝实现浅拷贝

注意 :

1. **对象是新对象** ✓（内存地址不同）
2. **基本类型字段**：复制的是**值**（不是地址）
3. **引用类型字段**：复制的是**引用地址**（指向同一个对象）

### 2\. \( Java8后 \)**接口中的默认方法 :**

在接口中实现默认方法 : 默认方法接口 和 父类中的方法会冲突\( 会优先调用父类中的方法 \) ;

```text
default void  study(){
    System.out.println("默认实现");
}
```

可以实现静态变量\( 实则为常量 \) , 静态方法 : static\( 系统会自己补 \) int a \= 10 ; \( 加final 或者 static 都是多余的 \)

- \(java9后 \)接口条件继续放宽　:

允许private方法 : 只能内部使用 , 让其他内部的 public 和 static , default 使用

- 枚举类 \( 基础类 \)

创建一个enum 枚举类 ;

类中属性必须全部大写 : \[ 静态常量 \]

将类中的需要限制变量定义为枚举类型 , 传入数据 和 返回值 都要限制为枚举类型

添加限制 , 实现控制输入合法性 : 传入对应方法的值只能为 枚举类 变量名 \= 枚举类\.属性名 ;

直接状态 : s\.setName\(system\.STUDY\);

已知状态的字符串获取关联词 : s\.setName\(system\.valueOf\("STUDY"\)\);

可以内部创建方法 :

```text
public enum system {
    SLEEP("dingyi"), RUNNING("sau") , STUDY ("hui") ;  //后面加上对应字段实现调用状态时写出对应状态的描述

    String name ;    //内部创建参数

    system(String name){     //构造枚举变量 : 实现关联词命名
        this.name = name;
    }

    public String getName(){
        return name ;
    }
}
```

```text
Student s = new Student() ;
s.setName(system.SLEEP);  得到枚举变量
System.out.println(s.getName().getName());   第一个返回枚举变量, 第二个调用枚举类的函数进行输出
System.out.println(system.STUDY.getName()); 和上面类似获取状态关联词
```

- 记录类型 : 实现记录一些不可变数据的类

创建一个记录类 : 会自动编译出public get , equals , toString等方法 ;

```text
public record Dingdan(int id , String product , String adress) {
}
```

```text
Dingdan m = new Dingdan(1 , "chabaidao" , "xinan") ;
```

这时候直接sout\(m\) 后者 sout\(m\.属性名\) 输出 : Dingdan\[id\=1, product\=chabaidao, adress\=xinan\]

可以在记录类中实现重写方法 : equals 或者其他方法\( 设计传入类型为Object obj \)

无法内部设计方法修改 传入的id名\( final \)

- \( Java17 \) 密封类

添加 final 关键词实现 防继承 ; \( 太激进 \)

添加 sealed 关键字 , 表示密封类 类名后添加 permits 允许记录的子类

sealed 和 final 无法共存

必须要有子类继承

子类必须要标记为final , sealed 同父类 继续继承下去 或是 non\-sealed \( 允许所有人继承 ; \)类型

```text
[访问修饰符] [sealed/non-sealed/final] class 类名 
[extends 父类] [implements 接口...] 
[permits 子类...] {
    // 类体
}
```

**当第一个子类声明为** `sealed` **时，第二个子类继承的是第一个子类，而不是原始父类。**
