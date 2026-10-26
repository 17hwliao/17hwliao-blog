- Object 类 :

object 类 : 所有的类都继承于 object 类\( 被省略而已 \)

每个初建的类的方便函数 继承于 object 类

native 方法底层使用C\+\+实现 无法直接在java中调用

hashcode 返回int 表示返回对象的内存地址

equals 判断\( 返回Boolean \)当前对象和this是否相同

clone 返回Object类型 实现复制一个完全相同的对象 , 包含目标对象属性

toString 将对象\( 包含类名也可 \)转化为String类型 ;

println 只可以实现单变量的输出 , 根据传入数据类型找最近的类库函数

多线程函数 notify , wait , wait;

finalize 已经被弃用 , 在JVM中有更好的释放资源的手段

小更新:

instanceof 之前 ：　实现判断 类 或 该类的子代索引用关键字

在判断时在类型的后面加变量名 实现直接类型转化

```text
private static void test(Person s){
    if(s instanceof Student stu){
        stu.study();
    } else if( s instanceof Person se){
        se.teach() ;
    } else{
        System.out.println("111");
    }
}
```

- 方法的重写

子类定义和父类名字相同的方法会发生重写

只是实现在子类中覆盖了父类中该名字的方法实现

重写后 调用父类的方法使用的是父亲的

调用子类的就是子类的方法

1 \. 注意\( 实现重写的关键注意点 \)　： Person p1 \= student ;

只有当父类指向子类对象时\( 多态 \) , 才会调用子类重写后的方法

2\.使用static标记的静态方法无法通过重写 , 但还是可以各用各的 ;

3\.添加了final的方法无法被重写

即使创建一个父类的对象 但传入的是子类, 也是使用子类的方法

争对上面的创建 , 在调用属性时p1调用的是自己本身所属的内容

在重写会提供系统标示 [@Override](https://www.yuque.com/override)

判断字符串是否相符 使用equals 实现判断对象是否相同

- `==` 比较的是**内存地址**（是否为同一个对象）
- `equals()` 比较的是**内容**（字符序列是否相同）

println即是调用toString方法 : 可以在类中重写实现完整输出 \( 会在调用println时自动运行 \) ;

父类方法private的时候会实现共存

- 抽象类

类变为抽象类 \( abstract class \)时只有被继承的能力

不能被实例化 , 不能被new对象无法实例化

可以和实例方法共存

可以包含成员变量

- 接口\( 类似插件 \) interface

1\.在要接口的类加上 implements 方法名\( 大写首字母 \)

创建接口文件

只能存在变量只能为常量 , 方法只能为 : 公共抽象方法 , 公共方法 :

public abstract void 方法

可以将子类当作接口来用

Study s \= new Student\(\) ;

s \. 方法名\(\) ;

2\.继承只能一传一 , 但接口可以实现一对多 , 同时实现功能

implements 方法名 , 另外的方法\( 首字母大写 \)

3\.继承是获得类的属性和成员方法, 但接口只能实现功能连属性都没有 , 且方法要到子类里才能去定义

修改系统函数 : 创建接口 , 在调用时转化权限为public 类型

修改后的系统函数 , 通过return super\.clone\(\) ; 必须使用super克隆 ,系统函数的底层是使用C\+\+ 代码实现

在类中调用时

1. `Object.clone()` 方法本身就声明了 `throws CloneNotSupportedException`
2. 当重写一个方法时，**不能添加比父类方法更多的检查型异常**
3. 所以必须保持相同的异常声明
