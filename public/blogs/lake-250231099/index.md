```text
package io_17hwlioa;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.util.ArrayList;

public class Exercise {

    public static void main(String[] args) throws CloneNotSupportedException {
        Student s = new Student() ;
        s.setName(system.SLEEP);
        System.out.println(s.getName().getName());

        Dingdan m = new Dingdan(1 , "chabaidao" , "xinan") ;
        Dingdan m1 = new Dingdan(2 , "chabaidao" , "xinan") ;
        System.out.println(m);

        Integer q = 222 ;

        Integer a = 10 , b = 2  ;

        int p = a.intValue() * b.intValue() ;
        Integer c = 10 ;
        System.out.println( a == c );

        Integer a1 = 1221 ;
        Integer b1 = 1222 ;
        int c1 = a1 ;
        System.out.println(a1.compareTo(b1));

        BigInteger a2 = BigInteger.valueOf(1211212223423423L);
        BigInteger b2 = BigInteger.valueOf(Long.MAX_VALUE);
        BigInteger c2 = BigInteger.valueOf(Long.MAX_VALUE);
        BigInteger a3 = b2.multiply(a2);
        System.out.println(a3);
        System.out.println(a3.bitLength());
        System.out.println(a3.pow(1));

        BigDecimal d = BigDecimal.valueOf(29);
        BigDecimal result = d.divide(BigDecimal.valueOf(3) , 1 , RoundingMode.HALF_UP);
        System.out.println(result);
;
        String[] str ;
        str = new String[]{ "qqqq ", "sssss" , "wwwwww"};

        test(222,str ) ;

        for (String arg : args) {
            System.out.println(arg);
        }

        String s1 = "hell o " ;
        String[] brr = s1.split(" ");
        System.out.println(s1.replace("hell", "ciall" ));

        for (String string : brr) {
            System.out.println(string);
        }

        char[] chara = {'1' ,'2' , '3'} ;
        System.out.println(new String(chara));

    }

    private static void test(  int si  ,String... text){
        System.out.println("传入参数" + text.length);
        for(var it : text){
            System.out.println(it);
        }
        System.out.println(si);
    }
}
```
