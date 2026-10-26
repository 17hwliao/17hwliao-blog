### 转换流

读取的是一个字符串或是一个个字符，但是我只能往一个OutputStream里输出，但是OutputStream又只支持byte类型，如果要往里面写入内容，进行数据转换就会很麻烦，那么能否有更加简便的方式来做这样的事情呢？

**java****复制代码**

```java
public static void main(String[] args) {
    try(OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream("test.txt"))){  //虽然给定的是FileOutputStream，但是现在支持以Writer的方式进行写入
        writer.write("lbwnb");   //以操作Writer的样子写入OutputStream
    }catch (IOException e){
        e.printStackTrace();
    }
}
```

我们现在只拿到了一个InputStream，但是我们希望能够按字符的方式读取，我们就可以使用InputStreamReader来帮助我们实现：

**java****复制代码**

```java
public static void main(String[] args) {
    try(InputStreamReader reader = new InputStreamReader(new FileInputStream("test.txt"))){  //虽然给定的是FileInputStream，但是现在支持以Reader的方式进行读取
        System.out.println((char) reader.read());
    }catch (IOException e){
        e.printStackTrace();
    }
}
```

InputStreamReader和OutputStreamWriter本质也是Reader和Writer，因此可以直接放入BufferedReader来实现更加方便的操作。

### 打印流

打印流其实我们从一开始就在使用了，比如`System.out`就是一个PrintStream，PrintStream也继承自FilterOutputStream类因此依然是装饰我们传入的输出流，但是它存在自动刷新机制，例如当向PrintStream流中写入一个字节数组后自动调用`flush()`方法。PrintStream也永远不会抛出异常，而是使用内部检查机制`checkError()`方法进行错误检查。最方便的是，它能够格式化任意的类型，将它们以字符串的形式写入到输出流。

**java****复制代码**

```java
public final static PrintStream out = null;
```

可以看到`System.out`也是PrintStream，不过默认是向控制台打印，我们也可以让它向文件中打印：

**java****复制代码**

```java
public static void main(String[] args) {
    try(PrintStream stream = new PrintStream(new FileOutputStream("test.txt"))){
        stream.println("lbwnb");   //其实System.out就是一个PrintStream
    }catch (IOException e){
        e.printStackTrace();
    }
}
```

我们平时使用的`println`方法就是PrintStream中的方法，它会直接打印基本数据类型或是调用对象的`toString()`方法得到一个字符串，并将字符串转换为字符，放入缓冲区再经过转换流输出到给定的输出流上。  
因此实际上内部还包含这两个内容：

**java****复制代码**

```java
private BufferedWriter textOut;
private OutputStreamWriter charOut;
```

与此相同的还有一个PrintWriter，不过他们的功能基本一致，PrintWriter的构造方法可以接受一个Writer作为参数，这里就不再做过多阐述了。

而我们之前使用的Scanner，使用的是系统提供的输入流：

**java****复制代码**

```java
public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);   //系统输入流，默认是接收控制台输入
}
```

### 数据流

数据流DataInputStream也是FilterInputStream的子类，同样采用装饰者模式，最大的不同是它支持基本数据类型的直接读取：

**java****复制代码**

```java
public static void main(String[] args) {
    try (DataInputStream dataInputStream = new DataInputStream(new FileInputStream("test.txt"))){
        System.out.println(dataInputStream.readBoolean());   //直接将数据读取为任意基本数据类型
    }catch (IOException e) {
        e.printStackTrace();
    }
}
```

用于写入基本数据类型：

**java****复制代码**

```java
public static void main(String[] args) {
    try (DataOutputStream dataOutputStream = new DataOutputStream(new FileOutputStream("output.txt"))){
        dataOutputStream.writeBoolean(false);
    }catch (IOException e) {
        e.printStackTrace();
    }
}
```

注意，写入的是二进制数据，并不是写入的字符串，使用DataInputStream可以读取，一般他们是配合一起使用的。

### 对象流

既然基本数据类型能够读取和写入基本数据类型，那么能否将对象也支持呢？ObjectOutputStream不仅支持基本数据类型，通过对对象的序列化操作，以某种格式保存对象，来支持对象类型的IO，注意：它不是继承自FilterInputStream的。

**java****复制代码**

```java
public static void main(String[] args) {
    try (ObjectOutputStream outputStream = new ObjectOutputStream(new FileOutputStream("output.txt"));
         ObjectInputStream inputStream = new ObjectInputStream(new FileInputStream("output.txt"))){
        People people = new People("lbw");
        outputStream.writeObject(people);
      	outputStream.flush();
        people = (People) inputStream.readObject();
        System.out.println(people.name);
    }catch (IOException | ClassNotFoundException e) {
        e.printStackTrace();
    }
}

static class People implements Serializable{   //必须实现Serializable接口才能被序列化
    String name;

    public People(String name){
        this.name = name;
    }
}
```

在我们后续的操作中，有可能会使得这个类的一些结构发生变化，而原来保存的数据只适用于之前版本的这个类，因此我们需要一种方法来区分类的不同版本：需要实现序列化 , 实现输出数据流必须要加serialVersionUID ;

序列化就有 , 可以实现区分版本块 :

**java****复制代码**

```java
static class People implements Serializable{
    private static final long serialVersionUID = 123456;   //在序列化时，会被自动添加这个属性，它代表当前类的版本，我们也可以手动指定版本。

    String name;

    public People(String name){
        this.name = name;
    }
}
```

当发生版本不匹配时，会无法反序列化为对象：

**java****复制代码**

```java
java.io.InvalidClassException: com.test.Main$People; local class incompatible: stream classdesc serialVersionUID = 123456, local class serialVersionUID = 1234567
	at java.io.ObjectStreamClass.initNonProxy(ObjectStreamClass.java:699)
	at java.io.ObjectInputStream.readNonProxyDesc(ObjectInputStream.java:2003)
	at java.io.ObjectInputStream.readClassDesc(ObjectInputStream.java:1850)
	at java.io.ObjectInputStream.readOrdinaryObject(ObjectInputStream.java:2160)
	at java.io.ObjectInputStream.readObject0(ObjectInputStream.java:1667)
	at java.io.ObjectInputStream.readObject(ObjectInputStream.java:503)
	at java.io.ObjectInputStream.readObject(ObjectInputStream.java:461)
	at com.test.Main.main(Main.java:27)
```

如果我们不希望某些属性参与到序列化中进行保存，我们可以添加`transient`关键字：

**java****复制代码**

```java
public static void main(String[] args) {
    try (ObjectOutputStream outputStream = new ObjectOutputStream(new FileOutputStream("output.txt"));
         ObjectInputStream inputStream = new ObjectInputStream(new FileInputStream("output.txt"))){
        People people = new People("lbw");
        outputStream.writeObject(people);
        outputStream.flush();
        people = (People) inputStream.readObject();
        System.out.println(people.name);  //虽然能得到对象，但是name属性并没有保存，因此为null
    }catch (IOException | ClassNotFoundException e) {
        e.printStackTrace();
    }
}

static class People implements Serializable{
    private static final long serialVersionUID = 1234567;

    transient String name;

    public People(String name){
        this.name = name;
    }
}
```

其实我们可以看到，在一些JDK内部的源码中，也存在大量的transient关键字，使得某些属性不参与序列化，取消这些不必要保存的属性，可以节省数据空间占用以及减少序列化时间。

### 字节数组流

这个流是一个非常特殊的流，它内部维护了一个`byte[]`类型的对象，用于直接包含流的数据。

有些时候我们可能希望将某些数据直接转换为流的形式，比如字符串：

**java****复制代码**

```java
public static void main(String[] args) throws IOException {
    InputStream stream = new ByteArrayInputStream("我是一个可爱的字符串".getBytes());
    BufferedReader buffered = new BufferedReader(new InputStreamReader(stream));
    System.out.println(buffered.readLine());
}
```

通过构造`ByteArrayInputStream`来快速将我们需要的数据构造为流，它接受一个`byte[]`数组，此数组将直接作为其数据，当对流的数据进行读取时，直接返回数据中的内容。

与之相反的有一个叫`ByteArrayOutputStream`的流，它内部同样维护一个`byte[]`数组，用于存放外部写入的数据，在写入数据完成后，我们可以调用`toByteArray`来获取其中的数据：

**java****复制代码**

```java
public static void main(String[] args) throws IOException {
    ByteArrayOutputStream stream = new ByteArrayOutputStream();
    stream.write("Hello, world!".getBytes());
    System.out.println(new String(stream.toByteArray()));
}
```

### \(Java 9/11/12\) 输入流快捷操作

在Java9之后，InputStream中新增了很多实用的工具方法，这里我们来学习一下。

首先是内容读取，在之前我们如果需要读取一个文本文件的内容，需要写一个循环来不断`read`里面的内容，直到结束，这实在是太繁琐了，通过`available()`获取的剩余容量又不一定准确。所以，从Java 9 开始，官方内置一个新的方法来便于我们一次性读取文件内容，我们终于可以解放双手了：

**java****复制代码**

```java
try (InputStream stream = new FileInputStream("./hello.txt")) {
    byte[] bytes = stream.readAllBytes();   //此方法可以阻塞地一次性读取流中所有剩余字节
    System.out.println(new String(bytes));
} catch (IOException e) {
    e.printStackTrace();
}
```

注意如果流已经被读取完成，调用此方法只能直接返回空数组，因为没数据可读了。

那如果我需要读取指定数量的数据怎么办呢？同样的，Java 9 为我们提供了`readNBytes`方法，它可以更灵活地控制读取流中的多少字节或是哪个位置开始的字节：

**java****复制代码**

```java
try (InputStream stream = new FileInputStream("./hello.txt")) {
    byte[] bytes = new byte[9];
    stream.readNBytes(bytes, 0, bytes.length);  //从流的起始位置开始读取9个字节
    System.out.println(new String(bytes));
} catch (IOException e) {
    e.printStackTrace();
}
```

注意`readNBytes`返回值为实际读取的字节数，因为有可能出现流中数据还没有想要的这么长的情况。

从Java 11开始，我们还可以直接使用一个重载之后的更简单的`readNBytes`方法：

**java****复制代码**

```java
try (InputStream stream = new FileInputStream("./hello.txt")) {
    byte[] bytes = stream.readNBytes(9);   //和readAllBytes一样，直接返回数组
    System.out.println(new String(bytes));
} catch (IOException e) {
    e.printStackTrace();
}
```

它可以直接指定要读取的数量，并返回对应的byte数组。

对于值之前的`skip()`方法，Java 12为我们提供了一个更强大的`skipNBytes`方法，此方法同样用于跳过指定字节，但是其行为是**精确地跳过**输入流中的 `n` 个，它不像`skip()`那样跳过多少算多少，而是要求必须跳过这么多字节，否则抛出`EOFException`异常，比如：

**java****复制代码**

```java
try (InputStream stream = new ByteArrayInputStream("大烟杆嘴里塞，我只抽第五代".getBytes())) {
    stream.skipNBytes(200);
} catch (IOException e) {
    e.printStackTrace();
}
```

Java 11还为我们提供了一个直接生成已读取结束的流的方法：

**java****复制代码**

```java
try (InputStream stream = InputStream.nullInputStream()) { //直接生成一个没有数据的等价于用完的流
    byte[] bytes = stream.readAllBytes();
    System.out.println(new String(bytes));   //读取出来的直接就是一个空数组，因为已经用过了
} catch (IOException e) {
    e.printStackTrace();
}
```

类似的还有OutputStream的`nullOutputStream`方法，生成一个可以无限倾倒数据的输出流，就像给黑洞吞了就没了。

最后还有一个非常实用的方法，它是Java 9提供的`transferTo`，它可以直接将当前输入流中的内容转换到一个输出流中，相当于用一个管道直接把输入输出连接起来，输入的内容直接往输出的地方跑。这就很方便了，比如我们要拷贝一个文件，可以直接使用：

**java****复制代码**

```java
try (InputStream in = new FileInputStream("./hello.txt");
     OutputStream out = new FileOutputStream("./hello2.txt")) {
    in.transferTo(out);   //直接transfer到新文件里，并返回实际传输了多少字节的数据
} catch (IOException e) {
    e.printStackTrace();
}
```

这样，一个文件拷贝就轻松实现了。
