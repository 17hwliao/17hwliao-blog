## 创建分布式锁, 其实就是创建中间件的锁 , 和之前使用的防止穿透使用的锁 类似 只要你保证：

**业务执行时间 &lt; 锁过期时间**

## 那么：

- 直接 `delete` 解锁 **没问题**
- 用线程 ID 当 value **没问题**
- 不用 UUID **没问题**
- 不用 Lua **没问题**
- **不会超卖**
- **不会删错锁**
- **集群安全**

线程计数器

面对主线程 和 创建出 的分支线程 之间运行先后的问题 :

建议使用 CountDownLatch latch \= new CountDownLatch\(300\);

内部提供两个方法 , latch\.countDown\(\) , 分线程没执行一次 内部数字就 \-1 ;

还有一个 await\(\) 方法 , 只有当 内部值为 0 时 , 主线程才会进行下一步操作

```text
public static void main(String[] args) {
    LocalDateTime time = LocalDateTime.of(2022 , 1, 1 , 0 , 0, 0 ) ;
    long second = time.toEpochSecond(ZoneOffset.UTC);  获取当前时间的秒数
    System.out.println("second = " + second);
}
```

stringRedisTemplate 只能存字符串 , 面对对象存储的时候 只能是 采用转 JOSN 的形式 实现存储 , 所以 使用 JUtils\.toJSONstr\(\) ; 实现转化 之后存

解决缓存击穿

添加使用互斥锁 , 实现逻辑过期\( 在活动上线的时候使用 \)

![](</blogs/_assets/lakebook/71b6f233e75c36aa2eeb21a7.png>)

面对缓存穿透问题 : 让数据库返回空串, 防止一直访问 ;

✅ 是的，缓存更新通常只需在【增、删、改】操作中实现，【普通查询】不需要主动触发缓存更新。

而且现代开发多采用 人为手动控制,

面对 不常跟新的 选用内存淘汰 ,

直接设置 缓存数据都是 30 分钟内实现自己删除 ;

长跟新的使用 人工 的同步更新 ;

先修改 数据库 后删除缓存的方式 实现缓存更新 ;

能有效避免多线程带来的问题 , 降低出错的概率;

一般也只需要在 改的操作 后直接删除当前的缓存就好 ;

![](</blogs/_assets/lakebook/9fe315a00d8c4069e0d9bce0.png>)

在 StringRedisTemplate 的语境下：

注意：查询的时候使用的是opsForValue类型, 传回数据库中的时候就要使用啥类型, 否则前后参数不一致 ,缓存永远都查不到 ;

存入 Redis 时：所有数据（无论是普通字符串、数字、还是 JSON）都必须先转为 String 类型才能存入。

实际开发项目中 面对的字符串为空 \-\-&gt; 空字符串 ""纯空白字符串 " "、"\\t\\n" 等

使用 \=\= null 范围很小 , shoptype \!\= null &amp;&amp; \!shoptype\.trim\(\)\.isEmpty\(\) , 可以 直接使用 hutool 工具类中自带的工具 \.isNotBlank 实现判空 ;

从 Redis 读取时：opsForValue\(\)\.get\(key\) 返回的一定是 String（如果 key 存在），不会是 JSON 对象或其他 Java 对象。

最后使用 JSONUtils\.to 实现转化格式 ;

我去不早说 , hutoll 内部实现 ObjectMapper 方法 , 可以快速实现 JSON 数据的序列化和反序列化 ;

一、Hutool 相比原生 Jackson/Gson 的便利点

1. 场景 Hutool Jackson（原生）
2. 对象转 JSON JSONUtil\.toJsonStr\(obj\)

new ObjectMapper\(\)\.writeValueAsString\(obj\)

3. JSON 转对象 JSONUtil\.toBean\(json, User\.class\)

new ObjectMapper\(\)\.readValue\(json, User\.class\)

4. 转 List（泛型） JSONUtil\.toBean\(json, new TypeReference&lt;List&lt;User&gt;&gt;\(\) \{\}\) 同样需要 TypeReference，写法差不多
5. JSON 字符串格式化 JSONUtil\.formatJsonStr\(json\)

需配置 mapper\.writerWithDefaultPrettyPrinter\(\)

6. 判断是否为 JSON JSONUtil\.isTypeJSON\(json\) 无内置，需手动 try\-catch

明显优势：无需创建 ObjectMapper 实例，无需处理 JsonProcessingException 受检异常，代码更短更直观。

判断返回类型为空

String \-\-&gt; \=\= null

字符串判空：用户输入用 isBlank，程序内部用 isEmpty，始终先判 null。

集合/数组判空：优先使用工具类（Apache Commons 或 Spring），避免手写 null \+ isEmpty。

不要用 equals 判 null：直接用 \=\=。

比较对象内容：用 Objects\.equals\(a, b\) 代替 a\.equals\(b\)，避免 NPE。

Optional：永远不要对 Optional 变量赋 null；用 isPresent\(\) 或 ifPresent\(\) 处理值存在的情况。

基本类型包装类：比较数值时使用 Objects\.equals 或拆箱后 \=\=，注意缓存范围陷阱。

转化 token 生成方式 :

过去 的使用 用户的JSON 属性信息 \+ 系统 使用Base64 位实现加密 的私钥

用哈希加密算法实现签名;

最后自己生成签名实现验签登陆 \. 但放在移动端实现这个方法 实在是冗杂 ;

使用随机生成 UUID 方式生成 :

UUID\.randomUUID\(\) 生成的是一个符合 RFC 4122 标准的 Version 4 UUID。

原理：它主要基于随机数生成。

组成：总共 128 位（16 字节），其中 122 位是随机生成的。

特点：全球唯一，重复概率极低（理论上约为 \$1/2^\{122\}\$）。

使用下面这种方式实现生成 的密钥 : 储存友好 ,安全性好 ;

String token \= UUID\.randomUUID\(\)\.toString\(true\);

面对多拦截器想实现逻辑上的控制顺序 :

可以在添加的属性中实现 \.order\(序号\) 序号越小越早实现;

拦截器中不能使用 IOC 容器中Bean对象

当你启动项目时，Spring MVC 会扫描所有实现了 WebMvcConfigurer 的配置类，并调用它们的 addInterceptors 方法。你把拦截器对象传给 registry，Spring 就会把它存入内部的拦截器链表中。这一步和 实现Bean对象同步, 不会自动注入Bean对象 ,需要使用配置类中实现的注入对象实现方法 ;

实现;

```text
@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 登录拦截器，排除不需要登录的路径
        registry.addInterceptor(new LoginInterceptor(stringRedisTemplate))
                .excludePathPatterns(
                        "/user/code",
                        "/user/login",
                        "/blog/hot",
                        "/shop/**",
                        "/shop-type/**",
                        "/voucher/**"
                );
        registry.addInterceptor(new RefreshTokenInterceptor(stringRedisTemplate)).addPathPatterns("/**") ;
    }
}
```

项目整体布局 :

使用 Utils

创建常量类 : \-\-&gt; 统一管理一些固定的常量值 , B格很高 ;

创建ThreadLocal , 保存一些本地的临时变量 ;

开发功能接口 :

明确功能 , 创建实现的思维结构 ;

合理安排顺序, 从Controller 开始处理代码的思路 ;

实际问题 :

一 \-\-&gt;请求路径

@RequestMapping\("/i"\) //一般会有类的路径定义 , 方法定义的前缀基础

注意 Spring 会自动路径优化 ,有类路径后 :

无论方法上的 请求 CRUD \("/"\) 有无 "/" 都可以实现自动加到后面的路径中去 ;

● GET方式：@GetMapping

● POST方式：@PostMapping

● PUT方式：@PutMapping

● DELETE方式：@DeleteMapping

二 \.正则表达式

```text
/**
 * 手机号正则
 */
public static final String PHONE_REGEX = "^1([38][0-9]|4[579]|5[0-3,5-9]|6[6]|7[0135678]|9[89])\\d{8}$";
/**
 * 邮箱正则
 */
public static final String EMAIL_REGEX = "^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\\.[a-zA-Z0-9_-]+)+$";
/**
 * 密码正则。4~32位的字母、数字、下划线
 */
public static final String PASSWORD_REGEX = "^\\w{4,32}$";
/**
 * 验证码正则, 6位数字或字母
 */
public static final String VERIFY_CODE_REGEX = "^[a-zA-Z\\d]{6}$";
```
