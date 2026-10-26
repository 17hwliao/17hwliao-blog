- StringBuilder类 :

实现优化

String str \= "杰哥" \+ "你干嘛" ;

System\.out\.println\(str \+ str2 \+ str3 \+ str4\);

实现多个相加内部 : 使用StringBuilder实现 :

```text
StringBuilder builder = new StringBuilder() ;
builder.append("AAA") ;     //实现拼接字符串
builder.insert(1 , "BBB") ; //实现定位插入
builder.delete(2 , 3 ) ;   //实现定位删除
builder.indexOf("BBB") ;    //实现定位 
System.out.println(builder.toString());    //转化为字符串
```

- \(Java11 修改\)

str\.strip\(\) 实现去除字符串中的空格

```text
System.out.println(str2.stripLeading());   //去除前列的空格
System.out.println(str3.stripTrailing());  //去除后列的空格
System.out.println(str5.isBlank());   //是否全为空格
```

- 文本块

```text
String mu = """
        shiqihaowuliao@qq.com, 
        17hwliao.io
        相
        """ ;
```

- 正则表达式 : 判断输入的字符是否符合规格

变量名\.matches\( "\( 无需判断的前面字符串 \)字符 \+ 限定符" \)

判断字符\+\( 判断该字符出现一次或多次 \) : 只能判断 \( " \( 多个字符 \)c" ,"\(多个字符\)cc" , "ccc" \.\.\. 类型的 \) ;

"\( 可以去判断 \)\*" : 判断零个或多个

? 判断字符在 需要判断的字符串中出现零次或一次\( 多次会返回false \)

zo\{2,\} 判断字符出现固定的次数 ;

\[A\-Za\-z \]\{2,5\} 判断是否全为英文字母 , 并且出现次数为2 \-5 次

^ 取反\[^ 字符\] 实现判断除去英文字符 的全部字符

\.\{2,4\} 可以判断任何字符

\[\\s\\S\] 匹配所有 包含换行符等

因为 \. 是特殊的符号 , 所以要实现\\\\来规范标准的点号

\[A\-Za\-z0\-9\]\*@\[A\-zA\-z0\-9\]\{1,5\}\\\\\.com"\) 实现判断是否为邮箱地址

\[A\-Za\-z0\-9\] 判断字符加数字的判断

- switch 模式匹配\( 变量实现变量操作 \)

不需要变量承载值 可以直接使用\_ 来进行判断即可

```text
String result = switch (obj) {
    case String s -> {
        // 🔥 这里可以使用变量 s 访问字符串的方法！
        int length = s.length();
        String upper = s.toUpperCase();
        yield "字符串: '" + s + "'，长度: " + length + "，大写: " + upper;
    }
    case Integer i -> {
        // 🔥 这里可以使用变量 i 进行数学计算！
        int square = i * i;
        double root = Math.sqrt(i);
        yield "整数: " + i + "，平方: " + square + "，平方根: " + root;
    }
    default -> "其他类型";
};
```

```text
String t = switch (obj) {
    case String s -> "String";
    case Integer h -> "String";
    case null -> "NULL";   //可以判断是否为空
    default -> "Other";
    }
```

```text
String type = String.valueOf(switch (str){
    case String s when s.isEmpty() -> "Empty" ;
    case String s when s.isBlank() -> "Blank" ;
    case String s when s.length() > 2 -> "haohaiyou" ;
    default -> "Other";
```

```text
return switch (score) {
    case Integer c when c >= 90 -> "优秀";
    case Integer c when c >= 80 ->"良好" ;
    case Integer c when c >= 70 -> "及格" ;
    default -> "滚蛋";
};
```
