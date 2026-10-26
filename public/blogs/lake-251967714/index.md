- 函数式接口

导包 : import java\.util\.function\.Supplier ;

Supplier接口 : 内部方法实现返回需要的类型 ;

```text
public void setName(Supplier<String>name){
    this.name = name.get() ;
}
Main : 
使用lambda表达式 : 
{			public String get(){} ; }
        ws0.setName(()->{
            return "ws" ;
        }) ;
```

Consumer接口 :

```text
public void usename(Consumer<String> consumer){
        consumer.accept(name) ;
 }
 consumer.accept(参数) ; 实现传出参数
 实现使用接口型函数+ 方法引用
ws0.setName(()->{
        return "ws" ;
    }) ;
    ws0.usename(System.out::println);
}
consumer = consumer.andThen(name -> {
            System.out.println("ws是gay啊");
        }) ; 
   andThen     实现串联多个接口consumer函数
```

温习下方法引用:

## **具体判断条件表格**

<table class="ne-table" id="CTX7H"><tbody><tr><td width="250"><p class="ne-p" id="ue37100fa"><span class="ne-text">Lambda形式</span></p></td><td width="250"><p class="ne-p" id="u1c8642e0"><span class="ne-text">可替换为</span></p></td><td width="250"><p class="ne-p" id="uf46daeda"><span class="ne-text">条件</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ue1e0be4d"><code class="ne-code"><span class="ne-text">x -&gt; x.method()</span></code></p></td><td width="250"><p class="ne-p" id="u7e360ae0"><code class="ne-code"><span class="ne-text">ClassName::instanceMethod</span></code></p></td><td width="250"><p class="ne-p" id="ud9201d9a"><span class="ne-text">实例方法，无额外参数</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u58ba91f6"><code class="ne-code"><span class="ne-text">x -&gt; obj.method(x)</span></code></p></td><td width="250"><p class="ne-p" id="u081e0738"><code class="ne-code"><span class="ne-text">obj::instanceMethod</span></code></p></td><td width="250"><p class="ne-p" id="uaabe2b7a"><span class="ne-text">调用特定对象的方法</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uc1770428"><code class="ne-code"><span class="ne-text">(x, y) -&gt; x.method(y)</span></code></p></td><td width="250"><p class="ne-p" id="u23a404dd"><code class="ne-code"><span class="ne-text">ClassName::instanceMethod</span></code></p></td><td width="250"><p class="ne-p" id="u29e39b32"><span class="ne-text">第一个参数是目标对象</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uf62bfc13"><code class="ne-code"><span class="ne-text">(x, y) -&gt; Class.method(x, y)</span></code></p></td><td width="250"><p class="ne-p" id="u67e93a62"><code class="ne-code"><span class="ne-text">Class::staticMethod</span></code></p></td><td width="250"><p class="ne-p" id="u0b38f787"><span class="ne-text">静态方法</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u74aeaabd"><code class="ne-code"><span class="ne-text">() -&gt; new Class()</span></code></p></td><td width="250"><p class="ne-p" id="ubcb77662"><code class="ne-code"><span class="ne-text">Class::new</span></code></p></td><td width="250"><p class="ne-p" id="u2876560e"><span class="ne-text">无参构造器</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u5a9adc4e"><code class="ne-code"><span class="ne-text">x -&gt; new Class(x)</span></code></p></td><td width="250"><p class="ne-p" id="u59c11b04"><code class="ne-code"><span class="ne-text">Class::new</span></code></p></td><td width="250"><p class="ne-p" id="u71db5b36"><span class="ne-text">带参构造器</span></p></td></tr></tbody></table>

区分这两种函数接口 :

<table class="ne-table" id="GroZ7"><tbody><tr><td width="250"><p class="ne-p" id="u694964f8"><span class="ne-text">方面</span></p></td><td width="250"><p class="ne-p" id="ud67bbaa2"><strong><span class="ne-text">Supplier</span></strong></p></td><td width="250"><p class="ne-p" id="ub7d089f0"><strong><span class="ne-text">Consumer</span></strong></p></td></tr><tr><td width="250"><p class="ne-p" id="u61da66a9"><strong><span class="ne-text">目的</span></strong></p></td><td width="250"><p class="ne-p" id="u29396bce"><span class="ne-text">提供/创建数据</span></p></td><td width="250"><p class="ne-p" id="ubadcebe9"><span class="ne-text">消费/处理数据</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u171f5b79"><strong><span class="ne-text">方向</span></strong></p></td><td width="250"><p class="ne-p" id="u2147d26a"><span class="ne-text">数据源头</span></p></td><td width="250"><p class="ne-p" id="u1362519c"><span class="ne-text">数据终点</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ue807bb6e"><strong><span class="ne-text">返回值</span></strong></p></td><td width="250"><p class="ne-p" id="u2010440e"><span class="ne-text">总是有返回值</span></p></td><td width="250"><p class="ne-p" id="ueb4f9619"><span class="ne-text">总是 void</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uf0435064"><strong><span class="ne-text">参数</span></strong></p></td><td width="250"><p class="ne-p" id="u445e8e3e"><span class="ne-text">无参数</span></p></td><td width="250"><p class="ne-p" id="u1958ef85"><span class="ne-text">至少一个参数</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u4e0c7e23"><strong><span class="ne-text">是否纯函数</span></strong></p></td><td width="250"><p class="ne-p" id="u9e270de1"><span class="ne-text">可以是纯函数（无副作用）</span></p></td><td width="250"><p class="ne-p" id="uff9ebb88"><span class="ne-text">通常有副作用</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ub1496818"><strong><span class="ne-text">典型应用</span></strong></p></td><td width="250"><p class="ne-p" id="u8d55769b"><span class="ne-text">工厂方法、配置加载、懒加载</span></p></td><td width="250"><p class="ne-p" id="u8356a06b"><span class="ne-text">遍历处理、回调、资源清理</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u89f9400b"><strong><span class="ne-text">流式操作</span></strong></p></td><td width="250"><p class="ne-p" id="uc309da2e"><span class="ne-text">用于生成流（</span><code class="ne-code"><span class="ne-text">Stream.generate()</span></code></p><p class="ne-p" id="u6f6b080b"><span class="ne-text">）</span></p></td><td width="250"><p class="ne-p" id="ufe13cfd9"><span class="ne-text">用于终端操作（</span><code class="ne-code"><span class="ne-text">forEach()</span></code></p><p class="ne-p" id="ue2352183"><span class="ne-text">）</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u99cea044"><strong><span class="ne-text">线程安全</span></strong></p></td><td width="250"><p class="ne-p" id="u3ce34bad"><span class="ne-text">通常线程安全（只读）</span></p></td><td width="250"><p class="ne-p" id="uaa5db842"><span class="ne-text">需要注意（可能修改共享状态）</span></p></td></tr></tbody></table>

- Function函数类型接口 :

消费 \+ 提供 :

```text
public void namelength(Function<String , Integer> function){
    Integer apply = function.apply(name);
    System.out.println("name的长度"+apply);
 }
 ws0.namelength(String::length);
```

实现转化类型

```text
Function<String , byte[]> f = str -> str.getBytes();
Function<String , Integer> f2 = f.andThen(bytes -> bytes.length) ;
Function<String , String> f3 = f2.andThen(Integer::toHexString) ;
```

还有before 反着传值操作

Function还支持一个函数 Function\.identity\(\)\.apply \( " SSS " \) ;

功能 : 给啥返回啥

compose可以实现before操作

- Predicate断言型函数接口:

```text
public void nameInvalid(Predicate<String> predicate){
    boolean test = predicate.test(name) ;
    System.out.println(test ? "是gay" : "骗你的还是gay");
}
```

主程序中调用 :

ws0\.nameInvalid\(name \-&gt; name\.length\(\)&gt;\=3\);

可以用and实现连接 :

```text
Predicate<String> predicate = name -> name.length()>=3;
predicate = predicate.and(name -> name.length() < 10);
```

negate是取反 ; 对test函数取反

内部equal 可以实现判断是否相等 ;

- Biconsumer : 实现提供俩参数

```text
public void nameid(BiConsumer<String, Integer> biConsumer){
    biConsumer.accept(name,id);
}
```

- optional判空包装 ：

之前 if 判空

Optional类 :

ofNullable允许空传入

ifPresent 不为空会执行后面的操作 , 否则return ;

Optional\.ofNullable\(name\)\.ifPresent\(s \-&gt; System\.out\.println\(s\.length\(\)\)\);

使用方法包装后\(传入参数String test \) : String s \= Optional\.ofNullable\(name\)\.get\(\) ; get可以获取对象的引用 , 若包装对象为空 , 会抛出异常

可以在get处写orElse\("实现为空时的操作"\) \\ orElseGet\( \( \) \-&gt; "" \)

可以使用map实现映射操作 : 可以实现转化类型

get处写map\(s \-&gt; s\.length\(\)\),orElse\( int类型结果 \) ;

sout\( i \) ;

- Optional在Java9 / 10 /11 版本加强

之前 : Optional\.ofNullable\( str \)\.ifPresent\( s \-&gt; \{ 操作 \} \) ;

修改后:Optional\.ofNullable\(str\)\.ifPresentorElse\( s\-&gt;\{ 操作 \}　，　（Ｒｕｎｎａｂｌｅ）－＞｛｝ \) ;

内部有Runnable函数式接口：返回为空；

\(str\)\.or\( \(\) \-&gt; Optional\.of \[必须要使用optioal\.of包起来\] \( "为空时的输出" \) \)\.ifZPresent\( 输出 \) ;

orElseThrow\(\) ; 判断是否为空来抛异常

```text
private static void test1(String str) {
    String result = Optional.ofNullable(str)
        .filter(s -> s.length() > 2)     //断言 , 判断是否保留
        .orElse("(无效输入)");  // ✅ 为空时返回安全值
    
    System.out.println(result);
}
```

Optional\.ofNullable\(str\)\.flagMap\(s \-&gt; Optional\.ofNullable\(null\)\)\.isEmpty\(\) ;
