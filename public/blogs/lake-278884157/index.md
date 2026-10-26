创建路由 :

在 main 中创建 一个实例对象 :

func New\(healthHandler \*handler\.HealthHandler\) \*gin\.Engine \{

r :\= gin\.New\(\)

// 创建一个空白的 Engine（路由引擎）

// 对比：gin\.Default\(\) 会自动加 Logger 和 Recovery 中间件

后使用了自己写的Zap日志 , 就不用加 Logger ; l

// 这里用 gin\.New\(\) 是手动加中间件，更可控

r\.Use\(gin\.Logger\(\), gin\.Recovery\(\)\)

// 注册两个中间件，每个请求进来前都会执行它们：

// gin\.Logger\(\)：打印请求日志，比如 "GET /health 200 0\.1ms"

// gin\.Recovery\(\)：捕获 panic，防止一个请求 panic 导致整个服务挂掉

r\.GET\("/health", healthHandler\.Check\) 注册路由 , 路由 \( 访问地址, func\(c \*gin Context\)\{实际内容\}\)

// 注册路由：当收到 GET /health 请求时，调用 healthHandler\.Check 处理

// 参数1：请求路径（支持 :id、\*name 等路由参数）

// 参数2：处理函数，签名必须是 func\(\*gin\.Context\)

// 底层：把 "/health" \+ "GET" 作为 key，Check 作为 value 存到路由表

return r

// 返回注册好路由的 Engine，main\.go 拿到后调用 r\.Run\(\) 启动服务 \}

使用中间件的时候 , 一定要使用路由\. next\(\) 实现将控制权转到下一个中间件;

内部实现的 Logger , Recovery 就可以不使用了
