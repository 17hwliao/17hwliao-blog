```text
package Today;

import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier ;

public class Today {
    public static void main(String[]args){
        Ws0<String> ws0 = new Ws0<String>();

        ws0.setName(()->{
            return "ws" ;
        }) ;

        Consumer<String> consumer = name -> {
            if(name.length() < 10 ){
                System.out.println("ws是gay");
            }else{
                System.out.println("ws一直是gay");
            }
        };

        consumer = consumer.andThen(name -> {
            System.out.println("ws是gay啊");
        }) ;

        ws0.usename(consumer);

        ws0.namelength(String::length);

        Function<String , byte[]> f = str -> str.getBytes();
        Function<String , Integer> f2 = f.andThen(bytes -> bytes.length) ;
        Function<String , String> f3 = f2.andThen(Integer::toHexString) ;

        ws0.nameInvalid(name -> name.length()>=3);

        Predicate<String> predicate = name -> name.length()>=3;
        predicate = predicate.and(name -> name.length() < 10);

    }

        private static void test1(String str){
            System.out.println(Optional.ofNullable(str).filter(s->s.length()>2).get());
        }

}
```

```text
package Today;

import java.util.Optional;
import java.util.function.*;

public class Ws0<T> {
    private String name ;
    int id ;
    T  score ;


    public void Ws(String name , int id , T score ){
        this.name = name;
        this.id = id;
        this.score = score;
    }

    public void setName(Supplier<String> supplier){
        this.name = supplier.get() ;
    }

    public String getname(){
        String name = new String();
        name = this.name ;
        return  name ;
    }

    public void usename(Consumer<String> consumer){
        consumer.accept(name) ;
    }

    public void namelength(Function<String , Integer> function){
        Integer apply = function.apply(name);
        System.out.println("name的长度"+apply);
     }

    public void nameInvalid(Predicate<String> predicate){
        boolean test = predicate.test(name) ;
        System.out.println(test ? "是gay" : "骗你的还是gay");
    }

    public void nameid(BiConsumer<String, Integer> biConsumer){
        biConsumer.accept(name,id);
    }

    private static void test(String name){
        System.out.println(name) ;
        Optional.ofNullable(name).ifPresent(s -> System.out.println(s.length()));
    }
}
```
