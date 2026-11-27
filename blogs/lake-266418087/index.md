### 一 : 创建一个idea的空项目 ;

配置JDK; //project structure ;

检查项目创建时候的Maven的路径 :

setting \-\-&gt; build \-&gt; tools \-&gt; Maven : Override 使用系统配置好的路径实现覆盖 ;

修改字符集 : Editor : File Encording : 全部修改为UTF\- 8 ;

### 二 : 创建模块部分 :

实现配置 : 创建springboot 模块 : Package name : 去除当前的模块名即可 , 匹配JDK;

\-&gt; 安装依赖 :

工具类 : Lombok : 自动生成代码\+@DATA 实现类中元素的get , set 内部实现方法 ;

Springboot Web : 让你的 Spring Boot 项目拥有 Web 开发能力，能够接收 HTTP 请 求、返回数据、启动内嵌的 Web 服务器。

操作数据库 : 使用的数据库需要安装的驱动 \+ Mybatis 的framework 依赖\(启动类, 自动配置\)

只保留项目中的 **iml文件 和 xml文件**

**直接将内部的properties 在resource 下创建application\.yml 底层配置文件;**

**创建的格式 :**

```text
spring:
  application:
    name: lec_diaosi_management

# 数据库的连接信息
  datasource:
    url: jdbc:mysql://localhost:3306/自己的表名
    username: root
    password: zjq17hwliao
    driver-class-name: com.mysql.cj.jdbc.Driver

# 配置MyBatis的相关配置
mybatis:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
# 实现的Mapper同包同名 ; 不需要配置
```

**准备要使用的数据表 :**

在java的com\.项目名包下创建三层架构 :

controller , pojo , service , mapper ;

pojo : 内部创建实体类 :

```text
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
    private int id ;
    private String name ;
    private String password ;
    private String track ;
    private String major ;
    private LocalDateTime create_time ;
    private LocalDate update_time ;
}
```

本项目中的全部增删改查操作 都需要输出对应的Result 内部实现方法,成功输出对象, 失败输出报错信息 ;

```text
public class Result {

    private Integer id ;    //输出运行编码
    private String fault;   //报错
    private Object data ;

    public static Result success(){
        Result result = new Result() ;
        result.id = 0 ;
        result.fault = "success" ;
        result.data = null ;
        return result ;
    }

    public static Result success(Object object){
        Result result = new Result() ;
        result.id = 1 ;
        result.data = object ;
        result.fault = "success" ;
        return result ;
    }

    public static Result error(String fault){
        Result result = new Result() ;
        result.id = 1 ;
        result.fault = fault ;
        result.data = null ;
        return result ;
    }
}
```

### 三 : 开始Maven 三层架构的编写 高内聚低耦合原则, 面向接口式编程

mapper层 下创建 接口 @Mapper

Service 层下 创建接口 UserService , 创建一个子包内部创建多个对象得到接口后实现业务处理 放入容器中;

内部创建的 impl 包 , 创建包内的类 ;

Controller 层下 创建的是Java类 :

@RestController :

```text
内部实现传递给容器(@Controller) 
直接传递值给前端(@ResponseBody)
```

### 四 : 开始面向接口编程 :

按照请求的开始到结束 : controller \-&gt; service \-&gt; mapper \-&gt; 数据库;

- Controller

编写处理前端请求的Controller 内部的方法 :

@Autowird

内部创建一个获取Service层应该传回的一个对象 ;

先写 注释 @RequestMapping\('从接口文档中找'\) ;

编写文档中需要返回的参数 ,,使用静态方法实现返回参数组 ;

- Service

面向接口 : 总的接口中编写的是返回controller中需要的数据类型的方法 ; \\

内部实现类 : 先获取一个从下一层返回的Mapper对象,

然后在内部实现 接口文件中提供的具体需要实现的方法 :

- Mapper 从数据库中获取信息

使用@Select\("SQL"\)实现编写查询语句

下面写写一个接口方法即可 ;

### 五 : 需要限定访问的方式

RequestMapping\( value \=' ' , method \= RequesMethod\.GET \)

请求方式 \+ Mapping\('/'\) 可以直接实现上述的效果

### 六 : 创建带前端返回参数的接口 ;

Controller : 内部处理方法 选用的返回参数都是 Result 类型的参数 ;

避免手动实现类型转化, 还调用Param方法获取返回参数,使用注释直接自动绑定 选取的参数 ; @RequestParam

下面的方式针对简单的参数可以直接使用 ;

确实可以自动将 HTTP 请求中的参数转换为你指定的形参类型。

注意 : 使用这个参数时 , 内部的参数配置 \(value\= "" ,required\= \(default \= true\)\) 可以直接修改为 false ; 否则当前端返回 的申请 为 null 时 会直接报错, 修改为 false 时 , 可以正常实现功能, 可以避免返回空的值出现的报错;

```text
@DeleteMapping("/user")  //内部接口文档使用的是 这个接口 , 调用的方法使用的是delete实现的
public Result delete(@RequestParam("id") Integer id){
注意:当
    System.out.println("实现删除id为"+id+"的用户");
    return Result.success() ;
}

public Result delete(@RequestParam("id") Integer id,
    @RequestParam("force") Boolean force)) 可以直接使用来获取多个参数,内部也可以直接转化为参数对应的形式
```

### 七 : 实现一个功能接口的完整路径 :

创建一个Controller 中的请求方法 : 内部实现 使用静态方法实现返回 后 ,内部使用 Service层的deleteById 方法 ; 先去创建一个 Service 下的接口函数 , 实现 具体的方法 直接调用对象内部实现的deleteById的方法;

去 Mapper 层下实现这个deleteById 的方法 , 直接注释使用 SQL 语句 下面跟上一个声明就行 ;

```text
放心用#{} , 传入需要使用的参数就行
@Delete("delete from member where id = #{id}")
Integer deleteById(Integer id);
@Select("select * from member where id = #{id}")  
User selectById(Integer id);
```

### 八 : 可以自己实现一个自己想要的接口了 , 多个接口下合作使用 , Mapper中放置的都是实现单独的业务逻辑的SQL实现项 , 想要实现复杂的业务逻辑 , 主要实现的思路要在Service层中去 实现, 在需要实现复杂功能的方法中调用多个简单的实现方法 , 实现返回参数改变 , 最后在Controller 中实现调用返回 对应的参数 类型 就可以直接实现复杂的功能 ;

### 九 : 从请求体中获取到 JSON格式的数据 : jing

尽可能不要使用 基本的数据类型 : 当前端传回的JSON 数据中缺少当前普通类型的字段时 , 会爆出4000 的错 误 , 使用 Integer 可以直接承受 null 空值 ;

### 十 : 使用 insert的时候需要属性名 ; mysql中 使用属性名 内部 含有'\_' 的字段名 , 在成为属性名后会 自动使用驼 峰 命名法升级为大写字符 ; 需要注意在实现传参数的时候自己实现 驼峰命名 :

```text
@Insert("insert into member( name, password , track , major , create_time , update_time) values(#{user.name}, #{password}, #{track}, #{major}, #{createTime}, #{updateTime})")
void insert(User user);
```

十一 : 通过使用 PathVariable 可以直接获取到访问的后面的 id 值 ;

```text
@GetMapping("/user/{id}")
public Result getInfo(@PathVariable("id")Integer id){
    System.out.println("现在查询的id是"+id );
    return Result.success() ;
}
```

注意可以减少 : 当路径中的参数名和@PathVariable中传入的形参名一致时 , 可以直接省略写成　: @PathVariable Integer id 实现功能 ;

若是出现 405报错 ,可能是因为接口多 无法实现选择导致报错,

也可能是因为 使用了不属于 方法的请求方式 请求 接口导致的 ;

总结 :

一 : @RequestParam 获取到的参数 /user?name\='shds' ;

public Result getuser\(@RequestParam String name, @RequestParam Integer age\)

请求方式 : GET /user?name\=张三&amp;age\=25

二 : @PathVariable 获取到的参数 /id ; 路径中的参数

public Result getUser\(@PathVariable Integer id, @PathVariable String type\)

请求方式 : GET /user/100/vip

三 : @RequestBody 使用post请求中请求体中携带的JSON 数据 ;

请求方式 : POST /user

Content\-Type: application/json

\{ "name": "张三",

"age": 25,

"email": "zhangsan@test\.com"\}

彼此之间可以实现混着使用 :

public Result queryUser\(@RequestParam String type, @RequestBody User user\)

无论增删改查 全部的方法 : 都是采用的公共的 '/user' 只有请求的方式不同来区分;

优化代码 :

针对一个类实现增删改查 :

都是基于一个 请求的路径 可以直接优化到类的 头上去申明 ;

```text
@RequestMapping("/user")
@RestController
```

下面实现方法请求头

@RequestMapping 后面无需加上路径括号;

### 日志使用环节

先配置 log,xml 的完整文件 :

```text
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- 控制台输出 -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <!-- 格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度，%logger{50}：最长50个字符(超出则切割) -->
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
        </encoder>
    </appender>

    <appender name = "FILE" class="ch.qos.logback.core.FileAppender">
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeBasedRollingPolicy">
        <fileNamePattern>C:/log/lec_diaosi_management-%d{yyyy-MM-dd}.%i.log</fileNamePattern>
        <MaxHistory>30</MaxHistory>
        <maxFileSize>10MB</maxFileSize>
        </rollingPolicy>
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- 日志输出级别 -->
    <root level="ALL">
        <appender-ref ref="STDOUT" />
        <appender-ref ref="FILE" />
    </root>
</configuration>
```

使用方法 :

可以先直接定义一个常量 :

//private static final Logger log \= LoggerFactory\.getLogger\(UserController\.class\);

当使用 lombok \(自动化补充语句后\) 可以直接使用 @Slf4j 注释省略编写常量的环节 ;

后面的增删改查 中的Controller : 之前使用 sout 实现日志记录的内容 现在可以直接使用log,\-\-\-\-替换

写法技巧 , 无论需要占位的数据类型 : 直接使用 \{\} 就可以直接实现替换 \-&gt; , 补充需要填充使用的参数项即可 ;

**后期项目升级后的方案 :**

创建Mapper层接口 , pojo 实体类 的时候 :

实现完整的项目表结构

但在创建项目的Service , Controller 层的时候, 内部实现关联的表可以直接不写

例如 部门的归属类的关系类 ;

##### 在之后查看日志的时候从下向上直接看 ;

主要看关键词 near , 后面因该有报错的详细信息 ;

##### 在 使用 Mapper 层 传入的数据类型中有时间类型的时候 :

需要使用 @DateTimeFormat \(pattern \= "yyyy\-MM\-dd"\) 实现传参的格式定义 ;
