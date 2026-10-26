# JWT 鉴权教学文档： Go 项目实战

## 1\. JWT 是什么

JWT（JSON Web Token）是一种“登录凭证”格式。

用户登录成功后，后端不保存传统 Session，而是签发一个 Token 给客户端。之后客户端访问需要登录的接口时，把 Token 放进请求头；后端验证 Token 合法后，确认“当前请求是谁发出的”。

JWT 的结构：

```text
Header.Payload.Signature
```

例如：

```text
eyJhbGciOiJIUzI1NiJ9
.
eyJ1c2VyX2lkIjoxNCwidXNlcm5hbWUiOiJ6anEiLCJleHAiOjE3...
.
xxxxxx
```

三段都使用 Base64URL 编码。重点是：

- `Header`：签名算法，例如 `HS256`。
- `Payload`：身份信息，例如用户 ID、用户名、过期时间。
- `Signature`：后端使用密钥计算出的签名，用于防篡改。

JWT 是**签名**，不是加密。

也就是说，别人可以解码看到 Payload 中的内容，所以绝对不要把密码、身份证号、数据库密码等敏感信息放进 JWT。

---

## 2\. 认证和授权不是一回事

这是 JWT 最重要的知识点。

```text
认证 Authentication：你是谁？
授权 Authorization：你能做什么？
```

在你的项目中：

```text
JWT 验证成功
→ 证明请求来自 user_id=14 的已登录用户
→ 这是“认证”

再查询数据库并判断：
- 是否绑定了合法手机号？
- 是否是该活动创建者？
- 是否在报名时间内？
→ 这是“授权 / 业务权限”
```

JWT 不能替代所有权限判断。你当前项目把角色和活动所有权继续交给数据库判断，这个设计是正确的。

---

## 3\. 你的项目使用了哪种 JWT

项目使用：

```text
HS256
```

对应代码在 \[jwt\.go\]\(C:\\\\Users\\\\17hwliao\\\\Desktop\\\\Duyu\\\\internal\\\\token\\\\jwt\.go\)。

HS256 的特点：

```text
后端使用同一个 secret：
签发 Token 时签名
验证 Token 时验签
```

因此 JWT 密钥必须：

- 足够随机、足够长；
- 只存在于后端配置中；
- 不提交到 GitHub；
- 不返回给前端、Apifox 或普通用户。

你的项目创建 `JWTManager` 时会检查：

```text
if secret == "" {
    return nil, fmt.Errorf("jwt secret is required")
}
```

这避免了空密钥启动服务。

---

## 4\. 当前项目 JWT 的完整流程

```text
用户输入账号密码
        ↓
POST /api/v1/auth/login
        ↓
后端查询 users 表
        ↓
bcrypt 比较密码
        ↓
生成带 user_id、username、iat、exp 的 JWT
        ↓
将 access_token 返回给客户端
        ↓
客户端保存 Token
        ↓
调用受保护接口时带上 Authorization 请求头
        ↓
JWT 中间件验签、检查过期时间
        ↓
把 claims 放入 Gin Context
        ↓
Handler 取出当前 user_id
        ↓
Service 再检查具体业务权限
```

---

## 5\. 登录时如何签发 Token

登录逻辑在 \[auth\_service\.go\]\(C:\\\\Users\\\\17hwliao\\\\Desktop\\\\Duyu\\\\internal\\\\service\\\\auth\_service\.go\)。

用户调用：

```text
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "zjq",
  "password": "你的密码"
}
```

后端完成两件事：

```text
bcrypt.CompareHashAndPassword(
    []byte(user.PasswordHash),
    []byte(req.Password),
)
```

先验证密码，再调用：

```text
s.tokens.Generate(user.ID, user.Username)
```

实际写入 JWT 的 Claims 是：

```text
type Claims struct {
    UserID   uint64 `json:"user_id"`
    Username string `json:"username"`
    jwt.RegisteredClaims
}
```

其中 `RegisteredClaims` 里当前用到：

```text
IssuedAt   // iat：签发时间
ExpiresAt  // exp：过期时间
```

生成 Token 的核心逻辑：

```text
token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
signed, err := token.SignedString(m.secret)
```

登录成功后接口会返回类似：

```text
{
  "code": 0,
  "message": "ok",
  "data": {
    "access_token": "eyJ...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "username": "zjq"
    }
  }
}
```

---

## 6\. 客户端如何携带 JWT

之后访问需要登录的接口时，必须在请求头加入：

```text
Authorization: Bearer 你的access_token
```

注意 `Bearer` 后面有一个空格。

正确：

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

错误示例：

```text
Authorization: eyJhbGciOiJIUzI1NiJ9...
Authorization: bearer
Authorization: Token eyJhbGciOiJIUzI1NiJ9...
```

在 Apifox 中，你可以建立环境变量：

```text
token = 登录接口返回的 access_token
```

然后在受保护接口统一填写：

```text
Authorization: Bearer {{token}}
```

---

## 7\. 哪些接口需要 JWT

路由定义在 \[router\.go\]\(C:\\\\Users\\\\17hwliao\\\\Desktop\\\\Duyu\\\\internal\\\\router\\\\router\.go\)。

不需要登录即可访问的公开接口：

```text
GET  /health
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/activities
GET  /api/v1/activities/:id
```

需要 JWT 的接口：

```text
GET    /api/v1/users/me
PUT    /api/v1/users/me/phone
GET    /api/v1/users/me/registrations

POST   /api/v1/activities
PUT    /api/v1/activities/:id
POST   /api/v1/activities/:id/publish
POST   /api/v1/activities/:id/cancel

POST   /api/v1/activities/:id/registrations
DELETE /api/v1/activities/:id/registrations/me
GET    /api/v1/activities/:id/registrations
```

代码中的核心结构：

```text
protected := v1.Group("")
protected.Use(middleware.Auth(jwtManager))
```

意思是：`protected` 路由组里的每一个接口，都必须先通过 JWT 中间件。

---

## 8\. JWT 中间件具体做了什么

中间件在 \[auth\.go\]\(C:\\\\Users\\\\17hwliao\\\\Desktop\\\\Duyu\\\\internal\\\\middleware\\\\auth\.go\)。

它依次执行：

### 第一步：读取请求头

```text
header := c.GetHeader("Authorization")
```

### 第二步：检查是否符合 Bearer 格式

```text
parts := strings.Fields(header)

if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
    response.Unauthorized(c, "missing or invalid authorization token")
    c.Abort()
    return
}
```

如果没有 Token，或者格式错误，直接返回：

```text
401 Unauthorized
```

并且：

```text
c.Abort()
```

表示终止请求，后面的 Handler 不会继续执行。

### 第三步：解析并验证 Token

```text
claims, err := manager.Parse(parts[1])
```

`Parse` 会验证：

- Token 格式是否正确；
- 签名算法是否是 HS256；
- 是否能用服务端密钥验签；
- Token 是否被篡改；
- `exp` 是否过期。

项目中还显式限制了签名算法：

```text
if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
    return nil, fmt.Errorf("unexpected signing method")
}
```

这是一个很好的安全习惯，避免攻击者替换算法。

### 第四步：把用户身份放进 Gin Context

```text
c.Set(claimsContextKey, claims)
c.Next()
```

此时后面的 Handler 就可以知道当前用户是谁。

---

## 9\. Handler 如何获得当前登录用户

Handler 不自己解 JWT，而是从 Gin Context 取中间件已经验证过的 Claims：

```text
claims, ok := middleware.CurrentUser(c)
```

例如创建活动时：

```text
activity, err := h.service.Create(
    c.Request.Context(),
    claims.UserID,
    req,
)
```

这里的 `claims.UserID` 来自 JWT，而不是前端传来的 JSON。

这是关键安全点。

错误做法：

```text
{
  "user_id": 999
}
```

如果让前端传 `user_id`，用户可以伪造为别人的 ID。

正确做法：

```text
Token 验签成功
→ 从 Token 中获取 user_id
→ 后端认定当前用户身份
```

---

## 10\. JWT 之后，为什么还要查数据库

以“创建活动”为例：

```text
JWT 通过
→ 知道请求人是 user_id=14
→ 但并不知道他是否已经绑定手机号
→ Service 查询 users 表
→ 判断 HasValidatedPhone()
→ 决定允许还是返回 403
```

以“取消活动”为例：

```text
JWT 通过
→ 知道当前用户 ID
→ 查询 activity
→ 判断 activity.OrganizerID 是否等于当前用户 ID
→ 只有创建者可以取消
```

所以当前项目的权限模型是：

```text
JWT：提供可信的用户 ID
数据库：提供最新用户状态和资源归属
Service：执行最终授权判断
```

你没有把 `role` 放进 JWT，这反而有好处：用户绑定手机号后，数据库角色立即变化，不必等待旧 Token 过期后才能生效。

---

## 11\. 401 和 403 的区别

<table class="ne-table" id="xIb90"><tbody><tr><td width="250"><p class="ne-p" id="ub159b235"><span class="ne-text">状态码</span></p></td><td width="250"><p class="ne-p" id="u587400d2"><span class="ne-text">含义</span></p></td><td width="250"><p class="ne-p" id="ud9a24a7a"><span class="ne-text">本项目示例</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ud58fb7d4"><code class="ne-code"><span class="ne-text">401 Unauthorized</span></code></p></td><td width="250"><p class="ne-p" id="u45a9f214"><span class="ne-text">没登录或身份凭证无效</span></p></td><td width="250"><p class="ne-p" id="u29171492"><span class="ne-text">没带 Token、Token 格式错误、签名错误、Token 过期</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ua3c904ed"><code class="ne-code"><span class="ne-text">403 Forbidden</span></code></p></td><td width="250"><p class="ne-p" id="u6b8c5ae3"><span class="ne-text">已知你是谁，但你没有权限</span></p></td><td width="250"><p class="ne-p" id="u7190fce3"><span class="ne-text">普通用户未绑定手机号却创建活动；非主办方查看报名名单</span></p></td></tr></tbody></table>

可以记忆为：

```text
401：你是谁？我不认可。
403：我知道你是谁，但你不能做这件事。
```

---

## 12\. 登出为什么没有专门接口

你的 JWT 是无状态的：

```text
服务端不保存每个用户的登录会话
```

因此“退出登录”的基本做法是客户端删除 Token：

- Apifox：清空 `token` 环境变量或移除 `Authorization` 请求头；
- Web 前端：删除 Local Storage 中保存的 Token；
- 手机 App：删除本地安全存储中的 Token。

但这有一个限制：

```text
客户端删除 Token
≠ 服务端能立刻使泄露的旧 Token 失效
```

如果未来需要“强制下线”，可以演进为：

```text
短期 Access Token
+ 长期 Refresh Token
+ Redis Token 黑名单 / token_version
```

例如用户修改密码、管理员封禁用户时，使旧 Token 立即失效。

---

## 13\. 当前项目已经做对的事情

- 使用 bcrypt 保存密码哈希，不保存明文密码；
- JWT 中只放最小身份信息：`user_id`、`username`、签发时间、过期时间；
- 使用 HS256 对 Token 签名；
- 验证时限制签名算法；
- 保护路由统一经过 JWT Middleware；
- Handler 从 Context 获取用户 ID，不信任客户端传来的身份字段；
- 权限继续在 Service \+ 数据库中判断；
- 未认证、过期或伪造 Token 返回 `401`；
- 已登录但权限不足返回 `403`。

---

## 14\. 你后续可以补强的部分

当前 V1 足够用于作业与基础项目。后续可逐步增加：

```text
1. 配置 issuer（签发者）与 audience（受众）
2. 增加 JWT ID（jti）
3. Access Token + Refresh Token
4. Redis 黑名单，实现强制退出
5. 修改密码后使旧 Token 失效
6. HTTPS，防止 Token 在传输中被窃取
7. 更严格的登录限流与异常登录日志
```

最重要的安全原则：

```text
JWT 不是密码。
JWT 不要放敏感信息。
JWT 能确认用户身份，但不能代替数据库权限判断。
JWT 密钥绝不能泄露或提交到 Git。
```

你可以按这个顺序在 Apifox 自己练习：

```text
注册
→ 登录
→ 复制 access_token
→ 调用 GET /users/me
→ 故意删除 Token，观察 401
→ 用普通用户 Token 创建活动，观察 403
→ 绑定手机号
→ 再次创建活动，观察成功
```

这套流程走通，你就真正理解了当前项目里的 JWT 鉴权。
