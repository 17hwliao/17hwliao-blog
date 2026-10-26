```text
package Today;

public class Today {
    public static void main(String[] args) {
        New_class<Integer> ws0 = new New_class<>("ws", 4, 0);
        New_class<String> ws1 = new New_class<>("ws" ,2 , "是gay");
        New_class<?> ws2 = ws1 ;

    }

    abstract class New<T> {
        T name ;
    }

    interface New1<T> {
        T study(T name) ;
    }

    record Date<T>(T data){} ;

    static class Test implements New1<String>{
        @Override
        public String study(String n) {
            return "";
        }

        static class Test1<T> implements New1<T>{
            @Override
            public T study(T name) {
                return null;
            }
        }
    }

}
```

```text
package Today;

public class New_class<T> {
    String name ;
    int date ;
    T value ;

    New_class(String name , int date , T vlaue){
        this.name = name;
        this.date = date;
        this.value = vlaue;
        System.out.println(name + date + value);
    } ;

    public void Score(){
        System.out.println("name"+ "是gay" );
    }

    public T GetValuee(){
            return value ;
    }
}
```
