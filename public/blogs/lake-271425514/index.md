### REST 与 RESTful API 核心概念

REST 是一种客户端与 Web 服务器交互的架构风格

核心是**用 HTTP 协议的 4 个请求方法代表不同操作**：

- `GET`：获取资源
- `POST`：新建资源
- `PUT`：更新资源
- `DELETE`：删除资源

遵循 REST 风格的 API 称为 **RESTful API**，是当前前后端分离架构中主流的交互方式。

---

### 传统 API 设计 vs RESTful API 设计（以书籍管理为例）

#### 1\. 传统设计模式

<table class="ne-table" id="mvuyC"><tbody><tr><td width="250"><p class="ne-p" id="u31009d76"><strong><span class="ne-text">请求方法</span></strong></p></td><td width="250"><p class="ne-p" id="u308021c5"><strong><span class="ne-text">URL</span></strong></p></td><td width="250"><p class="ne-p" id="ua030d449"><strong><span class="ne-text">含义</span></strong></p></td></tr><tr><td width="250"><p class="ne-p" id="uffdfb256"><span class="ne-text">GET</span></p></td><td width="250"><p class="ne-p" id="u47db74df"><code class="ne-code"><span class="ne-text">/book</span></code></p></td><td width="250"><p class="ne-p" id="ud8154c52"><span class="ne-text">查询书籍信息</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u333d59c8"><span class="ne-text">POST</span></p></td><td width="250"><p class="ne-p" id="u4c6b234a"><code class="ne-code"><span class="ne-text">/create_book</span></code></p></td><td width="250"><p class="ne-p" id="u314acefb"><span class="ne-text">创建书籍记录</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ua2646250"><span class="ne-text">POST</span></p></td><td width="250"><p class="ne-p" id="uaa3097cc"><code class="ne-code"><span class="ne-text">/update_book</span></code></p></td><td width="250"><p class="ne-p" id="u67d709a5"><span class="ne-text">更新书籍信息</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ueb5f7a4e"><span class="ne-text">POST</span></p></td><td width="250"><p class="ne-p" id="ub51a645e"><code class="ne-code"><span class="ne-text">/delete_book</span></code></p></td><td width="250"><p class="ne-p" id="u452f10e9"><span class="ne-text">删除书籍信息</span></p></td></tr></tbody></table>

#### 2\. RESTful API 设计模式 : 使用四种请求方式直接创建对应的API 接口

<table class="ne-table" id="HgE2X"><tbody><tr><td width="250"><p class="ne-p" id="uc66ca72d"><strong><span class="ne-text">请求方法</span></strong></p></td><td width="250"><p class="ne-p" id="u54071b2f"><strong><span class="ne-text">URL</span></strong></p></td><td width="250"><p class="ne-p" id="u23acbb9f"><strong><span class="ne-text">含义</span></strong></p></td></tr><tr><td width="250"><p class="ne-p" id="udad9e3eb"><span class="ne-text">GET</span></p></td><td width="250"><p class="ne-p" id="u11d13543"><code class="ne-code"><span class="ne-text">/book</span></code></p></td><td width="250"><p class="ne-p" id="uc97d6901"><span class="ne-text">查询书籍信息</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u3f65bf0e"><span class="ne-text">POST</span></p></td><td width="250"><p class="ne-p" id="ueb46b4e2"><code class="ne-code"><span class="ne-text">/book</span></code></p></td><td width="250"><p class="ne-p" id="u2e00b126"><span class="ne-text">创建书籍记录</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u9058db2e"><span class="ne-text">PUT</span></p></td><td width="250"><p class="ne-p" id="u53ce2eb3"><code class="ne-code"><span class="ne-text">/book</span></code></p></td><td width="250"><p class="ne-p" id="u4a20d8c2"><span class="ne-text">更新书籍信息</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u3369ef7a"><span class="ne-text">DELETE</span></p></td><td width="250"><p class="ne-p" id="u213e7e08"><code class="ne-code"><span class="ne-text">/book</span></code></p></td><td width="250"><p class="ne-p" id="ua03a699e"><span class="ne-text">删除书籍信息</span></p></td></tr></tbody></table>
