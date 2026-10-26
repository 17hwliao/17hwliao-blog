```text
package com_java;

import java.util.* ;

public class Java01 {
    public static void main(String[] args) {
        Person p = Person.new_i();
        Student s = new Student();
        s.setName("xiao");
        s.study();
        Student student = new Student();
        Student student2 = new Student();
        test(student2) ;

    }

}
```

```text
package com_java;

public class Person {
     String name ;
     int age;

    public Person(String ahs, int i) {
        name = ahs;
        age = i;
    }

    public Person() {
        String name ;
        int age ;
    }

    public void setName( String name ) {
        //封装name
        this. name = name ;
    }
    public void setAge(int age) {
        //封装age
        this.age = age;
    }
    public int getAge() {
        return age;
    }
    public String getName() {
        return name;
    }

    public static Person new_i(){
        //实现封装创建
        return new Person() ;
    }
}
```

```text
package com_java;

public class Student extends Person {

    String name;

    public Student(){
        super("ahs" , 11) ;
    }

    public void study(){
        System.out.println(super.name + age);
    }

}
```
