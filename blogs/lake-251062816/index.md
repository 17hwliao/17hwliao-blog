```text
package Today ;

import java.util.*;

public class Main{
    public static void main(String[]args){
        int[] arr = {24,43,65,743,35,34,25,61,1,9} ;
        Bubble_Sort(arr);
        System.out.println(Arrays.toString(arr));
        Scanner cin  = new Scanner(System.in) ;
        String s = cin.nextLine();
        char[] arr1 = s.toCharArray() ;
        Class ws = new Class("ws" , "122" , "是gay") ;
        Class ws1 = new Class("ws1" , "gay" , 11) ;

        Integer value = (Integer) ws1.value ;
        String name = (String)ws.value ;
        Object name1 = (String)ws.value ;
    }

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

    private static int Fibo(int n){
        if( n <= 2 ) return 1 ;
        int[] dp = new int[n+1] ;
        dp[1] = dp[2] = 1 ;
        for(int i = 3 ; i <= n ; i++){
            dp[i] = dp[i -1 ] + dp[i -2] ;
        }
        return dp[n] ;
    }

    private static boolean Palind(String s) {
        char[] arr2 = s.toCharArray();
        for (int i = 0; i < s.length() / 2; i++) {
            if (arr2[i] != arr2[s.length() - 1 - i]) {
                return false;
            }
        }
        return true;
    }
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

}
```
