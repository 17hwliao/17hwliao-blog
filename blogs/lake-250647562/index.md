- 异常

在Java中异常已经被封装为类 :

第一种异常 : 运行时异常 :

1. 算数中出现 / 0;
2. 对 null 执行 toString\(\) 操作
3. 没在类中实现接口但调用方法的

第二种异常 : 编译时异常 \( 必须进行手动处理 \)

第三种异常 : 错误 , 致命的问题 :

创建为 Integer \. MAX\_VALUE大小的数组

在main中调用main 会不断调用 , 会爆栈

- 自定义异常

编译时异常 : extends Exception 所有异常都要继承自Exception类

运行时异常 : extends RuntimeException \( 直接创建异常类时会自动变为Runtime类 \)

- 抛出异常

```text
private static int div(int a , int b ){
    if(b == 0){
        throw new Exercise1("发现除0") ;
    }
    return a / b ;
}
```

栈追踪 问题 : at Today\.Main\.div\(Main\.java: 异常所在行数\)

实现抛出编译型异常 : 在实现函数 标清楚 throws TestExecption , 实现方法的类必须标明throws 编译时异常

父类中被标记会抛出某异常 : 但子类中不会出现该异常时可以去除throw操作

- try \- catch 语句 :

实现捕获异常 , 错误 :

```text
try{
    Object obj = null ;
    obj.toString();
} catch(NullPointerException ws){
    System.out.println("发生异常" );
}
```

catch中表明出现的异常并且表明出 代表异常的变量

ws\.printStackTrace\(\) ; 通过变量调用追踪函数实现栈异常路径 : 虽然会抛出异常但不会中止运行

ws\.getmessage\(\) 实现输出异常的原因 ;

catch 和 try 中出现的异常必须一致 , 否则还会出现程序被掐断

catch\( Exception ws \) 可以直接写这个\( 所有异常全部继承自Exception \)

注意在捕获异常时 :

1. 一个try 下可以追加很多catch\( 类型 变量 \) ; 实现识别不同的异常 并抛出对应异常中的内容
2. 可以在一个catch\( 异常类型1 \| 异常类型2 变量 \) 实现输出对应的异常

message类的异常设置String提示 ,可以通过使用getmessage实现输出String

运行时异常可以不明确标注 , 但编译时异常在定义方法时就要实现抛出可能出现的异常类型

也可以在方法后不抛出异常：可以在方法中就实现try\-catch 处理掉异常

主方法 , 异常再继续上抛的话 , JVM默认处理 : 中止程序运行 \+ 打印出栈追踪信息

不论是否发生异常 , 最后都要加上收尾操作 : finally\{\} 不论 是否有异常, 是否被捕获 , 程序是否被中止, 都会执行finally语句

- 断言表达式

默认状态下不会自动开启断言操作 , 要实现断言操作 必须手动在虚拟机设置中去手动开启 :

在文件的运行与设置中 对当前的主文件 进行配置

在配置中选择实行虚拟机选项 : Alt \+ V ;

再VM配置中写入 \-enableassertions ;

assert关键字 : \+ 判断语句 出现false 就会报出异常
