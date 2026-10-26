public class Person \{

String name ;

int age ;

String gender ;

int cun1 ;

int cun2 ;

void say\_hello\(\)\{

System\.out\.println\(" " \+ name \+ " "\+ age \+ " "\+ gender\);

\}

int sum\(int a , int b\)\{

int c \= a \+ b ;

return c ;

\}

void test\(int a\) \{

for \(int i \= 0; i &lt; 10; i\+\+\) \{

if \(i \=\= a\) \{

break;

\} else \{

System\.out\.println\("hello"\);

\}

\}

System\.out\.println\("hhhhhhh"\);

\}

void swap\(int a, int b\)\{

int temp \= a;

a \= b;

b \= temp;

\}

void swap\(Person person\)\{

person\.name \= "nitian" ;

\}

void swap1\(Person person\)\{

int temp \= person\.cun1 ;

person\.cun1 \= person\.cun2 ;

person\.cun2 \= temp ;

\}

\}
