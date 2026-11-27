**注意：** 本章节涉及到JVM相关底层原理，难度会有一些大。

反射就是把Java类中的各个成分映射成一个个的Java对象。即在运行状态中，对于任意一个类，都能够知道这个类所有的属性和方法，对于任意一个对象，都能调用它的任意一个方法和属性。这种动态获取信息及动态调用对象方法的功能叫Java的反射机制。

简而言之，我们可以通过反射机制，获取到类的一些属性，包括类里面有哪些字段，有哪些方法，继承自哪个类，甚至还能获取到泛型！它的权限非常高，慎重使用！

### Java类加载机制

在学习Java的反射机制之前，我们需要先了解一下类的加载机制，一个类是如何被加载和使用的：

![](</blogs/_assets/lakebook/e55c898ad0f12fc3ed759c25.webp>)

在Java程序启动时，JVM会将一部分类（class文件）先加载（并不是所有的类都会在一开始加载），通过ClassLoader将类加载，在加载过程中，会将类的信息提取出来（存放在元空间中，JDK1\.8之前存放在永久代），同时也会生成一个Class对象存放在内存（堆内存），注意此Class对象只会存在一个，与加载的类唯一对应！

为了方便各位小伙伴理解，你们就直接理解为默认情况下（仅使用默认类加载器）每个类都有且只有一个唯一的Class对象存放在JVM中，我们无论通过什么方式访问，都是始终是那一个对象。Class对象中包含我们类的一些信息，包括类里面有哪些方法、哪些变量等等。

### Class类获取

通过前面，我们了解了类的加载，同时会提取一个类的信息生成Class对象存放在内存中，而反射机制其实就是利用这些存放的类信息，来获取类的信息和操作类。那么如何获取到每个类对应的Class对象呢，我们可以通过以下方式：

**java****复制代码**

```java
public static void main(String[] args) throws ClassNotFoundException {
    Class<String> clazz = String.class;   //使用class关键字，通过类名获取
    Class<?> clazz2 = Class.forName("java.lang.String");   //使用Class类静态方法forName()，通过包名.类名获取，注意返回值是Class<?>
    Class<?> clazz3 = new String("cpdd").getClass();  //通过实例对象获取
}
```

注意Class类也是一个泛型类，只有第一种方法，能够直接获取到对应类型的Class对象，而以下两种方法使用了`?`通配符作为返回值，但是实际上都和第一个返回的是同一个对象：

**java****复制代码**

```java
Class<String> clazz = String.class;   //使用class关键字，通过类名获取
Class<?> clazz2 = Class.forName("java.lang.String");   //使用Class类静态方法forName()，通过包名.类名获取，注意返回值是Class<?>
Class<?> clazz3 = new String("cpdd").getClass();

System.out.println(clazz == clazz2);
System.out.println(clazz == clazz3);
```

通过比较，验证了我们一开始的结论，在JVM中每个类始终只存在一个Class对象，无论通过什么方法获取，都是一样的。现在我们再来看看这个问题：

**java****复制代码**

```java
public static void main(String[] args) {
    Class<?> clazz = int.class;   //基本数据类型有Class对象吗？
    System.out.println(clazz);
}
```

迷了，不是每个类才有Class对象吗，基本数据类型又不是类，这也行吗？实际上，基本数据类型也有对应的Class对象（反射操作可能需要用到），而且我们不仅可以通过class关键字获取，其实本质上是定义在对应的包装类中的：

**java****复制代码**

```java
/**
 * The {@code Class} instance representing the primitive type
 * {@code int}.
 *
 * @since   JDK1.1
 */
@SuppressWarnings("unchecked")
public static final Class<Integer>  TYPE = (Class<Integer>) Class.getPrimitiveClass("int");

/*
 * Return the Virtual Machine's Class object for the named
 * primitive type
 */
static native Class<?> getPrimitiveClass(String name);   //C++实现，并非Java定义
```

每个包装类中（包括Void），都有一个获取原始类型Class方法，注意，getPrimitiveClass获取的是原始类型，并不是包装类型，只是可以使用包装类来表示。

**java****复制代码**

```java
public static void main(String[] args) {
    Class<?> clazz = int.class;
    System.out.println(Integer.TYPE == int.class);
}
```

通过对比，我们发现实际上包装类型都有一个TYPE，其实也就是基本类型的Class，那么包装类的Class和基本类的Class一样吗？

**java****复制代码**

```java
public static void main(String[] args) {
    System.out.println(Integer.TYPE == Integer.class);
}
```

我们发现，包装类型的Class对象并不是基本类型Class对象。

数组类型也是一种类型，只是编程不可见，因此我们可以直接获取数组的Class对象：

**java****复制代码**

```java
public static void main(String[] args) {
    Class<String[]> clazz = String[].class;
    System.out.println(clazz.getName());  //获取类名称（得到的是包名+类名的完整名称）
    System.out.println(clazz.getSimpleName());
    System.out.println(clazz.getTypeName());
    System.out.println(clazz.getClassLoader());   //获取它的类加载器
    System.out.println(clazz.cast(new Integer("10")));   //强制类型转换
}
```

下节课，我们将开始对Class对象的使用进行讲解。

### Class对象与多态

正常情况下，我们使用instanceof进行类型比较：

**java****复制代码**

```java
public static void main(String[] args) {
    String str = "";
    System.out.println(str instanceof String);
}
```

它可以判断一个对象是否为此接口的实现或是类的子类，而现在我们有了更多的方式去判断类型：

**java****复制代码**

```java
public static void main(String[] args) {
    String str = "";
    System.out.println(str.getClass() == String.class);   //直接判断是否为这个类型
}
```

如果需要判断是否为子类或是接口/抽象类的实现，我们可以使用`asSubClass()`方法：

**java****复制代码**

```java
public static void main(String[] args) {
    Integer i = 10;
    i.getClass().asSubclass(Number.class);   //当Integer不是Number的子类时，会产生异常
}
```

通过`getSuperclass()`方法，我们可以获取到父类的Class对象：

**java****复制代码**

```java
public static void main(String[] args) {
    Integer i = 10;
    System.out.println(i.getClass().getSuperclass());
}
```

也可以通过`getGenericSuperclass()`获取父类的原始类型的Type：

**java****复制代码**

```java
public static void main(String[] args) {
    Integer i = 10;
    Type type = i.getClass().getGenericSuperclass();
    System.out.println(type);
    System.out.println(type instanceof Class);
}
```

我们发现Type实际上是Class类的父接口，但是获取到的Type的实现并不一定是Class。

同理，我们也可以像上面这样获取父接口：

**java****复制代码**

```java
public static void main(String[] args) {
    Integer i = 10;
    for (Class<?> anInterface : i.getClass().getInterfaces()) {
        System.out.println(anInterface.getName());
    }
  
  	for (Type genericInterface : i.getClass().getGenericInterfaces()) {
        System.out.println(genericInterface.getTypeName());
    }
}
```

是不是感觉反射功能很强大？几乎类的所有信息都可以通过反射获得。

### 创建类对象

既然我们拿到了类的定义，那么是否可以通过Class对象来创建对象、调用方法、修改变量呢？当然是可以的，那我们首先来探讨一下如何创建一个类的对象：

**java****复制代码**

```java
public static void main(String[] args) throws InstantiationException, IllegalAccessException {
    Class<Student> clazz = Student.class;
    Student student = clazz.newInstance();
    student.test();
}

static class Student{
    public void test(){
        System.out.println("萨日朗");
    }
}
```

通过使用`newInstance()`方法来创建对应类型的实例，返回泛型T，注意它会抛出InstantiationException和IllegalAccessException异常，那么什么情况下会出现异常呢？

**java****复制代码**

```java
public static void main(String[] args) throws InstantiationException, IllegalAccessException {
    Class<Student> clazz = Student.class;
    Student student = clazz.newInstance();
    student.test();
}

static class Student{

    public Student(String text){
        
    }

    public void test(){
        System.out.println("萨日朗");
    }
}
```

当类默认的构造方法被带参构造覆盖时，会出现InstantiationException异常，因为`newInstance()`只适用于默认无参构造。

**java****复制代码**

```java
public static void main(String[] args) throws InstantiationException, IllegalAccessException {
    Class<Student> clazz = Student.class;
    Student student = clazz.newInstance();
    student.test();
}

static class Student{

    private Student(){}

    public void test(){
        System.out.println("萨日朗");
    }
}
```

当默认无参构造的权限不是`public`时，会出现IllegalAccessException异常，表示我们无权去调用默认构造方法。在JDK9之后，不再推荐使用`newInstance()`方法了，而是使用我们接下来要介绍到的，通过获取构造器，来实例化对象：

**java****复制代码**

```java
public static void main(String[] args) throws NoSuchMethodException, InvocationTargetException, InstantiationException, IllegalAccessException {
    Class<Student> clazz = Student.class;
    Student student = clazz.getConstructor(String.class).newInstance("what's up");
    student.test(); 
}

static class Student{

    public Student(String str){}

    public void test(){
        System.out.println("萨日朗");
    }
}
```

通过获取类的构造方法（构造器）来创建对象实例，会更加合理，我们可以使用`getConstructor()`方法来获取类的构造方法，同时我们需要向其中填入参数，也就是构造方法需要的类型，当然我们这里只演示了。那么，当访问权限不是public的时候呢？

**java****复制代码**

```java
public static void main(String[] args) throws NoSuchMethodException, InvocationTargetException, InstantiationException, IllegalAccessException {
    Class<Student> clazz = Student.class;
    Student student = clazz.getConstructor(String.class).newInstance("what's up");
    student.test();
}

static class Student{

    private Student(String str){}

    public void test(){
        System.out.println("萨日朗");
    }
}
```

我们发现，当访问权限不足时，会无法找到此构造方法，那么如何找到非public的构造方法呢？

**java****复制代码**

```java
Class<Student> clazz = Student.class;
Constructor<Student> constructor = clazz.getDeclaredConstructor(String.class);
constructor.setAccessible(true);   //修改访问权限
Student student = constructor.newInstance("what's up");
student.test();
```

使用`getDeclaredConstructor()`方法可以找到类中的非public构造方法，但是在使用之前，我们需要先修改访问权限，在修改访问权限之后，就可以使用非public方法了（这意味着，反射可以无视权限修饰符访问类的内容）

### 调用类方法

我们可以通过反射来调用类的方法（本质上还是类的实例进行调用）只是利用反射机制实现了方法的调用，我们在包下创建一个新的类：

**java****复制代码**

```java
package com.test;

public class Student {
    public void test(String str){
        System.out.println("萨日朗"+str);
    }
}
```

这次我们通过`forName(String)`来找到这个类并创建一个新的对象：

**java****复制代码**

```java
public static void main(String[] args) throws ReflectiveOperationException {
    Class<?> clazz = Class.forName("com.test.Student");
    Object instance = clazz.newInstance();   //创建出学生对象
    Method method = clazz.getMethod("test", String.class);   //通过方法名和形参类型获取类中的方法
    
    method.invoke(instance, "what's up");   //通过Method对象的invoke方法来调用方法
}
```

通过调用`getMethod()`方法，我们可以获取到类中所有声明为public的方法，得到一个Method对象，我们可以通过Method对象的`invoke()`方法（返回值就是方法的返回值，因为这里是void，返回值为null）来调用已经获取到的方法，注意传参。

我们发现，利用反射之后，在一个对象从构造到方法调用，没有任何一处需要引用到对象的实际类型，我们也没有导入Student类，整个过程都是反射在代替进行操作，使得整个过程被模糊了，过多的使用反射，会极大地降低后期维护性。

同构造方法一样，当出现非public方法时，我们可以通过反射来无视权限修饰符，获取非public方法并调用，现在我们将`test()`方法的权限修饰符改为private：

**java****复制代码**

```java
public static void main(String[] args) throws ReflectiveOperationException {
    Class<?> clazz = Class.forName("com.test.Student");
    Object instance = clazz.newInstance();   //创建出学生对象
    Method method = clazz.getDeclaredMethod("test", String.class);   //通过方法名和形参类型获取类中的方法
    method.setAccessible(true);

    method.invoke(instance, "what's up");   //通过Method对象的invoke方法来调用方法
}
```

Method和Constructor都和Class一样，他们存储了方法的信息，包括方法的形式参数列表，返回值，方法的名称等内容，我们可以直接通过Method对象来获取这些信息：

**java****复制代码**

```java
public static void main(String[] args) throws ReflectiveOperationException {
    Class<?> clazz = Class.forName("com.test.Student");
    Method method = clazz.getDeclaredMethod("test", String.class);   //通过方法名和形参类型获取类中的方法
    
    System.out.println(method.getName());   //获取方法名称
    System.out.println(method.getReturnType());   //获取返回值类型
}
```

当方法的参数为可变参数时，我们该如何获取方法呢？实际上，我们在之前就已经提到过，可变参数实际上就是一个数组，因此我们可以直接使用数组的class对象表示：

**java****复制代码**

```java
Method method = clazz.getDeclaredMethod("test", String[].class);
```

反射非常强大，尤其是我们提到的越权访问，但是请一定谨慎使用，别人将某个方法设置为private一定有他的理由，如果实在是需要使用别人定义为private的方法，就必须确保这样做是安全的，在没有了解别人代码的整个过程就强行越权访问，可能会出现无法预知的错误。

### 修改类的属性

我们还可以通过反射访问一个类中定义的成员字段也可以修改一个类的对象中的成员字段值，通过`getField()`方法来获取一个类定义的指定字段：

**java****复制代码**

```java
public static void main(String[] args) throws ReflectiveOperationException {
    Class<?> clazz = Class.forName("com.test.Student");
    Object instance = clazz.newInstance();

    Field field = clazz.getField("i");   //获取类的成员字段i
    field.set(instance, 100);   //将类实例instance的成员字段i设置为100

    Method method = clazz.getMethod("test");
    method.invoke(instance);
}
```

在得到Field之后，我们就可以直接通过`set()`方法为某个对象，设定此属性的值，比如上面，我们就为instance对象设定值为100，当访问private字段时，同样可以按照上面的操作进行越权访问：

**java****复制代码**

```java
public static void main(String[] args) throws ReflectiveOperationException {
    Class<?> clazz = Class.forName("com.test.Student");
    Object instance = clazz.newInstance();

    Field field = clazz.getDeclaredField("i");   //获取类的成员字段i
    field.setAccessible(true);
    field.set(instance, 100);   //将类实例instance的成员字段i设置为100

    Method method = clazz.getMethod("test");
    method.invoke(instance);
}
```

现在我们已经知道，反射几乎可以把一个类的老底都给扒出来，任何属性，任何内容，都可以被反射修改，无论权限修饰符是什么，那么，如果我的字段被标记为final呢？现在在字段`i`前面添加`final`关键字，我们再来看看效果：

**java****复制代码**

```java
private final int i = 10;
```

我们可以发现，反射非常暴力，就连被定义为final字段的值都能强行修改，几乎能够无视一切阻拦。

我们来试试看修改一些其他的类型，比如JDK的官方类：

**java****复制代码**

```java
public static void main(String[] args) throws ReflectiveOperationException {
    List<String> i = new ArrayList<>();

    Field field = ArrayList.class.getDeclaredField("size");
    field.setAccessible(true);
    field.set(i, 10);

    i.add("测试");   //只添加一个元素
    //得到数组越界异常
}
```

**注意：** 在Java 9之后，需要修改启动参数才能对官方类的私有属性的访问权限进行修改，打开IDEA，添加启动参数：`--add-opens java.base/java.util=ALL-UNNAMED`，这里的`java.util=ALL-UNNAMED`需要修改为对应的包名。

实际上，整个ArrayList体系由于我们的反射操作，导致被破坏，因此它已经无法正常工作了，同样的，我们甚至能直接通过反射修改String的值：

**java****复制代码**

```java
String str = "Hello";
Class<String> stringClass = String.class;
Field value = stringClass.getDeclaredField("value");
value.setAccessible(true);
value.set(str, "World".getBytes());
System.out.println(str);
```

可以看到，我们通过反射强行修改了String内部的`value`字段（存储字符串内容的数组）打破了String为不可变字符串的约束，轻松破坏了Java世界的规则。再次强调，在进行反射操作时，必须注意是否安全，虽然拥有了创世主的能力，但是我们不能滥用，非特殊情况请不用使用反射API。

### \(Java 9\) 模块化机制

在Java 9之前，Java程序主要是以 "包 \(package\)" 的方式组织代码，但是所有的代码都在一个整体中运行，没有明确的边界。Java 9引入\*\*模块（Module）\*\*的概念，帮助开发者更好地组织、封装和管理大型应用程序。模块化带来的优点：

- **更好的封装**：只暴露需要对外使用的接口，其余内部实现细节隐藏起来。
- **依赖管理**：明确模块之间的依赖关系，避免“依赖地狱”。
- **更快的启动和更小的内存占用**：只加载需要的模块。
- **更易维护和扩展**：大型项目变得更有条理。

可见，模块化机制实际上是为大型项目准备的，而我们目前阶段仅仅还在初学状态，这里可以为大家简单介绍一下项目如何进行模块化开发。我们可以将项目分为多个子模块，不同模块开发不同的内容，然后相互作为依赖使用。

![](</blogs/_assets/lakebook/207a9cf0150ea599809f7c72.webp>)

比如我们可以在`app`模块中将`utils`作为依赖导入：

![](</blogs/_assets/lakebook/bafe7ba80aa0667e47ed8219.webp>)

此时我们就可以在`app`中直接使用`utils`里面定义的类和方法了，同样可以进行包的导入，就像使用JDK官方提供的类那样。当然，在JavaWeb阶段我们还会学习Maven，它相比我们这里的简单模块化来说，是一个更加强大的依赖管理和模块化工具，使用Maven来引入我们自己的模块或是别人的框架模块会更加简单和方便，现代化企业级项目基本都是基于Maven或Gradle进行开发。不过，无论通过哪种方式引入，实际上都适用于Java9的模块化机制。

项目现在是模块化的了，那么到底如何才能使用Java9的模块化机制呢？模块具有四种类型，我们首先介绍一下**应用程序模块**，在我们自己的项目中，我们可以在某个模块下的源代码根路径下新建一个叫做`module-info.java`的文件，它用于配置模块化信息：

**java****复制代码**

```java
module hello.utils {
    
}
```

这里使用`module`关键字（此关键字仅在模块化声明文件中生效）声明模块的名称，后面需要跟随一个花括号。

声明模块后，我们会发现项目中某些类无法正常使用了：

![](</blogs/_assets/lakebook/2b2ce12631ad3354c90c349a.webp>)

这是因为我们现在使用了模块机制，我们如果需要使用其他模块，需要手动进行导入，默认情况下，包中如果没有创建`module-info.java`文件，那么会按照**未命名模块**进行处理，未命名模块同样可以访问所有其他模块提供的类，这样我们之前写的Java 8代码才能正常地在Java 9以及之后的版本下运行。要在模块化的子模块中导入其他未命名模块，我们只需要使用其他模块的默认名称即可：

**java****复制代码**

```java
module hello.app {
    requires utils;   //其他模块的名称，默认是IDEA中的子模块名称
}
```

通过`requires`关键字来导入模块，此时我们就成功引入了一个未命名模块，其中的类型就可以正常使用了。除此之外，我们也可以让这些模块同样包含一个`module-info.java`文件，并且为其手动指定模块名称：

**java****复制代码**

```java
module hello.utils {

}
```

此时我们就可以使用文件中定义的模块名称进行导入了：

**java****复制代码**

```java
module hello.app {
    requires hello.utils;  //输入模块名称
}
```

不过此时依然会出现模块中类无法使用的问题，这是因为模块化之后，我们还需要手动指定哪些包可以供其他模块导入使用才可以，由于我们之前没有使用Java 9的模块新特性，**未命名模块**只能默认暴露给其他未命名的模块和自动模块，应用程序模块无法访问这些类（实际上就是传统Java 8以下的编程模式，因为没有模块只需要导入依赖就能直接用）现在模块化之后 ，我们需要使用`export`关键字来手动暴露哪些运行其他模块访问：

**java****复制代码**

```java
module hello.utils {
    exports com.test.utils;  //输入你想要允许其他模块访问的包
}
```

添加之后，这个包下的所有内容就可以在外部使用了，但是项目中未暴露的包依然是无法被外部模块去使用的。

- 除了我们这里介绍的两种模块之外，还有一个叫做 **系统模块** 它是来自JDK和JRE的模块（官方提供的模块，比如我们之前使用的所有类都算），我们也可以直接使用`java --list-modules`命令来列出所有的模块，不同的模块会导出不同的包供我们使用。其中`java.base`模块包含我们之前使用的核心类如`java.lang`、`java.util`等，这个模块不需要我们手动进行导入，会自动包含。
- 当然，针对于一些可能并不是Java 9以上的模块项目，这种时候就需要做兼容了，默认情况下是直接导出所有的包，可以访问所有其他模块提供的类，不然之前版本的库就用不了了，这种类型的模块我们称为**自动模块**。

我们最后来回顾一下前面讲解的反射机制，我们发现如果我们现在虽然可以依赖了一个模块，但是是没办法直接进行越级反射操作的：

**java****复制代码**

```java
Class<Utils> utilsClass = Utils.class;
Method hello = utilsClass.getDeclaredMethod("hello");
hello.setAccessible(true);
hello.invoke( null);
```

![](</blogs/_assets/lakebook/52ddab72698b63abb69f9f3f.webp>)

这个错误实际上在我们前面的JDK类中进行反射操作也出现了，要允许其他模块使用越级反射操作，我们可以在模块的前面添加`open`关键字来允许其他模块的越级访问操作：

**java****复制代码**

```java
open module hello.utils {
    exports com.test.utils;
    //open也可以单独指定某个包
}
```

此时我们再去使用反射修改权限就没有问题了。而前面修改JDK类遇到的问题也是一样的原因，因为默认情况下JDK的官方模块并未向我们open访问权限，所以无法直接进行越级反射操作。除此之外，模块还支持单独标明接口和模块对于接口的实现，用到`provide`和`uses`关键字，有关具体内容我们会在JavaWeb阶段进一步补充。

### 类加载器

我们接着来介绍一下类加载器，实际上类加载器就是用于加载一个类的，但是类加载器并不是只有一个。我们来研究一下Java9之后的类加载机制（Java8之前流程请看旧版课程）

ClassLoader（类加载器）是Java中的一个重要组件，负责在运行时将类的字节码加载到JVM中。

Java中所有的类都是依靠类加载器进行加载并生成对应的Class对象，类加载器不止一个而是有多个，不同的类加载器的职责也不一样，类加载器默认有以下三种：

- **BootClassLoader**：启动类加载器，用于加载JDK核心模块，如`java.base`、`java.desktop`、`java.logging` 等。
- **PlatformClassLoader**：平台类加载器，用于加载一些平台相关模块，也就是一些扩展类，如`java.compiler`、`java.sql`等。
- **AppClassLoader**：应用类加载器，主要用于加载我们自己编写的类，以及其他JDK中没有被上述两个类加载器加载的模块和类。

对于采用模块化的项目来说，在程序启动后，根据不同的模块划分，不同类会在一开始直接分配给对应的ClassLoader进行加载：

![](</blogs/_assets/lakebook/4658fa9539b5100af52e284a.webp>)

对于传统非模块化项目来说，在程序启动后，会按照Java8之前的双亲委派机制进行类的加载：

![](</blogs/_assets/lakebook/c9617bef52fe0d395bf820b5.webp>)

当类需要进行加载时，默认会由最下层的AppClassLoader接手，但并不会立即加载类，而是向上传递询问其父类加载器PlatformClassLoader能否进行加载，同样的PlatformClassLoader也不会立即加载，而是继续向上传递到顶层BootClassLoader进行判断，如果顶层可以直接加载这些类（比如JDK核心类就可以直接加载）那么会直接在BootClassLoader中完成类加载，并直接得到对应的Class对象，如果顶层不行，再继续向下让PlatformClassLoader进行加载，如果还是无法加载，最后才会让AppClassLoader尝试加载，比如我们自己编写的类就是由AppClassLoader完成加载的，这样的类加载机制我们也叫**双亲委派机制**。

我们可以来观察下不同类的类加载器：

**java****复制代码**

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(Main.class.getClassLoader());   //查看当前类的类加载器
        System.out.println(Main.class.getClassLoader().getParent());  //父加载器
        System.out.println(Main.class.getClassLoader().getParent().getParent());  //爷爷加载器
        System.out.println(String.class.getClassLoader());   //JDK中String类的加载器
    }
}
```

由于早期BootClassLoader是由C\+\+编写的（叫做BootstarpClassLoader），因此在之前无法获取到对应的对象，Java9之后虽然已经变成Java类，但是为了保持统一就依然保持返回`null`作为结果。

通过前面的了解，既然通过ClassLoader就可以用来加载类，那么我们可以自己手动将class文件加载到JVM中吗？先写好我们定义的类：

**java****复制代码**

```java
package com.test;

public class Test {
    public String text;

    public void test(String str){
        System.out.println(text+" > 我是测试方法！"+str);
    }
}
```

通过javac命令，手动编译一个\.class文件：

**java****复制代码**

```java
nagocoler@NagodeMacBook-Pro HelloWorld % javac src/main/java/com/test/Test.java
```

编译后，得到一个class文件，我们把它放到根目录下。因为上面提到的这三种ClassLoader都无法直接加载class文件，因此我们需要编写一个自定义的类加载器来让它支持读取byte数据加载类文件：

**java****复制代码**

```java
//自己定义一个ClassLoader
static class TestClassLoader extends ClassLoader {
    public Class<?> loadClass(String name, String file) throws ClassNotFoundException {
        try(InputStream stream = new FileInputStream(file)) {  //读取磁盘类文件
            byte[] bytes = stream.readAllBytes();
            return defineClass(name, bytes, 0, bytes.length);  //使用父类提供的defineClass通过byte数据加载类
        } catch (IOException e) {
            throw new ClassNotFoundException(e.getMessage());
        }
    }
}

public static void main(String[] args) throws ClassNotFoundException {
    TestClassLoader classLoader = new TestClassLoader();
    System.out.println(classLoader.getParent());
    Class<?> clazz = classLoader.loadClass("com.test.Test", "Test.class");
    System.out.println(clazz);
}
```

现在，我们就将此class文件读取并解析为Class了，并且我们自己创建的类加载器，会将AppClassLoader作为父类加载，现在我们就可以对此类进行操作了（注意，我们无法在代码中直接使用此类型，因为它是我们直接加载的，只能通过反射来操作），我们来试试看创建一个此类的对象并调用其方法：

**java****复制代码**

```java
try {
    Object obj = clazz.newInstance();
    Method method = clazz.getMethod("test", String.class);   //获取我们定义的test(String str)方法
    method.invoke(obj, "哥们这瓜多少钱一斤？");
}catch (Exception e){
    e.printStackTrace();
}
```

我们来试试看修改成员字段之后，再来调用此方法：

**java****复制代码**

```java
try {
    Object obj = clazz.newInstance();
    Field field = clazz.getField("text");   //获取成员变量 String text;
    field.set(obj, "华强");
    Method method = clazz.getMethod("test", String.class);   //获取我们定义的test(String str)方法
    method.invoke(obj, "哥们这瓜多少钱一斤？");
}catch (Exception e){
    e.printStackTrace();
}
```

通过这种方式，我们就可以实现外部加载甚至是网络加载一个类，只需要把类文件传递即可，这样就无需再将代码写在本地，而是动态进行传递，不仅可以一定程度上防止源代码被反编译（只是一定程度上，想破解你代码有的是方法），而且在更多情况下，我们还可以对byte\[\]进行加密，保证在传输过程中的安全性。
