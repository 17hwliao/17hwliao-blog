```text
package Today;

import java.text.* ;
import java.time.* ;
import java.time.format.DateTimeFormatter;
import java.util.* ;

public class Main {
    public static void main(String[] args) {
        LocalDate date = LocalDate.now();
        LocalDate date1 = LocalDate.of(2023,12 , 21) ;
        LocalDate date2 = LocalDate.ofYearDay(2025,365) ;

        System.out.println(date);

        date = date.plusDays(1) ;  //实现在原本日期基础上++ ;

        System.out.println(date1);
        System.out.println(date2);
        System.out.println(date);
        System.out.println(date.getDayOfWeek());
        System.out.println(date.getMonth());
        System.out.println(date.getMonthValue());
        System.out.println(date.getDayOfMonth());
        System.out.println(date.getDayOfYear());
        System.out.println(date.getYear());
        LocalDate today1 = LocalDate.MAX;
        LocalDate today2 = LocalDate.MIN;
        LocalTime today3 = LocalTime.MAX;
        LocalTime today4 = LocalTime.MIN;
        LocalTime today5 = LocalTime.MIDNIGHT;
        LocalTime today6 = LocalTime.NOON;
        LocalDateTime today7 = LocalDateTime.of(1232, 11 , 2 , 2 , 21);
        LocalDateTime today8 = LocalTime.now().atDate(LocalDate.now()) ;   //实现自动补全

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        LocalDateTime today9 = LocalDateTime.from(dtf.parse("2025-09-09 07:12:34"));

        System.out.println(LocalDateTime.parse("2023-09-09 10:09:22" ,dtf));

        DateTimeFormatter dtf3 = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        LocalDateTime time = LocalDateTime.now() ;
        System.out.println(dtf3.format(time));

        OffsetDateTime hhh = OffsetDateTime.now(ZoneId.of("UTC-6"));
        System.out.println(hhh);

        LocalDateTime now = LocalDateTime.now(ZoneId.of("UTC-6"));

        ZonedDateTime zoneId = ZonedDateTime.now() ;
        System.out.println(zoneId);

        Instant intant = Instant.now() ;
        Instant.ofEpochSecond(1) ;    //通过时间戳创建日期
        Instant.ofEpochSecond(0,1) ; //实现精确到毫秒

        LocalDateTime stf10 =  LocalDateTime.ofInstant(intant , ZoneId.of("UTC+8"));

        Duration duration = Duration.ofHours(1);
        Duration s = Duration.between(LocalDateTime.now(),LocalDateTime.now().plusDays(1)) ;
        Period period = Period.ofDays(1);
        System.out.println(duration);
        System.out.println(s.getSeconds());

        Period period1 = Period.between(LocalDate.now(),LocalDate.now().plusDays(56));
        System.out.println(period1.getDays());



    }



}
```
