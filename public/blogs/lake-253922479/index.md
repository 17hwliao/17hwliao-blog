```text
import java.io.*;
import java.util.*;

public class Main {

    public static void main(String[] args)  {
        Map<Integer , String> map = new HashMap<>() ;
        map.put(1,"xiao") ;
        map.put(2,"ming") ;
        map.putIfAbsent(2,"xiao") ;
        System.out.println(map);
        System.out.println(map.get(2));
        System.out.println(map.getOrDefault(4, "gay"));
        Map<Integer, String> map2 = new LinkedHashMap<>() ;
        System.out.println(map.containsKey(1));
        Set<Map.Entry<Integer , String>> entries = map.entrySet() ;

        for(Map.Entry<Integer , String > entry : entries) {
            Integer key = entry.getKey() ;
            String value = entry.getValue() ;
            System.out.println("key = "+key+"value = "+value);
        }
        map.forEach((key , value) -> {
            System.out.println("key = "+key+"value = "+value);
        });
        map.compute(1,(key , va) -> {
            System.out.println("key = "+key+"value = "+va);
            return va ;
        } ) ;
        map.merge(1,"qaa" , (o1 ,o2) -> o1 + o2 );
        System.out.println(map.get(1));

        List<Integer> list = new ArrayList<>(Arrays.asList(1,2,3,4)) ;
        Collections.sort(list);
        System.out.println(list);

    }
    static class  Student  {
        int age ;
        String name ;
        public Student(int age, String name) {
            this.age = age;
            this.name = name;
        }
        public String toString() {
            return "Student [age=" + age + ", name=" + name + "]";
        }
    }


}
```
