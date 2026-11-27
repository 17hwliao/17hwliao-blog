- 代码训练 :

1. toString实现将对象转化为字符串进行输出 \( 在自己建的类中需要重写实现否则无实际意义 \[ @1b6d3586 \] , 数组中的Arrays\.toString已经重写过可以输出数组全部内容 \(直接输出\[I@1b6d3586（没意义）\) \)
2. String s \= cin\.nextLine\( 直接读取一行 \) ;
3. 获取字符cin\.next\("\[a\-zA\-Z\]"\) \[ 正则表达式 \]; 类型获取 : next \+ 类型 ; 通过String获取字符: charAt\(下标\) ;
4. 将String类型直接转化为char类型数组 :

char\[\] arr \= s\.toCharArray\(\) ;

5. 创建类的时候一定要加上构造方法

```text
private  static void Bubble_Sort(int[] arr){
    for(int i= 0  ; i < arr.length -1 ; i ++){
        boolean flag = false;
        for(int j = 0 ; j < arr.length  -1 - i ; j++){
            if(arr[j] > arr[j+1]){
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
                flag = true ;
            }
        }
        if(!flag) break ; 
    }
}
```

```text
    private static int Bin_find( int[]arr , int x ){    //实现最小化查找( >= ) r 返回第一个满足条件的数
        int l = -1 ;                                    //实现最大化查找( <= ) l 返回最后一个满足条件的数
        int r = arr.length  ;
        while(l +  1 < r ){
            int mid = (l + r ) >> 1 ;
            if(arr[mid] <= x) l = mid ;
            else r = mid ;
        }
        return l ;
    }

```

```text
private static int Fibo(int n){
    if( n <= 2 ) return 1 ;
    int[] dp = new int[n+1] ;
    dp[1] = dp[2] = 1 ;
    for(int i = 3 ; i <= n ; i++){
        dp[i] = dp[i -1 ] + dp[i -2] ;
    }
    return dp[n] ;
}
```

```text
private static boolean Palind(String s){
        char[] arr2 = s.toCharArray() ;
        for(int i = 0 ; i < s.length() / 2 ; i ++){
            if(arr2[i] != arr2[s.length() - 1 - i]){
                return false ; 
            }
        }
        return true ;
}
```

```text
//参数 : 盘子数 , 起点 , 终点 , 辅助点
private static void Hanoi(int n , char a , char b , char c  ){
    if(n == 1 ){
        System.out.println(a + "->" + b );
    }else{
        Hanoi(n -1 , a , c , b ) ;
        System.out.println(a + "->" + b );
        Hanoi(n - 1, c, b , a ) ;
    }
}
```

- 泛型 :

当不知道所存值的类型 : 例如 Integer 或者 String 可以直接使用 Object 类\( 所有类型的子类 \)型代替

在类中创建好之后编译时难以识别

```text
Integer value = (Integer) ws1.value ;
String name = (String)ws.value ; 
Object name1 = (String)ws.value ;
```
