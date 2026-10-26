```text
import java.io.* ;
import  java.util.*;
import java.util.stream.Collectors;

import static java.util.Map.*;

public class Main {

    public static void main(String[] args) {
        List<String> fruit = new ArrayList<>() ;
        List<String> ws1 = List.of("ysys" , "sjsks") ;
        Set<String> ws2 = Set.of("sda" , "qewq") ;
        Map<Integer , String> map = Map.of(1,"aaas" , 2 , "ssdsa") ;
        Map<Integer , String> map1 = ofEntries(entry(1,"aaas") ) ;
        List<String> list = new ArrayList<>(List.of("aaas", "ssdsa", "qewq")) ;
        list.addFirst("qq") ;
        list.addLast("aa") ;
        list.removeFirst() ;
        list.removeLast() ;
        LinkedHashSet<String> set = new LinkedHashSet<>(List.of("aaas", "ssdsa", "qewq")) ;
        List<String>list2 = new ArrayList<>(List.of("aaa", "bbb", "ccc")) ;
        List<String> resversed = list2.reversed() ;
        resversed.addFirst("ddd"); ;
        System.out.println(resversed);
        System.out.println(list2);
        list = list
                .stream()
                .filter(x -> !x.equals("aaas"))
                .sorted(String::compareTo)
                .map(a ->a+"q")
                .limit(3)
                .collect(Collectors.toList()) ;

        System.out.println(list) ;
        List<Integer> list3 = Arrays.asList(1, 2, 3) ;
        Double colllect = list3
                .stream()
                .collect(Collectors.averagingInt(Integer::intValue)) ;
        String[] s = new String[]{"aaa" , "sdsa"};
        List<String> list1 = Arrays.asList(s);
    }

}
```
