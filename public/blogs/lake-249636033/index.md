- 标签 :

可以将类里面的方法使用一个标签全部打包后

break \+ 标签（跳出指定代码区）

continue \+ 标签（跳到指定代码区）

outer : 放在外层循环

运用 break outer 可以实现直接跳出外层循环

运用 continue outer 可以实现开始下一外层循环

- this 关键字的使用: 1\. 区分成员变量和局部变量

2\.调用类中的方法

1. 参数名与成员变量名相同 → **必须使用this**

着重代表此变量为当前对象本身内部的变量

2. 参数名与成员变量名不同 → 可不使用this

3\.实现找出

- 方法重载

1. 同一类中方法名相同
2. 实现功能类似但不是必须相同
3. 编译器通过实现查看变量传入的 参数类型 , 顺序 和 数量 来判断不同类的方法 \( 返回值类型不同不构成重载 \)

- 方法的互调和递归

同一个类中可以实现方法之间的相互调用

方法自己调用自己实现递归调用 \( 区别: 不是用return 实现递归 \);

动态规划 实现斐波那契数列

- 构造器

类都会自带一个无参数的构造方法

实际new Person\(\)的时候就是调用构造方法创建对象

下面通过定义了构造无参数方法 ;

1. 直接初始化 对象内部资源 ;

```text
Person. class : 
Person(){
    name = "xiao_ming" ;
    age = 18 ;
    gender = "nan" ;
}
```

2. 创建有参构造 : 实现在初始化的时候传入变量值

```text
Person.class : 
Person(String name , int age , String gender){
    this.name = name ;
    this.age = age ;
    this.gender = gender ;
}
```

```text
Person(String name , String gender){
    this(name , 16) ;
    this.gender = gender ;
    this.age = 187 ;
}

Person(String name , int age ){
    this.name = name ;
    this.age = age ;
}
```

上述代码中会发生初始化 age的覆盖 : 187 ;

存在代码块特殊形式

在调用方法前按顺序运行

**创建对象实例时**（无论使用哪个构造函数）

**调用方法时不会运行实例代码块。**

\{ 在大括号内直接进行编码 \}

- final 关键词 : 在变量前加上final后此变量不会受后续的赋值操作更改
- 初始化加上final 必须赋值为空
