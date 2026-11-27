```text
package Today;

public class Exercise extends Exception{
    public Exercise(String message){
        super(message);

    }
}
```

```text
package Today;

public class Exercise1 extends RuntimeException {
    public Exercise1(String message) {
        super(message);
    }
}
```

```text
package Today;

import java.io.FileNotFoundException;

public class Main {
    public static void main(String[]args) throws CloneNotSupportedException , Exception , FileNotFoundException , InterruptedException {
        Test n = new Test() ;
        n.clone() ;

        int[] array = new int[11] ;

        //main(args) ;
        try{
            Object obj = null;
            obj.toString();
        } catch(Exception ws){
            ws.printStackTrace() ;
            System.out.println("ws是gay " +"ws发生异常"+ ws.getMessage() );
        }
        System.out.println("ws是gay");

        try{
            tree() ;
        } catch(Exercise1 ws){
            System.out.println("ws是gay , 这里还是没词了" + ws.getMessage());
        }finally{
            System.out.println("ws111是gay");
        }

    }
    private static int div(int a , int b ) throws Exercise {
        if(b == 0){
            throw new Exercise("发现除0" + "     "+"ws是gay") ;
        }
        return a / b ;
    }
    /*
    private static int div1(int a , int b ) throws FileNotFoundException , InterruptedException {
        if(b == 0 ){
            throw new FileNotFoundException() ;
        }
        if(b == - 1 ){
            throw new InterruptedException() ;
        }
        return a / b ;
    }
     */
    private static void tree() {
        throw new Exercise1("我是ws , 我是gay , 单纯想抛出异常") ;
    }
}
```

```text
package Today;

public class Test implements Cloneable{
    @Override
    public Object clone() throws CloneNotSupportedException {
        return super.clone();
    }
}
```
