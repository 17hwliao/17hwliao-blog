```text
public class Person {
    String name ;
    final int  age = 18 ;
    String gender ;

    {
        System.out.println("xiao ");
    }

    void add_name(String str){
        this.name = str ;
    }

    int sum(int a ,  int  b ){
        return a + b ;
    }

    double sum(double a , double b ){
        return a + b ;
    }

    void say_hello(){
        System.out.println("hello");
    }

    void  say_goodbye(){
        System.out.println("goodbye");
    }

    void test(){
        say_hello();
        say_goodbye();
    }

    long test(int x ){
        if(x <= 0 ) return 0 ;
        if(x  < 3 ) return 1 ;
        long [] dp = new long [ x + 1 ];
        dp[0] = 0 ;
        dp[1] = 1 ;
        dp[2] = 1 ;
        for(int i = 3 ; i <= x ; i ++){
            dp[i] = dp[i - 1] + dp[i -2 ] ;
        }
        return dp[x] ;
    }

    Person(){} ;

    Person(String name , String gender){
        this(name , 16) ;
        this.gender = gender ;
    }

    Person(String name , int age ){
        this.name = name ;
    }
}
```

```text
public class Java01 {
    public static void main(String[] args) {
        Person s  =J new Person("xiaoming" , "nan") ;

        Person s1 = new Person("xiaoming" , "111") ;

        Person s2 = new Person("ashdio" , 123) ;

        System.out.println(s2.age);

        System.out.println(s.sum(10 , 20 ));
    }
}
```
