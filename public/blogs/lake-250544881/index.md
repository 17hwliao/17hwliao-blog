```text
package Today;

public interface Add {
    public int add(int a , int b )  ;
}
```

```text
package Today;

public class Fulei {
    String name  ;

    public Fulei(String name){
        this.name = name ;
    }

    public String Lulao(){
        return ("得得得得得得得得得");
    }
}
```

```text
package Today;

public interface haoa {
    int  haoa(String a) ;
}
```

```text
package Today;

public class Main {
    public static void main(String[]args){
        Test s = new Test("ws1");
        Test.Inner inner = new Test.Inner("wss1") ;
        inner.text("ws0");

        Test s1 = new Test("ws2") ;
        Test.Inner inner1 = new Test.Inner("wss2") ;
        inner1.text("ws00");

        class Inner{
            void text(){
                System.out.println("ws是gay");
            }
        }

        Inner inner0 = new Inner() ;
        inner.text("ws00");

        class Inner11 extends Person{
            @Override
            public void study() {} ;
        }

        Person p = new Person(){
            String name  = ",ws说自己是gay" ;
            public void study(){
                System.out.println("ws是gay" + name );
            } ;
        } ;
        p.study();

        Fulei f = new Fulei("ws"){
            {
                System.out.println(name + "是gay");
            }
        } ;

        Add ws1 = (a , b ) -> a + b  ;
        System.out.println(ws1.add(1,2));

        Add ws2 = Integer:: sum ;
        System.out.println(ws2.add(1,2));

        Fulei ws22 = new Fulei("卢姥爷");
        Study ss =  ws22::Lulao;
        System.out.println(ss.study());

        haoa a = String::length;
        String ws111 = "得得得得得得得得得" ;
        System.out.println(a.haoa(ws111));
    }

    private static void test(Study s){
        s.study() ;
    }


}
```

```text
package Today;

public abstract class Person {
    String name ;
    public abstract void study() ;
}
```

```text
package Today;

public interface Study {
    public String study();
}
```

```text
package Today;

public class Test {

    String name ;
    public Test(String name){
        this.name = name ;
    }

    static class Inner{
        String name ;

        public Inner(String name){
            this.name = name;
        }

        public void text(String name) {
            System.out.println(name + "是gay");
            System.out.println(this.name + "是gay");

        }
    }

}
```
