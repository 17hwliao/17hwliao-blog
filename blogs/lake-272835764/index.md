## 路由

```text
	r := gin.Default()
	r.POST() 
	r.PATCH()  部分实现更新
	r.GET()
	r.DELETE()  
	r.PUT()   全量更新
	r.POST()
```

路由分组

把一类api划分到一个组

可以给这个组加上统一的中间件

### RESETFul Api规范

尽量使用名称的复数来定义路由

```text
// 在没有resetful规范正确，表示创建用户，删除用户
/api/user_create
/api/users/create
/api/users/add
/api/add_user
/api/user/delete
/api/user_remove

// 使用resetful规范
GET /api/users  用户列表
POST /api/users  创建用户
PUT /api/users/:id 更新用户信息
DELETE /api/users 批量删除用户
DELETE /api/users/:id 删除单个用户
```

但是resetful它只是一个api规范

登陆

```text
/api/login
```

大家在公司里面的项目，基本上都是POST请求

1. 很早之前的，那个时候还没有RESETFul 规范这个说法
2. 很多公司的防火墙会拦截除GET和POST之外的请求
