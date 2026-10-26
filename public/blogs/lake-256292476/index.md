### 文件字符流

字符流不同于字节，字符流是以一个具体的字符进行读取，因此它只适合读纯文本的文件，如果是其他类型的文件不适用：

**java****复制代码**

```java
public static void main(String[] args) {
    try(FileReader reader = new FileReader("test.txt")){
      	reader.skip(1);   //现在跳过的是一个字符
        System.out.println((char) reader.read());   //现在是按字符进行读取，而不是字节，因此可以直接读取到中文字符
    }catch (IOException e){
        e.printStackTrace();
    }
}
```

同理，字符流只支持`char[]`类型作为存储：

**java****复制代码**

```java
public static void main(String[] args) {
    try(FileReader reader = new FileReader("test.txt")){
        char[] str = new char[10];
        reader.read(str);
        System.out.println(str);   //直接读取到char[]中
    }catch (IOException e){
        e.printStackTrace();
    }
}
```

既然有了Reader肯定也有Writer：

**java****复制代码**

```java
public static void main(String[] args) {
    try(FileWriter writer = new FileWriter("output.txt")){
      	writer.getEncoding();   //支持获取编码（不同的文本文件可能会有不同的编码类型）
       writer.write('牛');
       writer.append('牛');   //其实功能和write一样
      	writer.flush();   //刷新
    }catch (IOException e){
        e.printStackTrace();
    }
}
```

File类，它是专门用于表示一个文件或文件夹，只不过它只是代表这个文件，但并不是这个文件本身。通过File对象，可以更好地管理和操作硬盘上的文件。

**java****复制代码**

```java
public static void main(String[] args) {
    File file = new File("test/xxx/xxx");   //直接创建文件对象，可以是相对路径，也可以是绝对路径
    new File("");写入.是当前路径下的全部文件.写入..表示上一级全部文件 ; 
    System.out.println(file.exists());   //此文件是否存在
    System.out.println(file.length());   //获取文件的大小
    System.out.println(file.isDirectory());   //是否为一个文件夹
    System.out.println(file.canRead());   //是否可读
    System.out.println(file.canWrite());   //是否可写
    System.out.println(file.canExecute());   //是否可执行
  
    file.createNewFile();   //创建新文件
    file.delete();   //删除文件
    file.mkdir();    //创建目录，但父级目录不存在会直接报错
    file.mkdirs();   //创建目录，如果父级目录不存在会一起创建
}
```

通过File对象，我们就能快速得到文件的所有信息，如果是文件夹，还可以获取文件夹内部的文件列表等内容：

**java****复制代码**

```java
File file = new File("/");
System.out.println(Arrays.toString(file.list()));   //快速获取文件夹下的文件名称列表
for (File f : file.listFiles()){   //所有子文件的File对象
    System.out.println(f.getAbsolutePath());   //获取文件的绝对路径
}
```

读取某个文件的内容，可以直接将File作为参数传入字节流或是字符流：

**java****复制代码**

```java
File file = new File("test.txt");
try (FileInputStream inputStream = new FileInputStream(file)){   //直接做参数
    System.out.println(inputStream.available());
}catch (IOException e){
    e.printStackTrace();
}
```

### \(Java 7/8/11\) 文件工具类

`Files`类是`java.nio.file`包中的一个实用类，在Java 7中推出，提供了许多静态方法，用于文件和目录的操作。它大大简化了文件处理的工作，例如创建、删除、读取、写入和属性管理等。比如之前的创建目录操作：

**java****复制代码**

```java
public static void main(String[] args) throws IOException {
    Files.createDirectory(Path.of("./test"));  //使用createDirectory直接创建一个指定目录
    Files.createDirectories(Path.of("./test"));
}
```

提供了非常方便的方法直接创建目录，只不过此工具类的路径需要配合`Path`对象来指定，它代表一个文件路径，可以直接通过`of`方法来创建。

**java****复制代码**

```java
Path path = Path.of("src/com/test");
System.out.println(path.toAbsolutePath());   //获取绝对路径
System.out.println(path.toAbsolutePath().getParent());  //获取父路径(相对路径没上一级显示没办法取)
```

利用此类型代表路径，可以为我们带来更多的便利，如快速获取绝对路径、父级目录等。现在回到`Files`类，对于文件的删除也是很方便的：

**java****复制代码**

```java
Path path = Path.of("test");
Files.delete(path);   //删除，没有文件报错
Files.deleteIfExists(path);  //删除，没有文件返回false否则返回true
```

还有很多对于文件的快捷操作：

**java****复制代码**

```java
Files.readString(path)   //Java 11新增，读取所有内容并以字符串返回  无需输入输出流
List<String> lines = Files.readAllLines(path);   //一键读取所有文件内容并按行分割返回
Stream<String> linesStream = Files.lines(path);   //同上，以Java 8之后的Stream形式返回

Files.write(path, "HelloWorld".getBytes() , StandardopenOption.[方法:有覆盖有接着写]);   //一键写入内容
Files.writeString(path, "HelloWorld");  //Java 11新增，更快捷的用字符串一键写入

Files.copy(path, Path.of("another"));   //拷贝文件到另一个路径
Files.move(path, Path.of("another"));   //移动文件到另一个路径

Files.exists(path);   //判断文件是否存在
Files.notExists(path);  //判断文件是否不存在

Files.isExecutable(path);  //文件是否可执行
Files.isDirectory(path);  //文件是否是文件夹
Files.isWritable(path);   //文件是否可写
Files.isReadable(path);   //文件是否可读
Files.isHidden(path);   //文件是否为隐藏文件

Files.newInputStream(path);  //创建新的文件输入流
Files.newOutputStream(path);   //创建新的文件输出流
```

对于文件的查找，该工具类也给了非常好用API，其中`find`方法可以帮助我们快速查找文件：

**java****复制代码**

```java
//其中第一个参数为起始查找点，第二参数为最大查找深度，最后就是一个断言函数式，就是判断每一个文件是否符合我们要查找的要求
Files.find(Path.of("."), 4, (path, attributes) -> {
    if (path.getFileName().toString().equals("Main.java")) {
        return true;
    } else {
        return false;
    }
}).forEach(path -> {   //find的结果会以Stream的形式返回
    System.out.println(path);
});
```

对于整个目录下文件的遍历，我们可以使用`walkFileTree`方法，此方法需要我们手动实现一个`FileVisitor`类，用于指定文件的查找操作，假设我们希望遍历项目目录下所有文件并打印所有非文件夹的普通文件：

**java****复制代码**

```java
//第一个参数指定起始位置，第二个参数实现FileVisitor
Files.walkFileTree(Path.of("."), new SimpleFileVisitor<>() {
    @Override
    public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
        System.out.println("找到目录: " + dir.toString());
        return FileVisitResult.CONTINUE;  //需要返回一个文件结果，CONTINUE就是继续，如果不想继续了也可以返回TERMINATE或是SKIP_SUBTREE跳过这个目录
    }

    @Override
    public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
        System.out.println("找到文件: " + file.toString());
        return FileVisitResult.CONTINUE;
    }

    @Override
    public FileVisitResult visitFileFailed(Path file, IOException exc) throws IOException {
        System.err.println("访问失败: " + file.toString());
        return FileVisitResult.CONTINUE;
    }
});
```

在Java8之后，Files也为我们提供了很方便的`walk`方法，它同样是返回一个Stream给我们，其中包含遍历的每一个文件的`Path`对象，这样就简单多了：

**java****复制代码**

```java
Files.walk(Path.of("."))  //返回Stream<Path>
        .filter(Files::isRegularFile)   //filter过滤判断是否为普通文件
        .forEach(System.out::println);   //打印
```

有关Files的相关操作就介绍到这里，详细内容各位小伙伴可以继续尝试探索。

### 缓冲流

每次都需要从外部I/O设备去获取数据，由于外部I/O设备的速度一般都达不到内存的读取速度，很有可能造成程序反应迟钝，因此性能还不够高，而缓冲流正如其名称一样，它能够提供一个缓冲，提前将部分内容存入内存（缓冲区）在下次读取时，如果缓冲区中存在此数据，则无需再去请求外部设备。同理，当向外部设备写入数据时，也是由缓冲区处理，而不是直接向外部设备写入。

![](</blogs/_assets/lakebook/2f3c28e58b601d761d5903c7.png>)

要创建一个缓冲字节流，只需要将原本的流作为构造参数传入BufferedInputStream即可：

**java****复制代码**

```java
public static void main(String[] args) {
    try (BufferedInputStream bufferedInputStream = new BufferedInputStream(new FileInputStream("test.txt"))){   //传入FileInputStream
        System.out.println((char) bufferedInputStream.read());   //操作和原来的流是一样的
    }catch (IOException e){
        e.printStackTrace();
    }
}
```

进行I/O操作的并不是BufferedInputStream，而是我们传入的FileInputStream，而BufferedInputStream虽然有着同样的方法，但是进行了一些额外的处理然后再调用FileInputStream的同名方法，这样的写法称为`装饰者模式`，我们会在设计模式篇中详细介绍。我们可以来观察一下它的`close`方法源码：

**java****复制代码**

```java
public void close() throws IOException {
    byte[] buffer;
    while ( (buffer = buf) != null) {
        if (bufUpdater.compareAndSet(this, buffer, null)) {  //CAS无锁算法，并发会用到，暂时不需要了解
            InputStream input = in;
            in = null;
            if (input != null)
                input.close();
            return;
        }
        // Else retry in case a new buf was CASed in fill()
    }
}
```

实际上这种模式是父类FilterInputStream提供的规范，后面我们还会讲到更多FilterInputStream的子类。

我们可以发现在BufferedInputStream中还存在一个专门用于缓存的数组：

**java****复制代码**

```java
/**
 * The internal buffer array where the data is stored. When necessary,
 * it may be replaced by another array of
 * a different size.
 */
protected volatile byte buf[];
```

I/O操作一般不能重复读取内容（比如键盘发送的信号，主机接收了就没了），而缓冲流提供了缓冲机制，一部分内容可以被暂时保存，BufferedInputStream支持`reset()`和`mark()`操作，首先我们来看看`mark()`方法的介绍：

**java****复制代码**

```java
/**
 * Marks the current position in this input stream. A subsequent
 * call to the <code>reset</code> method repositions this stream at
 * the last marked position so that subsequent reads re-read the same bytes.
 * <p>
 * The <code>readlimit</code> argument tells this input stream to
 * allow that many bytes to be read before the mark position gets
 * invalidated.
 * <p>
 * This method simply performs <code>in.mark(readlimit)</code>.
 *
 * @param   readlimit   the maximum limit of bytes that can be read before
 *                      the mark position becomes invalid.
 * @see     java.io.FilterInputStream#in
 * @see     java.io.FilterInputStream#reset()
 */
public synchronized void mark(int readlimit) {
    in.mark(readlimit);
}
```

当调用`mark()`之后，输入流会以某种方式保留之后读取的`readlimit`数量的内容，当读取的内容数量超过`readlimit`则之后的内容不会被保留，当调用`reset()`之后，会使得当前的读取位置回到`mark()`调用时的位置。

**java****复制代码**

```java
public static void main(String[] args) {
    try (BufferedInputStream bufferedInputStream = new BufferedInputStream(new FileInputStream("test.txt"))){
        bufferedInputStream.mark(1);   //只保留之后的1个字符
        System.out.println((char) bufferedInputStream.read());
        System.out.println((char) bufferedInputStream.read());
        bufferedInputStream.reset();   //回到mark时的位置
        System.out.println((char) bufferedInputStream.read());
        System.out.println((char) bufferedInputStream.read());
    }catch (IOException e) {
        e.printStackTrace();
    }
}
```

我们发现虽然后面的部分没有保存，但是依然能够正常读取，其实`mark()`后保存的读取内容是取`readlimit`和BufferedInputStream类的缓冲区大小两者中的最大值，而并非完全由`readlimit`确定。因此我们限制一下缓冲区大小，再来观察一下结果：

**java****复制代码**

```java
public static void main(String[] args) {
    try (BufferedInputStream bufferedInputStream = new BufferedInputStream(new FileInputStream("test.txt"), 1)){  //将缓冲区大小设置为1
        bufferedInputStream.mark(1);   //只保留之后的1个字符
        System.out.println((char) bufferedInputStream.read());
        System.out.println((char) bufferedInputStream.read());   //已经超过了readlimit，继续读取会导致mark失效
        bufferedInputStream.reset();   //mark已经失效，无法reset()
        System.out.println((char) bufferedInputStream.read());
        System.out.println((char) bufferedInputStream.read());
    }catch (IOException e) {
        e.printStackTrace();
    }
}
```

了解完了BufferedInputStream之后，我们再来看看BufferedOutputStream，其实和BufferedInputStream原理差不多，只是反向操作：

**java****复制代码**

```java
public static void main(String[] args) {
    try (BufferedOutputStream outputStream = new BufferedOutputStream(new FileOutputStream("output.txt"))){
        outputStream.write("lbwnb".getBytes());
        outputStream.flush();
    }catch (IOException e) {
        e.printStackTrace();
    }
}
```

操作和FileOutputStream一致，这里就不多做介绍了。

既然有缓冲字节流，那么肯定也有缓冲字符流，缓冲字符流和缓冲字节流一样，也有一个专门的缓冲区，BufferedReader构造时需要传入一个Reader对象：

**java****复制代码**

```java
public static void main(String[] args) {
    try (BufferedReader reader = new BufferedReader(new FileReader("test.txt"))){
        System.out.println((char) reader.read());
    }catch (IOException e) {
        e.printStackTrace();
    }
}
```

使用和reader也是一样的，内部也包含一个缓存数组：

**java****复制代码**

```java
private char cb[];
```

相比Reader更方便的是，它支持按行读取：

**java****复制代码**

```java
public static void main(String[] args) {
    try (BufferedReader reader = new BufferedReader(new FileReader("test.txt"))){
        System.out.println(reader.readLine());   //按行读取
    }catch (IOException e) {
        e.printStackTrace();
    }
}
```

读取后直接得到一个字符串，当然，它还能把每一行内容依次转换为集合类提到的Stream流：

**java****复制代码**

```java
public static void main(String[] args) {
    try (BufferedReader reader = new BufferedReader(new FileReader("test.txt"))){
        reader
                .lines()
                .limit(2)
                .distinct()
                .sorted()
                .forEach(System.out::println);
    }catch (IOException e) {
        e.printStackTrace();
    }
}
```

它同样也支持`mark()`和`reset()`操作：

**java****复制代码**

```java
public static void main(String[] args) {
    try (BufferedReader reader = new BufferedReader(new FileReader("test.txt"))){
        reader.mark(1);
        System.out.println((char) reader.read());
        reader.reset();
        System.out.println((char) reader.read());
    }catch (IOException e) {
        e.printStackTrace();
    }
}
```

BufferedReader处理纯文本文件时就更加方便了，BufferedWriter在处理时也同样方便：

**java****复制代码**

```java
public static void main(String[] args) {
    try (BufferedWriter reader = new BufferedWriter(new FileWriter("output.txt"))){
        reader.newLine();   //使用newLine进行换行
        reader.write("汉堡做滴彳亍不彳亍");   //可以直接写入一个字符串
      	reader.flush();   //清空缓冲区
    }catch (IOException e) {
        e.printStackTrace();
    }
}
```
