## 一、项目初始化

基础床就按一个 vue 项目;

```text
# 1. 创建 Vue 项目（使用 Vite）
npm create vue@版本号(3.3.4)
建议创建的时候 保留使用 路由的配置

# 2. 进入项目目录
cd my-project

# 3. 安装依赖
npm install

# 4. 安装 Element Plus（UI 组件库）
npm install element-plus

# 5. 安装 Vue Router（路由）(保留了就不需要这个了)
npm install vue-router@4

# 6. 启动项目
npm run dev
```

## 二、完整目录结构

使用 vscode 打开创建出的 vue项目使用下面的框架实现路由开发

```text
my-project/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js
│   ├── App.vue
│   │
│   ├── router/
│   │   └── index.js              ← 路由配置
│   │
│   ├── views/
│   │   ├── layout/               ← 布局文件夹
│   │   │   └── index.vue         ← 布局组件（头+菜单+内容区）
│   │   │
│   │   ├── login/                ← 登录页（独立）
│   │   │   └── index.vue
│   │   │
│   │   ├── index/                ← 首页
│   │   │   └── index.vue
│   │   │
│   │   ├── clazz/                ← 班级管理
│   │   │   └── index.vue
│   │   │
│   │   ├── stu/                  ← 学员管理
│   │   │   └── index.vue
│   │   │
│   │   └── emp/                  ← 员工管理
│   │       └── index.vue
│   │
│   └── styles/                   ← 全局样式（可选）
│       └── global.css
│
└── .gitignore
```

---

## 三、核心配置文件

1\. src/main\.js \- 入口文件

导入使用到的依赖 \(后端为主\)

```text
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'        // Element Plus 样式
import router from './router'                // 导入路由配置
import App from './App.vue'

const app = createApp(App)

app.use(ElementPlus)    // 注册 Element Plus
app.use(router)         // 注册路由
app.mount('#app')       // 挂载到 index.html 的 #app
```

### 2\. src/App\.vue \- 根组件（只有一级路由出口）

实现渲染的目标 为XXX

```text
<template>
  <!-- 一级路由出口：根据 URL 显示 Layout 或 Login -->
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
}
</style>
```

### 3\.src/router/index\.js \- 路由配置

配置内部的路由跳转机制, 最好 直接使用嵌套类型的 页面布局\. 直接就使用 compoment : 直接就定向好展示的视图 , 也可以后期使用redirect 实现重定向 ;

javascript

```text
import { createRouter, createWebHistory } from 'vue-router'
import LayoutView from '@/views/layout/index.vue'

const routes = [
  {
    path: '/',
    component: LayoutView,      // 登录后所有页面共用布局
    redirect: '/index',         // 默认重定向到首页
    children: [
      { path: 'index', name: 'index', component: () => import('@/views/index/index.vue') },
      { path: 'clazz', name: 'clazz', component: () => import('@/views/clazz/index.vue') },
      { path: 'stu', name: 'stu', component: () => import('@/views/stu/index.vue') },
      { path: 'emp', name: 'emp', component: () => import('@/views/emp/index.vue') }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue')  // 独立，全屏显示
  }
]

const router = createRouter({
  history: createWebHistory(),  // HTML5 历史模式，去除 URL 中的 #
  routes
})
//不是纯前端补血; 
// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    // 未登录且不是去登录页，强制跳转到登录页
    next('/login')
  } else {
    next()
  }
})

export default router
```

### 4\. src/views/layout/index\.vue \- 布局组件

```text
<template>  //直接渲染展示的标签
  <div class="common-layout">
    <el-container>
      <!-- 头部区域 -->
      <el-header class="header">
        <span class="title">智能学习辅助系统</span>
        <span class="right-tool">
          <a href="#" @click.prevent="handleChangePwd">
            <el-icon><EditPen /></el-icon> 修改密码
          </a>
          <span class="separator">|</span>
          <a href="#" @click.prevent="handleLogout">
            <el-icon><SwitchButton /></el-icon> 退出登录
          </a>
        </span>
      </el-header>

      <el-container>
        <!-- 左侧菜单 -->
        <el-aside width="220px" class="aside">
          <el-menu router :default-active="$route.path">
            <!-- 首页 -->
            <el-menu-item index="/index">
              <el-icon><Promotion /></el-icon> 首页
            </el-menu-item>

            <!-- 班级学员管理（带子菜单） -->
            <el-sub-menu index="manage">
              <template #title>
                <el-icon><Menu /></el-icon> 班级学员管理
              </template>
              <el-menu-item index="/clazz">
                <el-icon><HomeFilled /></el-icon> 班级管理
              </el-menu-item>
              <el-menu-item index="/stu">
                <el-icon><UserFilled /></el-icon> 学员管理
              </el-menu-item>
            </el-sub-menu>

            <!-- 员工管理 -->
            <el-menu-item index="/emp">
              <el-icon><Avatar /></el-icon> 员工管理
            </el-menu-item>
          </el-menu>
        </el-aside>

        <!-- 右侧内容区域（二级路由出口） -->
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
  ElMessage.success('已退出登录')
}

const handleChangePwd = () => {
  // 跳转到修改密码页面或打开弹窗
  router.push('/change-pwd')
}
</script>

<style scoped>
.common-layout {
  height: 100vh;
  width: 100%;
}

.header {
  background-image: linear-gradient(to right, #00547d, #007fa4, #00aaa0, #00d072, #a8eb12);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  color: white;
  font-size: 32px;
  font-family: 楷体;
  font-weight: bolder;
}

.right-tool {
  color: white;
}

.right-tool a {
  color: white;
  text-decoration: none;
}

.separator {
  margin: 0 12px;
}

.aside {
  border-right: 1px solid #e6e6e6;
  height: calc(100vh - 60px);
}
</style>
```

### 5\. src/views/login/index\.vue \- 登录页

```text
<template>
  <div class="login-container">
    <div class="login-box">
      <h2>用户登录</h2>
      <el-input v-model="username" placeholder="用户名" />
      <el-input v-model="password" type="password" placeholder="密码" />
      <el-button type="primary" @click="handleLogin">登录</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const username = ref('')
const password = ref('')

const handleLogin = async () => {  实现类同步, 方便维护代码
  // 调用后端登录接口
  // 假设登录成功
  if (username.value && password.value) {
    localStorage.setItem('token', 'fake-token')
    ElMessage.success('登录成功')
    router.push('/index')
  } else {
    ElMessage.error('请输入用户名和密码')
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  text-align: center;
}

.login-box h2 {
  margin-bottom: 30px;
}

.login-box .el-input {
  margin-bottom: 20px;
}

.login-box .el-button {
  width: 100%;
}
</style>
```

### 6\. 普通页面示例（src/views/index/index\.vue）

```text
<template>
  <div class="page">
    <h1>首页</h1>
    <p>欢迎使用智能学习辅助系统</p>
  </div>
</template>

<style scoped>
.page {
  padding: 24px;
}
</style>
```

---

## 四、Vite 配置（可选）

```text
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')  // 配置 @ 别名
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',   // 后端地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

---

## 五、完整运行逻辑流程图

```text
1. npm run dev
       ↓
2. 浏览器打开 http://localhost:5173
       ↓
3. index.html 加载，包含 <div id="app"></div>
       ↓
4. main.js 执行
   - 创建 Vue 应用
   - 注册 Element Plus
   - 注册 路由
   - 挂载到 #app
       ↓
5. App.vue 渲染到 #app
   - App.vue 中有 <router-view />
       ↓
6. 路由匹配当前 URL
   - 无 token → 跳转 /login → 显示 LoginView（全屏登录页）
   - 有 token → 显示 LayoutView（布局组件）
       ↓
7. LayoutView 渲染
   - 显示 头部 + 左侧菜单
   - 内部 <router-view /> 显示子页面
       ↓
8. 用户点击菜单 → 路由跳转 → 只替换 LayoutView 中的子页面
```

## 六\.实现测试

可以直接使用 APIfox 创建出一个可以实现访问 的接口,

需要生成的随机响应数据 需要生成格式 :

可以直接使用 接口文档 中的JSON 样例来实现生成随机的模板 :

软件可以直接生成 云端的Mock 提供访问 ;

##
