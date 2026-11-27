为了防止 main 函数 太过臃肿 :

封装全部的gin请求到router/router\.go中去;

```text
router/router.go：
package router
import (
    "my-project/handler"
    "my-project/middleware"
    "my-project/token"
    "github.com/gin-gonic/gin"
)
func New(   //传入共享实例对象
    healthHandler *handler.HealthHandler,
    authHandler *handler.AuthHandler,
    activityHandler *handler.ActivityHandler,
    jwtManager *token.JWTManager,
) *gin.Engine {
    r := gin.New() -->创建空引擎
    r.Use(middleware.RequestLogger()  --> 使用自定义的logger ; 
    , gin.Recovery())  	-->  使用panic恢复
    
    // 公开路由
    r.GET("/health", healthHandler.Check)
    
    v1 := r.Group("/api/v1") -->创建路由组 + 前缀
    v1.POST("/auth/register", authHandler.Register)
    v1.POST("/auth/login", authHandler.Login)
    v1.GET("/activities", activityHandler.List)
    
    // 需要认证的路由
    protected := v1.Group("") --> 复用前缀
    protected.Use(middleware.Auth(jwtManager))
    会先走中间件检查token 然后实现放行; 
    protected.GET("/users/me", authHandler.Me)
    protected.POST("/activities", activityHandler.Create)
    
    return r
}
main.go：
package main
import (
    "my-project/handler"
    "my-project/logger"
    "my-project/router"
    "my-project/token"
)
func main() {
    // 初始化日志
    cleanup, _ := logger.Init("my-project")
    defer cleanup()
    
    // 初始化依赖
    jwtManager := token.NewJWTManager("secret")
    healthHandler := handler.NewHealthHandler(db)
    authHandler := handler.NewAuthHandler(db)
    activityHandler := handler.NewActivityHandler(db)
    
    // 创建路由（一行搞定）
    r := router.New(healthHandler, authHandler, activityHandler, jwtManager)
    r.Run(":8080")
}
```
