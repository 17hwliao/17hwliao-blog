- **类的成员方法**

静态方法 :

static 创建为属于类的属性 和对象无关 ;

static 可以创建静态变量 和 静态方法

静态成员（静态变量、静态代码块）在 **类加载时** 初始化，**只执行一次**，且 **早于任何对象创建**。

可以多次调用 , 但只属于类 , 可以修改值

注意 : 无法实现this 关键字的使用

除静态变量外 , 静态方法在不同的对象传入不同值时各自单独运行

静态方法可以在一个类中被 main 方法调用

实例方法需要创建一个类对象在进行调用

```text
java01 test = new java01() ;
test.test1() ;
```

```text
void test1(){
    Scanner cin = new Scanner(System.in) ;
    char a = cin.next().charAt(0) ;
    System.out.println(a);
}
```

- 包

需要在包内的类中最上面说明所属类

package 包名 ;

import 导入不同包内的类

import\.其他包名\.\* ; 利于\* 表示导入其他包名中的全部类

类只能调用相同包内的类

不同包之间的可以创建同名的类

String如果发生命名冲突 : 在系统自带的String前补上包名java\.long

- 访问权限限制

private \( 同类 \): 私有 , 标记为私有内容无法被除当前类以外的位置访问 ;

会导致无法创建出来类 \( 全是静态方法不需要创建 \);

什么都不写\( 同包 \): 默认 , 只能被类本身 和 同包 的其他类访问 ;

protected \( 同包 \): 受保护 ,标记为保护的内容可以被类本身和同包中的其他类访问 , 也可被子类访问 ;

public \( 任意 \): 公共 , 标记为公共的内容可以在任意位置去访问 ;

**在同一个类中，所有方法无论权限修饰符是什么，都可以互相访问！**

可以单独实现导入静态方法:

import static 包名\.方法名

在main类中可以实现直接调用静态变量 \+ 静态方法

封装 继承 多态

封装 : 让外部只能调用内部的方法\( public \)才能修改内部参数\( private \) ;

```text
package com_java;

public class Person {
    private String name ;
    private int age;

    public void setName( String name ) {
        //封装name
        this. name = name ;
    }
    public void setAge(int age) {
        //封装age
        this.age = age;
    }
    public int getAge() {
        return age;
    }
    public String getName() {
        return name;
    }

    public static Person new_i(){
        //实现封装创建
        return new Person();
    }

}
```

真实实现封装的步骤:

1\.使用构造方法初始化\( 属性private化 \)

2\.对外只提供访问 , 修改 属性的方法

3\.控制数据访问 在上述方法中添加验证实现信息保护

继承 :

子类在构建时 , 不仅要初始化子类属性, 还要初始化父类的属性

父类的构造方法需要参数时 , 需要手动指定 若是无参数则可以不去指定

通过在新类的后面加extends \( 继承 \) 父类

可以调用父类中的 所有 函数 和 变量

要调用父类的变量和方法时要使用super进行修饰和调用，在java中父类被称为超类super

可以多层继承 , 继承的子代越多 , 获取的参数 和 方法就越多

使用public final class 限制继承 , 到达最终态 不能再被继承

快捷创建对象 new 类\(\) \. var会直接创建对象

父类 变量名1 \= new 子类\(\) ; 只能调用父类中的属性

变量名 2\= \(子类\) 变量名1 可以实现强制转化

在传参时子类只要包含父类的全部属性就可以当作父类实现传参

instanceof用于判断变量是否为对应类型和对应子类 , 函数用于返回true 或者返回false ;

子类可以和父类创建同名属性（属性讲究就近原则注意调用对象）:

如何在子类中含相同属性名, 还能获取父类的属性 : 使用super关键字 :

只能获取父类不能获取爷爷辈的属性变量

sout\( super\.name \+ " " \) ;
