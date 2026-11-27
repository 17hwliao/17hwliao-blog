```text
package Today;

import java.text.* ; 
import java.time.* ; 
import java.util.* ; 

public class Main {
    public static void main(String[] args) throws ParseException {
        System.out.println(Math.abs(-1));
        System.out.printf("%.3f      " , Math.pow(-2.2 , 2 ));

        Random x = new Random();
        for(int i = 0 ;  i  < 20 ; i++){
            System.out.println(x.nextDouble(10008) + "   ");
        }

        int[] arr = {1 , 22 , 2323, -12321, 31 , 2333, 23123};
        Arrays.sort(arr , 2  , 4);
        System.out.println(Arrays.toString(arr));
        int[] brr = new int[10] ;
        Arrays.fill(brr, -1);
        brr = Arrays.copyOfRange(arr , 2 , 5);
        System.out.println(Arrays.toString(brr));
        int[] crr = new int[10] ;
        System.arraycopy(arr , 0 , crr ,1  , 2 );
        System.out.println(Arrays.binarySearch(arr , 1222));

        int[][]arr1 = { {1 ,2 ,2 ,3 ,3213} ,  {1232,323213, 23123 ,22} } ;
        System.out.println(Arrays.deepToString(arr1));
        int[][]brr1 = {{1 ,2 ,2 ,3 ,3213} ,  {1232,323213, 23123 ,22} } ;
        System.out.println(Arrays.equals(arr1 , brr1)) ;

        System.out.println(Arrays.toString(crr));

        Date u   =  new Date();
        System.out.println(u.toGMTString());
        System.out.println(u.getTime());

        Date date1  = new Date(125 , 11 , 17 , 2 , 2 ,2   ) ;
        Date date2  = new Date(125 , 11 , 17 , 2 , 2 ,1  ) ;

        System.out.println(date2.compareTo(date1));

        Calendar cal = Calendar.getInstance();
        cal.set(2025 , Calendar.JANUARY , 16 , 12 , 2 , 2  ) ;
        cal.set(Calendar.YEAR , 2026) ;
        System.out.println(cal.getTime());
        System.out.println(cal.getWeeksInWeekYear());
        System.out.println(cal.getFirstDayOfWeek());

        System.out.println(cal.getTime());    //获取当前时间

        DateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        System.out.println(formatter.format(new Date()));

        Date parse = formatter.parse("2026-01-01 24:00:00");
        System.out.println(parse);

    }
}
```
