```text
package io_17hwlioa;

public class Exercise {
    public static void main(String[] args) {

        Student student = new Student("shiqi" ) ;

        test( student ) ;
        student.teach() ;

        Person p1 = new Person() ;
        p1.study();
        student.study(); ;
        p1.teach() ;
        p1.hello() ;
        student.hello() ;

    }

    private static void test(Person s){
        if(s instanceof Student stu){
            stu.study();
        } else if( s instanceof Person se){
            se.teach() ;
        } else{
            System.out.println("111");
        }
    }









}
```

```text
package io_17hwlioa;


public class Student extends Person implements Study ,Hello{
    String name ;
    int age  ;

    public Student(String name, int age) {
        super(name, age);
        System.out.println(super.getname());
    }
    public Student(String name ){
        super(name );
        this.name = name ;
        System.out.println(super.getname() + name);
    }
    public void study(){
        System.out.println("我爱java");
    }

    @Override
    public void teach(){
        System.out.println("我要教同学java");
    }

    public void hello(){
        System.out.println("hello");
    }

}
```

```text
package io_17hwlioa;

public interface Study {
    void study() ;
}
```

```text
package io_17hwlioa;

public interface Hello {
    void hello() ;
}
```

```text
package io_17hwlioa;


public class Student extends Person implements Study ,Hello{
    String name ;
    int age  ;

    public Student(String name, int age) {
        super(name, age);
        System.out.println(super.getname());
    }
    public Student(String name ){
        super(name );
        this.name = name ;
        System.out.println(super.getname() + name);
    }
    public void study(){
        System.out.println("我爱java");
    }

    @Override
    public void teach(){
        System.out.println("我要教同学java");
    }

    public void hello(){
        System.out.println("hello");
    }

}
```
