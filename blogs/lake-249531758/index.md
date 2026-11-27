\-\-\-

JDK\( Java development kit\)是JAVA语言的软件开发工具包 \( JVM \+ 开发工具 \+ 核心类库\) ;

包含JRE\( java运行环境 \[ JVM \+ 运行工具\] \+ 核心类库 \) JDK &gt; JRE &gt; JVM \( java virtual machine \)

java源文件 \-&gt;\(javac\.exe\[ 后缀有java \] \) JVM文件\.class \-&gt; \( java\.exe \[后缀不含Java\]\) \-&gt; 输出结果 \{ 基础编译 \}

public static void main\( String\[\]args \) 定义一个叫 class 的类

1\.public : 程序访问权限 , 任何场合都可被引用

2\.static : 方法是静态的,不依赖类的对象的

3\.void : 表示无返回值

4:参数Stirng\[\]args 是字符串数组,接收程序执行时传入参数

常见CMD命令 :

1\) 盘符 加 " : " ;

2\) dir 查看当前路径全部内容

3\) cd 进入当前文件夹

4\) cd\\ 回退到盘符

5\) cls 清屏

6\) exit 退出CMD窗口

- \#\#\#\#输入输出流

import java\.io\.\*; //导入java\.io包中的所有类。这个包提供了输入/输出相关的功能

import java\.util\.\*; //这个包包含了很多实用工具，比如：

集合框架（List, Map, Set, ArrayList, HashMap）

日期时间类（旧版的Date, Calendar，但新版推荐用java\.time）

随机数生成（Random）

扫描器（Scanner）等

//关闭输入流 : scanner\.close\(\); 关闭scanner ;

public static void main\(String\[\] args\) \{

Scanner 变量名 \= new Scanner\(System\.in\); //键盘录入 , s 处可以随便命名

double n \= 变量名\. nextDouble\(\) ; //设置变量

System\.out\.println\(1 \+ 1 \) ;

变量名\.close\(\) ;

next\(\) 读取一个字符串（到空白符） String s \= scanner\.next\(\);

nextLine\(\) 读取一行 String line \= scanner\.nextLine\(\);

next\(\)\.charAt\(0\) 读取第一个字符 char c \= scanner\.next\(\)\.charAt\(0\);

nextBoolean\(\) 读取布尔值 boolean b \= scanner\.nextBoolean\(\);

- 最快输入流:

public class CompetitiveIO \{

static BufferedReader br;

static StringTokenizer st;

static PrintWriter pw;

public static void main\(String\[\] args\) throws IOException \{

br \= new BufferedReader\(new InputStreamReader\(System\.in\)\);

pw \= new PrintWriter\(new BufferedWriter\(new OutputStreamWriter\(System\.out\)\)\);

// 读取整数

int n \= nextInt\(\);

int m \= nextInt\(\);

// 读取长行并分割

st \= new StringTokenizer\(br\.readLine\(\)\);

int\[\] arr \= new int\[n\];

for \(int i \= 0; i &lt; n; i\+\+\) \{

arr\[i\] \= Integer\.parseInt\(st\.nextToken\(\)\);

\}

pw\.println\(n \+ m\);

pw\.flush\(\);

\}

static int nextInt\(\) throws IOException \{

while \(st \=\= null \|\| \!st\.hasMoreTokens\(\)\) \{

st \= new StringTokenizer\(br\.readLine\(\)\);

\}

return Integer\.parseInt\(st\.nextToken\(\)\);

\}

static String next\(\) throws IOException \{

while \(st \=\= null \|\| \!st\.hasMoreTokens\(\)\) \{

st \= new StringTokenizer\(br\.readLine\(\)\);

\}

return st\.nextToken\(\);

\}

\}

\#\#\#\#类型区别:

byte 是有符号整数类型\(\-128 到 127\)

boolean 是布尔型的定义类型

java : Random 类 :生成随机数

导包 , 创建对象

Random r \= new Randow\(\) ;

int number \= r\.nextInt\(随机数的范围\[ bound : 100 \] \+ n \{通过加n 来实现在n \~ m 的随机数\} \) ; // 0 \~ 99 包头不包尾 \(和 python 内的 range相同\)

- \#\#\#\#变量 :

全局变量 ;

public static int onlineUserCount \= 0;

定义常量 :

public static final int N \= 1000;

\#\#\#\#定义数组:

声明后指定大小

一维 : int\[\] arr1 \= new int\[5\]; // 创建一个长度为5的int数组，默认值为0

二维 : int\[\]\[\] arr \= new int\[row\]\[col\] ;

实现自定义边界 \[控制单行的列数\]　:

int\[\]\[\] arr \= new\[3 \]\[\] ;

arr\[n\] \= new int\[ x \] ; // 控制第n行输出x列

\#\#\#\#万能类型转化公式

String s \= String\.valueOf\(a\); 可实现任意类型转化为String形式的变量

int num \= Integer\.parseInt\("123"\); 实现String 型转化为 int 类型的变量

double d \= Double\.parseDouble\(str\); 实现 String 型转化为 double 类型的变量

\#\#\#\#类似STL : vector : ApI 包中的动态数组 ArrayList&lt;Integer&gt; ;

int 和 integer : 特性 int \(基本类型\) Integer \(引用类型/包装类\)

类型 基本数据类型 对象（包装类）

内存 4字节（栈内存） 对象开销（堆内存）

默认值 0 null

比较 值比较 \(\=\=\) 需要\.equals\(\)或拆箱

集合 ❌ 不能直接放入集合 ✅ 可以放入集合

泛型 ❌ 不能用于泛型 ✅ 可以用于泛型

//1\.实现初始化动态数组

ArrayList&lt;Integer&gt; list \= new ArrayLisrt&lt;&gt;\(\) ;

// 2\. 添加元素（自动扩容）

变量名\.add\(10\); // 末尾添加 \= \(C\+\+\) arr \. push\_back\( 10 \) ;

变量名\.add\(20\);

变量名\.add\(30\);

变量名 \.add\(1, 15\); // 在索引1处插入15

//3\.判断数组是否为空

变量名\.isEmpty\( \) ;

// 4\. 清空列表

变量名\.clear\(\);

// 5\. 获取元素

变量名\.get\(x\)\); // 获取索引是x 的数

//6\.获取数组大小

变量名\.size\(\) ;

// 7\. 修改元素

list\.set\(1, 250\); // 将索引1改为250

System\.out\.println\("修改后: " \+ list\); // \[100, 250, 300\]

// 8\. 删除元素

list\.remove\(x\); // 删除索引x 所指的数

//9\.判断类似find函数 :

变量名\.contains\(250\)\);

\#\#\#\#实现自动推导\( var \)类型 :

直接用于遍历数组 :

for\(var it : 数组\) \{\}

\#\#\#\#方法 : 最小执行单元 \( 要么全执行 , 要么全不执行 \) 重复且独立 会复用

//注意这里的

有static : 静态方法 : 属于类 , 类加载时初始化 , 不支持重写

无static : 实例方法 , 属于对象 , 随对象创建 , 支持重写

//参数:

形参 : 形式参数 : 定义方法时里面定义的

实参 : 调用方法 : 传入方法中进行计算

//可以实现各种调用

public static void main\(String\[\] args\) mian 方法 , 主方法 调用方法：方法名\(\) ;

public static void 类名\{ 方法体 \} 设计一个空类型的类 \( 等同于 void 函数\[C\+\+\]\)

public static void 类名\( int a , int b \) \{\} 实现传值 ;

public 返回值类型 方法名\{\} 设计一个返回类型的方法 也是在方法体最后补上return 返回值 ;

方法之间是平级的 , 和C \+\+ 类似 : 可在main函数之前定义方法 即 编写顺序和执行顺序无关

//方法的重载 JVM通过找参数\( 个数 , 类型 \)相同 区分 不同方法

好处 : 调用方法时 :

//在一个类中, 定义多个同名方法 , 同名方法具有相同功能

//每个方法具有不同的参数类型和参数个数 , 这些同名方法, 构成重载关系

//提高API的易用性
