```text
package Next_day;

public class Main {
    public static void main(String[]args){
        String str = "杰哥" + "你干嘛"  ;
        String str2 = "汉堡" ;
        String str3 = "坐的" ;
        String str4 = "行不行" ;
        String str5 = "   " ;

        System.out.println(str.strip());
        System.out.println(str2.stripLeading());   //去除前列的空格
        System.out.println(str3.stripTrailing());  //去除后列的空格
        System.out.println(str + str2 + str3 + str4);


        StringBuilder builder = new StringBuilder() ;
        builder.append("AAA") ;
        builder.insert(1 , "BBB") ;
        builder.delete(2 , 3 ) ;
        System.out.println(builder.toString());

        String fen = """
                shiqihaowuliao@qq.com, 
                17hwliao.io
                相
                """ ;

        String str10 = "shiiqhaowuliao@qq.com" ;

        System.out.println(str10.matches("[A-Za-z0-9]*@[A-zA-z0-9]{1,5}\\.com"));

        System.out.println(test(str10 ,str,89)) ;
        System.out.println(fen);
        System.out.println(new Ppint(1 , 2 ));
        System.out.println(new continuer(1));


    }

    public static String test(Object obj , String str , Integer score) {
        String t = switch (obj) {
            case String _ -> "String";
            case Integer _ -> "Integer";
            case Ppint(int x ,int _) -> "坐标是" + x + " , " + "  " ;
            case continuer(String s ) -> "continue"+ "String" ;
            case null -> "NULL";
            default -> "Other";
        };
        System.out.println(t);

        String type = switch (str) {
            case String s when s.isEmpty() -> "Empty";
            case String s when s.isBlank() -> "Blank";
            case String s when s.length() > 2 -> "haohaiyou";
            default -> "Other";
        };

        if (obj instanceof String) {
            System.out.println("String");
        } else if (obj instanceof Integer) {
            System.out.println("Integer");
        } else {
            System.out.println("Other");
        }


        return switch (score) {
            case Integer c when c >= 90 -> "优秀";
            case Integer c when c >= 80 -> "良好";
            case Integer c when c >= 70 -> "及格";
            default -> "滚蛋";
        } ;
    }
}
```

```text
package Next_day;

public record Ppint(int x , int y ) {
}
```

```text
package Next_day;

public record continuer(Object data) {
}
```
