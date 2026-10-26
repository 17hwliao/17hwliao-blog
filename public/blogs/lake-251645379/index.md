package Today;

public class New\_Class&lt;T&gt;\{

String name ;

int date ;

T ws ;

New\_Class\(String name , int date, T ws\)\{

this\.name \= name ;

this\.date \= date;

this\.ws \= ws;

System\.out\.println\(name \+ date \+ ws\);

\}

\}

package Today;

import java\.lang\.reflect\.Array;

import java\.util\.Arrays;

import java\.util\.Comparator;

public class Today\{

public static void main\(String\[\] args\) \{

New\_Class&lt;String&gt; ws1 \= new New\_Class&lt;&gt;\("ws0" , 1 , "是gay"\) ;

Integer s \= test\(21\) ;

Integer\[\] arr \= \{1 , 2 ,4 ,5 ,4 , 3 ,12 \} ;

Arrays\.sort\(arr , new Comparator&lt;Integer&gt;\(\)\{

public int compare\(Integer o1 , Integer o2\)\{

return o2 \- o1 ;

\}

\}\) ;

Integer\[\] brr \= Arrays\.copyOf\(arr , 3\) ;

System\.out\.println\(Arrays\.toString\(arr\)\) ;

Today\.&lt;String&gt;name\(\) ;

String str \= name\(\) ;

Integer ws2 \= test\(12\) ;

Tree tree \= new Tree\(\) ;

System\.out\.println\(tree\.study\(",ws真的是gay"\)\);

Tec&lt;Integer&gt; tec \= new Tec&lt;&gt;\(12\);

\}

private static &lt;T extends Number&gt; T test\(T t \)\{

return t ;

\}

private static &lt;T&gt; T name\(\)\{

return null ;

\}

interface Study&lt;T&gt;\{

T study\(T t \) ;

\}

static class Tree implements Study&lt;String&gt;\{

public String study\(String str\)\{

return "ws是gay"\+str ;

\}

\}

static class Tec&lt;T&gt;\{

T name ;

public Tec\(T name\)\{

this\.name \= name ;

\}

\}

\}

package Today;

public class Ws000&lt;T extends Number&gt; \{

String name ;

int date ;

T ws ;

public Ws000\(String name, int date , T ws\) \{

this\.name \= name;

this\.date \= date;

this\.ws \= ws ;

\}

\}
