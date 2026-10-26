```text
package io_17hwlioa;

public class Exercise {

    public static void main(String[] args) throws CloneNotSupportedException {
        Student s = new Student() ;
        s.setName(system.SLEEP);
        System.out.println(s.getName().getName());

        Dingdan m = new Dingdan(1 , "chabaidao" , "xinan") ;
        Dingdan m1 = new Dingdan(2 , "chabaidao" , "xinan") ;
        System.out.println(m);
    }
}
```

```text
package io_17hwlioa;

import java.util.Objects;

public sealed class Person implements Study permits Student  {
    private String name;
    private int age;
    public Person() {

    }

    public Person(String name, int age) {
        this.name = name ;
        this.age = age ;
    }

    public Person(String name){
        this.name = name;
        System.out.println(getname());
    }
    public void unit(String name , int age){
        this.name = name;
        this.age = age;
    }

    public String getname(){
        return name  ;
    }

    public void teach(){
        System.out.println("我爱教Java");
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Person person)) return false;
        return age == person.age && Objects.equals(name, person.name);
    }
    public  void hello() {
        System.out.println("qunide");
    };

}
```

```text
package io_17hwlioa;


public final class Student extends Person implements Study {
    String name ;
    int age  ;
    private system hehe ;
    public Object object  ;

    public Student(String name, int age) {
        super(name, age);
        object  = new Object();
        System.out.println(super.getname());
    }

    public system  getName(){
        return hehe ;
    }

    public void setName(system hehe){
        this.hehe = hehe;
    }



    public Student(String name ){
        super(name );
        this.name = name ;
        System.out.println(super.getname() + name);
    }

    public Student(){} ;
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

public enum system {
    SLEEP("dingyi"), RUNNING("sau") , STUDY ("hui") ;

    String name ;

    system(String name){
        this.name = name;
    }

    public String getName(){
        return name ;
    }
}
```

```text
package io_17hwlioa;

public interface Study {
    default void  study(){
        System.out.println("默认实现");
    }

    private void inner(){
        System.out.println("内部操作");
    }
}
```

```text
package io_17hwlioa;

public record Dingdan(int id , String product , String adress) {
}
```
