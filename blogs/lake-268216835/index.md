## 页面布局

### 准备工作

1. 导入资料中准备的基础工程到VsCode。 【复制出来放在自己的工作目录下】

![](</blogs/_assets/lakebook/29196bd303adfaa15182c893.png>)

1. 启动前端项目，访问该项目

![](</blogs/_assets/lakebook/43c1425676a7d0d6f79a37a9.png>)

打开浏览器，访问 http://localhost:5173

![](</blogs/_assets/lakebook/3fc2b88e73cc56ea67e776f5.png>)

在提供的基础工程中，最基本的页面布局，已经准备好了。 我们通过页面原型可以看到页面的布局如下：

![](</blogs/_assets/lakebook/ae837524bb1ef92a2547d7db.png>)

其实要实现这个页面布局，我们可以借助于 `ElementPlus`中提供的 container 容器布局。

![](</blogs/_assets/lakebook/7eb0357ebb8e2da3e940dcca.png>)

Container布局容器，用于布局的容器组件，方便快速搭建页面的基本结构：

`<el-container>`：外层容器。 当子元素中包含 `<el-header>` 或 `<el-footer>` 时，全部子元素会垂直上下排列， 否则会水平左右排列。

`<el-header>`：顶栏容器。

`<el-aside>`：侧边栏容器。

`<el-main>`：主要区域容器。

`<el-footer>`：底栏容器。

**提示：**当 `<el-container>` 子元素中包含 `<el-header>`  或 `<el-footer>` 时，全部子元素会垂直上下排列， 否则会水平左右排列。

### 左侧菜单布局

接下来，我们再来完成左侧菜单栏的制作。

![](</blogs/_assets/lakebook/99834f1b6c6aa866d310ea4b.png>)

左侧菜单栏的制作，也不需要我们自己实现，其实在 `ElementPlus`中已经提供了对应的菜单组件，我们可以直接参考【PS: 其实就是复制过来，参考页面原型和需求，将其改造成我们需要的样子就可以了】。

**参考代码的出处:**

![](</blogs/_assets/lakebook/2ecd41b6de5d887a643d89e1.png>)

然后就可以参考其提供的源码，复制到我们的侧边栏部分 `<el-aside> ... </el-aside>`，然后根据我们案例的需要进行改造，改造成我们需要的样子即可。

最终左侧菜单栏的代码如下 ，大家可以直接导入到 `views/layout/index.vue` 的侧边栏区域 `<el-aside> ... </el-aside>` ：

```text
<el-menu>
    <!-- 首页菜单 -->
    <el-menu-item index="/index">
      <el-icon><Promotion /></el-icon> 首页
    </el-menu-item>
    
    <!-- 班级管理菜单 -->
    <el-sub-menu index="/manage">
      <template #title>
        <el-icon><Menu /></el-icon> 班级学员管理
      </template>
      <el-menu-item index="/clazz">
        <el-icon><HomeFilled /></el-icon>班级管理
      </el-menu-item>
      <el-menu-item index="/stu">
        <el-icon><UserFilled /></el-icon>学员管理
      </el-menu-item>
    </el-sub-menu>
    
    <!-- 系统信息管理 -->
    <el-sub-menu index="/system">
      <template #title>
        <el-icon><Tools /></el-icon>系统信息管理
      </template>
      <el-menu-item index="/dept">
        <el-icon><HelpFilled /></el-icon>部门管理
      </el-menu-item>
      <el-menu-item index="/emp">
        <el-icon><Avatar /></el-icon>员工管理
      </el-menu-item>
    </el-sub-menu>
    
    <!-- 数据统计管理 -->
    <el-sub-menu index="/report">
      <template #title>
        <el-icon><Histogram /></el-icon>数据统计管理
      </template>
      <el-menu-item index="/empReport">
        <el-icon><InfoFilled /></el-icon>员工信息统计
      </el-menu-item>
      <el-menu-item index="/stuReport">
        <el-icon><Share /></el-icon>学员信息统计
      </el-menu-item>
      <el-menu-item index="/log">
        <el-icon><Document /></el-icon>日志信息统计
      </el-menu-item>
    </el-sub-menu>
</el-menu>
```

最终，浏览器打开的效果如下：

![](</blogs/_assets/lakebook/47e35ab50ac43436d23ec2a4.png>)

到目前为止，`views/layout/index.vue` 中的整体内容如下：

```text
<script setup>

</script>

<template>
  <div class="common-layout">
    <el-container>
      <!-- Header 区域 -->
      <el-header class="header">
        <span class="title">Tlias智能学习辅助系统</span>
        <span class="right_tool">
          <a href="">
            <el-icon><EditPen /></el-icon> 修改密码 &nbsp;&nbsp;&nbsp; |  &nbsp;&nbsp;&nbsp;
          </a>
          <a href="">
            <el-icon><SwitchButton /></el-icon> 退出登录
          </a>
        </span>
      </el-header>
      
      <el-container>
        <!-- 左侧菜单 -->
        <el-aside width="200px" class="aside">
          
          <el-menu>
            <!-- 首页菜单 -->
            <el-menu-item index="/index">
              <el-icon><Promotion /></el-icon> 首页
            </el-menu-item>
            
            <!-- 班级管理菜单 -->
            <el-sub-menu index="/manage">
              <template #title>
                <el-icon><Menu /></el-icon> 班级学员管理
              </template>
              <el-menu-item index="/clazz">
                <el-icon><HomeFilled /></el-icon>班级管理
              </el-menu-item>
              <el-menu-item index="/stu">
                <el-icon><UserFilled /></el-icon>学员管理
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 系统信息管理 -->
            <el-sub-menu index="/system">
              <template #title>
                <el-icon><Tools /></el-icon>系统信息管理
              </template>
              <el-menu-item index="/dept">
                <el-icon><HelpFilled /></el-icon>部门管理
              </el-menu-item>
              <el-menu-item index="/emp">
                <el-icon><Avatar /></el-icon>员工管理
              </el-menu-item>
            </el-sub-menu>

            <!-- 数据统计管理 -->
            <el-sub-menu index="/report">
              <template #title>
                <el-icon><Histogram /></el-icon>数据统计管理
              </template>
              <el-menu-item index="/empReport">
                <el-icon><InfoFilled /></el-icon>员工信息统计
              </el-menu-item>
              <el-menu-item index="/stuReport">
                <el-icon><Share /></el-icon>学员信息统计
              </el-menu-item>
              <el-menu-item index="/log">
                <el-icon><Document /></el-icon>日志信息统计
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
          
        </el-aside>
        
        <el-main>
          右侧核心展示区域
        </el-main>
      </el-container>
      
    </el-container>
  </div>
</template>

<style scoped>
.header {
  background-image: linear-gradient(to right, #00547d, #007fa4, #00aaa0, #00d072, #a8eb12);
}

.title {
  color: white;
  font-size: 40px;
  font-family: 楷体;
  line-height: 60px;
  font-weight: bolder;
}

.right_tool{
  float: right;
  line-height: 60px;
}

a {
  color: white;
  text-decoration: none;
}

.aside {
  width: 220px;
  border-right: 1px solid #ccc;
  height: 730px;
}
</style>
```

目前，我们点击左侧的菜单，右侧主区域展示的内容，还不能做到动态变化。 那应该如何做到动态变化呢 ？

要解决这个问题，就需要通过VueRouter来解决。

## VueRouter

### 介绍

![](</blogs/_assets/lakebook/e52c1c7232a44cfce50abb9c.png>)

- Vue Router：Vue的官方路由。 为Vue提供富有表现力、可配置的、方便的路由。
- Vue中的路由，主要定义的是路径与组件之间的对应关系。

比如，我们打开一个网站，点击左侧菜单，地址栏的地址发生变化。 地址栏地址一旦发生变化，在主区域显示对应的页面组件。

![](</blogs/_assets/lakebook/8af7382b3ef0bfcddefac374.png>)

![](</blogs/_assets/lakebook/0030a17835d10bfab1ff330f.png>)

VueRouter主要由以下三个部分组成，如下所示：

![](</blogs/_assets/lakebook/ac15a288c811af5d38acaabc.png>)

- VueRouter：路由器类，根据路由请求在路由视图中动态渲染选中的组件
- **&lt;router\-link&gt;：请求链接组件，浏览器会解析成&lt;a&gt;**
- &lt;router\-view&gt;：动态视图组件，用来渲染展示与路由路径对应的组件

### 基础路由配置

**1\)\. 在** `views/layout/index.vue` **中，调整代码，具体调整位置如下：**

**直接在需要实现链接地址的代码上使用 &lt;el\-menu rount&gt; 可以直接开启 vue rount 模式 \. 后续的实现只需要 配置 index 中的访问路径就可以了;**

- 在左侧菜单栏的 `<el-menu>` 标签上添加 `router`属性，这会让 Element Plus 的 `<el-menu>` 组件自动根据路由来激活对应的菜单项。
- 使用 `<router-view>` 组件来渲染根据路由动态变化的内容。
- 确保每个 `<el-menu-item>` 的 `index`属性值与你想要导航到的路径相匹配。

```text
<script setup>
// 无需额外导入，因为我们只是使用了 Element Plus 和 Vue Router 的基本功能
</script>

<template>
  <div class="common-layout">
    <el-container>
      <!-- Header 区域 -->
      <el-header class="header">
        <span class="title">Tlias智能学习辅助系统</span>
        <span class="right_tool">
          <a href="">
            <el-icon><EditPen /></el-icon> 修改密码 &nbsp;&nbsp;&nbsp; |  &nbsp;&nbsp;&nbsp;
          </a>
          <a href="">
            <el-icon><SwitchButton /></el-icon> 退出登录
          </a>
        </span>
      </el-header>
      
      <el-container>
        <!-- 左侧菜单 -->
        <el-aside width="200px" class="aside">

          <el-menu router>  //直接实现index 寻找路径 找到请求 ;
            <!-- 首页菜单 -->
            <el-menu-item index="/index">
              <el-icon><Promotion /></el-icon> 首页
            </el-menu-item>
            
            <!-- 班级管理菜单 -->
            <el-sub-menu index="/manage">
              <template #title>
                <el-icon><Menu /></el-icon> 班级学员管理
              </template>
              <el-menu-item index="/clazz">
                <el-icon><HomeFilled /></el-icon>班级管理
              </el-menu-item>
              <el-menu-item index="/stu">
                <el-icon><UserFilled /></el-icon>学员管理
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 系统信息管理 -->
            <el-sub-menu index="/system">
              <template #title>
                <el-icon><Tools /></el-icon>系统信息管理
              </template>
              <el-menu-item index="/dept">
                <el-icon><HelpFilled /></el-icon>部门管理
              </el-menu-item>
              <el-menu-item index="/emp">
                <el-icon><Avatar /></el-icon>员工管理
              </el-menu-item>
            </el-sub-menu>

            <!-- 数据统计管理 -->
            <el-sub-menu index="/report">
              <template #title>
                <el-icon><Histogram /></el-icon>数据统计管理
              </template>
              <el-menu-item index="/report/emp">
                <el-icon><InfoFilled /></el-icon>员工信息统计
              </el-menu-item>
              <el-menu-item index="/report/stu">
                <el-icon><Share /></el-icon>学员信息统计
              </el-menu-item>
              <el-menu-item index="/log">
                <el-icon><Document /></el-icon>日志信息统计
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-aside>
        
        <!-- 主展示区域 -->
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.header {
  background-image: linear-gradient(to right, #00547d, #007fa4, #00aaa0, #00d072, #a8eb12);
}

.title {
  color: white;
  font-size: 40px;
  font-family: 楷体;
  line-height: 60px;
  font-weight: bolder;
}

.right_tool{
  float: right;
  line-height: 60px;
}

a {
  color: white;
  text-decoration: none;
}

.aside {
  width: 220px;
  border-right: 1px solid #ccc;
  height: 730px;
}
</style>
```

**2\)\. 在 router/index\.js 中配置请求路径与组件之间的关系。**

**需要配置访问 路径 和 本地文件直接的位置关系 ;**

```text
import { createRouter, createWebHistory} from 'vue-router';

import IndexView from '@/views/index/index.vue';
import ClazzView from '@/views/clazz/index.vue';
import StuView from '@/views/stu/index.vue';
import DeptView from '@/views/dept/index.vue';
import EmpView from '@/views/emp/index.vue';
import EmpReportView from '@/views/report/emp/index.vue';
import StuReportView from '@/views/report/stu/index.vue';
import LogView from '@/views/log/index.vue';
import LoginView from '@/views/login/index.vue';

const routes = [
  { path: '/index', component: IndexView },
  { path: '/clazz', component: ClazzView },
  { path: '/stu', component: StuView },
  { path: '/dept', component: DeptView },
  { path: '/emp', component: EmpView },
  { path: '/report/emp', component: EmpReportView },
  { path: '/report/stu', component: StuReportView },
  { path: '/log', component: LogView },
  { path: '/login', component: LoginView },  //可以添加name属性
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

经过这么两步操作之后，我们就可以看到，在页面上，点击左侧菜单，右侧主展示区域，就会显示出对应的页面了。

![](</blogs/_assets/lakebook/04791471a20bfa79df387470.png>)

![](</blogs/_assets/lakebook/115e8e06e41d15140db42f01.png>)

那要完成这个功能效果，我们就需要用到Vue生态中的路由 `Vue-Router`。

### 完善路由配置

上述我们只是完成了最基本的路由配置。 并经过测试我们发现，如果我们访问 /login 路径，会发现，登录页面是在layout页面中嵌套展示的，这肯定是不合适的。

![](</blogs/_assets/lakebook/6d6bca8e75b865a350b473de.png>)

那接下来，我们就来优化一下路由的配置。最终配置形式如下，在 `router/index.js` 中做如下配置：

就是使用了嵌套路由, 放置到外部使用 的 登陆路由 , 重定向到了path: '/login', name: 'login', component: LoginView \. 此位置是全局展示

使用这个查看前端文件的调用逻辑更好理解;

```text
const routes = [
  {
    path: '/',
    component: LayoutView,      // ← 匹配到 / 就用这个
    children: [
      { path: 'index', component: IndexView },
      { path: 'clazz', component: ClazzView }
    ]
  },
  { path: '/login', component: LoginView }  // ← 匹配到 /login 就用这个
]
```

```text
import { createRouter, createWebHistory } from 'vue-router'

import IndexView from '@/views/index/index.vue'
import ClazzView from '@/views/clazz/index.vue'
import DeptView from '@/views/dept/index.vue'
import EmpView from '@/views/emp/index.vue'
import LogView from '@/views/log/index.vue'
import StuView from '@/views/stu/index.vue'
import EmpReportView from '@/views/report/emp/index.vue'
import StuReportView from '@/views/report/stu/index.vue'
import LayoutView from '@/views/layout/index.vue'
import LoginView from '@/views/login/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
     path: '/', 
     name: '',
     component: LayoutView,
     redirect: '/index', //重定向 . 也可以直接让组件转向-->LayoutView方向,可以减少一步使用重定向的操作; 
     children: [
      {path: 'index', name: 'index', component: IndexView},
      {path: 'clazz', name: 'clazz', component: ClazzView},
      {path: 'stu', name: 'stu', component: StuView},
      {path: 'dept', name: 'dept', component: DeptView},
      {path: 'emp', name: 'emp', component: EmpView},
      {path: 'log', name: 'log', component: LogView},
      {path: 'empReport', name: 'empReport', component: EmpReportView},
      {path: 'stuReport', name: 'stuReport', component: StuReportView},
     ]
    },
    {path: '/login', name: 'login', component: LoginView}
  ]
})

export default router
```

具体的执行访问流程如下:

先访问 App\.vue 文件 ;

![](</blogs/_assets/lakebook/eb5c076bf5aedb67d2ae6b3f.png>)

1. 当点击左侧菜单栏的员工管理菜单时，最终地址栏会访问路径 `/emp` 。
2. 此时VueRouter，会自动的到所配置的路由表（`router/index.js`）中，查找与该路径对应的组件，并展示在路由展示组件`<router-view>`对应的位置中。

```text
src/
├── views/
│   ├── layout/              ← 布局文件夹（你提到的）
│   │   └── index.vue        ← 布局组件（头部 + 菜单 + 内容区）
│   │
│   ├── login/               ← 登录页（独立，不在 layout 里）
│   │   └── index.vue
│   │
│   ├── index/               ← 首页
│   │   └── index.vue
│   ├── clazz/               ← 班级管理
│   │   └── index.vue
│   ├── stu/                 ← 学员管理
│   │   └── index.vue
│   └── ...其他页面
│
├── router/
│   └── index.js             ← 路由配置
│
├── App.vue                  ← 根组件（只有 <router-view />）
└── main.js                  ← 入口文件
```

## 部门管理

部门管理的页面内容，写在 `src/views/dept/index.vue` 中。

### 部门列表

#### 基本布局

首先，根据页面原型、需求说明、接口文档，先完成页面的基本布局 。 可以参考 `ElementPlus` 中的组件，拷贝过来适当做一个改造。

![](</blogs/_assets/lakebook/207fe63868a039bcd56c74d2.png>)

我们先来完成页面的基本布局。

部门管理组件 `src/views/dept/index.vue` 具体的页面布局代码如下：

```text
<script setup>
import { ref } from 'vue';

// 示例数据
const deptList= ref([
  { id: 1, name: '学工部', createTime: '2024-09-01T23:06:29', updateTime: '2024-09-01T23:06:29' },
  { id: 2, name: '教研部', createTime: '2024-09-01T23:06:29', updateTime: '2024-09-01T23:06:29' }
]);

// 编辑部门 - 根据ID查询回显数据
const handleEdit = (id) => {
  console.log(`Edit item with ID ${id}`);
  // 在这里实现编辑功能
};

// 删除部门 - 根据ID删除部门
const handleDelete = (id) => {
  console.log(`Delete item with ID ${id}`);
  // 在这里实现删除功能
};
</script>

<template>
  <h1>部门管理</h1>

  <!-- 按钮靠页面右侧显示 -->
  <el-button type="primary" @click="handleEdit" style="float: right;"> + 新增部门</el-button> <br><br>

  <el-table :data="deptList" border style="width: 100%;">
    <el-table-column type="index" label="序号" width="100" align="center"/>
    <el-table-column prop="name" label="部门名称" width="300" align="center"/>
    <el-table-column prop="updateTime" label="最后修改时间" width="300" align="center"/>
    <el-table-column fixed="right" label="操作" align="center">
      <template #default="scope">
        <el-button size="small" @click="handleEdit(scope.row.id)">修改</el-button>
        <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
  
</template>

<style scoped>

</style>
```

表格中每一列展示的属性 `prop` 都是根据接口文档来的，接口文档返回什么样的数据，我们就安装对应的数据格式进行解析。

最终页面效果，展示如下：

![](</blogs/_assets/lakebook/e58d1117685898bb2afd7009.png>)

#### 加载数据

根据需求，需要在新增、修改、删除部门之后，加载最新的部门数据。 在打开页面之后，也需要自动加载部门数据。 那接下来，我们就需要基于axios发送异步请求，动态获取数据。

需要在 `src/views/dept/index.vue` 中增加如下代码，在页面加载完成发送异步请求（`https://apifoxmock.com/m1/3128855-1224313-default/depts`），动态加载的Axios。

```text
<script setup>
import {ref, onMounted} from 'vue'
import axios from 'axios'

//声明列表展示数据
let deptList= ref([])

//动态加载数据-查询部门
const queryAll = async () => {
  const result = await axios.get('https://apifoxmock.com/m1/3128855-1224313-default/depts')
  deptList.value = result.data.data
}

//钩子函数
onMounted(() => {
  queryAll()
})

// 编辑部门 - 根据ID查询回显数据
const handleEdit = (id) => {
  console.log(`Edit item with ID ${id}`);
  // 在这里实现编辑功能
};

// 删除部门 - 根据ID删除部门
const handleDelete = (id) => {
  console.log(`Delete item with ID ${id}`);
  // 在这里实现删除功能
};
</script>
```

添加代码后，最终 `src/views/dept/index.vue` 完整代码如下：

```text
<script setup>
import {ref, onMounted} from 'vue'
import axios from 'axios'

//声明列表展示数据
let deptList= ref([])

//动态加载数据-查询部门
const queryAll = async () => {
  const result = await axios.get('https://apifoxmock.com/m1/3161925-0-default/depts')
  deptList.value = result.data.data
}

//钩子函数
onMounted(() => {
  queryAll()
})

// 编辑部门 - 根据ID查询回显数据
const handleEdit = (id) => {
  console.log(`Edit item with ID ${id}`);
  // 在这里实现编辑功能
};

// 删除部门 - 根据ID删除部门
const handleDelete = (id) => {
  console.log(`Delete item with ID ${id}`);
  // 在这里实现删除功能
};
</script>

<template>
  <h1>部门管理</h1>

  <!-- 按钮靠页面右侧显示 -->
  <el-button type="primary" @click="handleEdit" style="float: right;"> + 新增部门</el-button> <br><br>

  <el-table :data="deptList" border style="width: 100%;">
    <el-table-column type="index" label="序号" width="100" align="center"/>
    <el-table-column prop="name" label="部门名称" width="300" align="center"/>
    <el-table-column prop="updateTime" label="最后修改时间" width="300" align="center"/>
    <el-table-column fixed="right" label="操作" align="center">
      <template #default="scope">
        <el-button size="small" @click="handleEdit(scope.row.id)">修改</el-button>
        <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>

</style>
```

页面效果如下，页面一加载，马上就会查询出所有的部门数据：

![](</blogs/_assets/lakebook/09e79f11be5bd969ea26b25c.png>)

我们可以看到数据可以正常的查询出来，并展示在页面中。

**思考：直接在Vue组件中，基于axios发送异步请求，存在什么问题？**

![](</blogs/_assets/lakebook/0203124e64f83ef9dd38aaff.png>)

我们刚才在完成部门列表查询时，是直接基于axios发送异步请求，直接将接口的请求地址放在组件文件 `.vue` 中。 而如果开发一个大型的项目，组件文件可能会很多很多很多，如果前端开发完毕，进行前后端联调测试了，需要修改请求地址，那么此时，就需要找到每一个 `.vue` 文件，然后挨个修改。 所以上述的代码，虽然实现了动态加载数据的功能。 但是存在以下问题：

- 请求路径难以维护
- 数据解析繁琐

#### 程序优化

1\)\. 为了解决上述问题，我们在前端项目开发时，通常会定义一个请求处理的工具类 \- `src/utils/request.js` 。 在这个工具类中，对axios进行了封装。 具体代码如下：

```text
import axios from 'axios'

//创建axios实例对象
const request = axios.create({
  baseURL: '/api',
  timeout: 600000
})

//axios的响应 response 拦截器
request.interceptors.response.use(
  (response) => { //成功回调
    return response.data
  },
  (error) => { //失败回调
    return Promise.reject(error)
  }
)

export default request
```

2\)\. 而与服务端进行异步交互的逻辑，通常会按模块，封装在一个单独的API中，如：`src/api/dept.js`

```text
import request from "@/utils/request"

//列表查询
export const queryAllApi = () => request.get('/depts')
```

3\)\. 修改 `src/views/dept/index.vue` 中的代码

现在就不需要每次直接调用axios发送异步请求了，只需要将我们定义的对应模块的API导入进来，就可以直接使用了。

```text
<script setup>
import {ref, onMounted} from 'vue'
import {queryAllApi} from '@/api/dept'

//声明列表展示数据
let deptList= ref([])

//动态加载数据-查询部门
const queryAll = async () => {
  const result = await queryAllApi()
  deptList.value = result.data
}

//钩子函数
onMounted(() => {
  queryAll()
})

// 编辑部门 - 根据ID查询回显数据
const handleEdit = (id) => {
  console.log(`Edit item with ID ${id}`);
  // 在这里实现编辑功能
};

// 删除部门 - 根据ID删除部门
const handleDelete = (id) => {
  console.log(`Delete item with ID ${id}`);
  // 在这里实现删除功能
};
</script>
```

做完上面这三步之后，我们打开浏览器发现，并不能访问到接口数据。原因是因为，目前请求路径不对。

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1777785096017-af410c25-2f56-4f29-8b00-4e2e7cdd43a1.png>)

4\)\. 在 `vite.config.js` 中配置前端请求服务器的信息

在服务器中配置代理proxy的信息，并在配置代理时，执行目标服务器。 以及url路径重写的规则。

![](</blogs/_assets/lakebook/de74dab5706530bb17d7c3ac.png>)

```text
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        secure: false,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
```

添加内容为，绿色阴影部分的代码。

然后，我们就可以启动服务器端的程序（将之前开发的服务端程序启动起来测试一下 ），进行测试了（【**注意：测试时, 记得将令牌校验的过滤器及拦截器, 以及记录日志的AOP程序** **全部注释**】）。

![](</blogs/_assets/lakebook/b074e237321225d53bb773f2.png>)

### 新增部门

#### 功能实现

接下来，我们再来完成新增部门的功能实现。

新增部门和编辑部门，可以同用一个Dialog对话框。而这个对话框中，主要包括两个ElementPlus中的组件，分别为：Dialog对话框组件，Form表单组件。

![](</blogs/_assets/lakebook/4d0059b14e5841f337968e4c.png>)

1\)\. 在 `src/views/dept/index.vue` 中完成页面布局，并编写交互逻辑，完成数据绑定。

完整代码如下：

```text
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { queryAllApi, addDeptApi } from '@/api/dept'

// 声明列表展示数据
let deptList= ref([])

// 动态加载数据 - 查询部门
const queryAll = async () => {
  const result = await queryAllApi()
  deptList.value = result.data
}

// 钩子函数
onMounted(() => {
  queryAll()
})

// 编辑部门 - 根据ID查询回显数据
const handleEdit = (id) => {
  console.log(`Edit item with ID ${id}`);
  // 在这里实现编辑功能
};

// 删除部门 - 根据ID删除部门
const handleDelete = (id) => {
  console.log(`Delete item with ID ${id}`);
  // 在这里实现删除功能
};


const formTitle = ref('')
//新增部门
const add = () => {
  formTitle.value = '新增部门'
  showDialog.value = true
  deptForm.value = {name: ''}
}

// 新增部门对话框的状态
const showDialog = ref(false)
// 表单数据
const deptForm = ref({name: ''})
// 表单验证规则
const formRules = ref({
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
  ]
})

// 表单标签宽度
const formLabelWidth = ref('120px')
// 表单引用
const deptFormRef = ref(null)

// 重置表单
const resetForm = () => {
  deptFormRef.value.resetFields()
}

// 提交表单
const save = async () => {
  await deptFormRef.value.validate(async valid => {
    if (!valid) return
    // 提交表单
    const result = await addDeptApi(deptForm.value)
    if(result.code){
      ElMessage.success('操作成功')
      // 关闭对话框
      showDialog.value = false
      // 重置表单
      resetForm()
      // 重新加载数据
      queryAll()
    }else {
      ElMessage.error(result.msg)
    }
  })
}
</script>

<template>
  <h1>部门管理</h1>

  <!-- 按钮靠页面右侧显示 -->
  <el-button type="primary" @click="add()" style="float: right;"> + 新增部门</el-button> <br><br>

  <!-- 数据展示表格 -->
  <el-table :data="deptList" border style="width: 100%;">
    <el-table-column type="index" label="序号" width="100" align="center"/>
    <el-table-column prop="name" label="部门名称" width="300" align="center"/>
    <el-table-column prop="updateTime" label="最后修改时间" width="300" align="center"/>
    <el-table-column fixed="right" label="操作" align="center">
      <template #default="scope">
        <el-button size="small" @click="handleEdit(scope.row.id)">修改</el-button>
        <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- 新增部门的对话框 -->
  <el-dialog v-model="showDialog" :title="formTitle" width="30%" @close="resetForm">
    <el-form :model="deptForm" :rules="formRules" ref="deptFormRef">
      <el-form-item label="部门名称" prop="name" label-width="80px">
        <el-input v-model="deptForm.name" autocomplete="off"></el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </span>
    </template>
  </el-dialog>

</template>

<style scoped>

</style>
```

2\)\. 在 `src/api/dept.js` 中增加如下代码

```text
//添加部门
export const addDeptApi = (data) => request.post('/depts', data)
```

目前 `src/api/dept.js` 文件中完整代码如下:

```text
import request from '@/utils/request'

//查询全部部门
export const queryAllApi = () => request.get('/depts')

//添加部门
export const addDeptApi = (data) => request.post('/depts', data)
```

打开浏览器进行测试，效果如下：

![](</blogs/_assets/lakebook/75ba040fc4609551b216ee93.png>)

点击保存之后，就会将数据保存到数据库，并重新查询出最新的数据，展示在页面中。

![](</blogs/_assets/lakebook/0d6666275ce0ff8029903ffd.png>)

#### 表单校验

Form 组件允许你验证用户的输入是否符合规范，来帮助你找到和纠正错误。`Form` 组件提供了表单验证的功能，只需为 `rules` 属性传入约定的验证规则，并将 `form-Item` 的 `prop` 属性设置为需要验证的特殊键值即可。

![](</blogs/_assets/lakebook/e154567f812362bebb753a18.png>)

操作步骤：

- 通过ref属性注册元素的引用。
- 定义表单校验规则，通过rules属性与表单绑定，并通过prop属性绑定对应的表单项。
- 表单提交时，校验表单，校验通过，则允许提交表单。

![](</blogs/_assets/lakebook/46a0aa59f546a642ef2e25fd.png>)

### 修改部门

对于修改操作，通常会分为两步进行：

1. 查询回显
2. 保存修改

![](</blogs/_assets/lakebook/530a5fb5007f72009151c3bb.png>)

交互逻辑：

1. 点击 编辑 按钮，根据ID进行查询，弹出对话框，完成页面回显展示。（查询回显）
2. 点击 确定 按钮，保存修改后的数据，完成数据更新操作。（保存修改）

#### 查询回显

1\)\. 在 `src/api/dept.js` 中定义根据id查询的请求

```text
//根据ID查询
export const queryInfoApi = (id) => request.get(`/depts/${id}`)
```

2\)\. 在 `src/views/dept/index.vue` 中添加根据ID查询回显的逻辑

为修改按钮绑定事件 `<template></template>`:

```text
<el-button size="small" @click="handleEdit(scope.row.id)">修改</el-button>
```

在 `<script> </script>` 添加JS逻辑：

```text
// 编辑部门 - 根据ID查询回显数据
const handleEdit = async (id) => {
  console.log(`Edit item with ID ${id}`);
  formTitle.value = '修改部门'
  showDialog.value = true
  deptForm.value = {name: ''}

  const result = await queryInfoApi(id)
  if(result.code){
    deptForm.value = result.data
  }
};
```

到目前为止，完整的 `src/views/dept/index.vue` 代码如下：

```text
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { queryAllApi, addDeptApi, queryInfoApi } from '@/api/dept'

// 声明列表展示数据
let deptList= ref([])

// 动态加载数据 - 查询部门
const queryAll = async () => {
  const result = await queryAllApi()
  deptList.value = result.data
}

// 钩子函数
onMounted(() => {
  queryAll()
})

// 编辑部门 - 根据ID查询回显数据
const handleEdit = async (id) => {
  console.log(`Edit item with ID ${id}`);
  formTitle.value = '修改部门'
  showDialog.value = true
  deptForm.value = {name: ''}

  const result = await queryInfoApi(id)
  if(result.code){
    deptForm.value = result.data
  }
};

const formTitle = ref('')
//新增部门
const add = () => {
  formTitle.value = '新增部门'
  showDialog.value = true
  deptForm.value = {name: ''}
}

// 删除部门 - 根据ID删除部门
const handleDelete = (id) => {
  console.log(`Delete item with ID ${id}`);
  // 在这里实现删除功能
};

// 新增部门对话框的状态
const showDialog = ref(false)
// 表单数据
const deptForm = ref({name: ''})
// 表单验证规则
const formRules = ref({
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
  ]
})

// 表单引用
const deptFormRef = ref(null)

// 重置表单
const resetForm = () => {
  deptFormRef.value.resetFields()
}

// 提交表单
const save = async () => {
  await deptFormRef.value.validate(async valid => {
    if (!valid) return
    // 提交表单
    const result = await addDeptApi(deptForm.value)
    if(result.code){
      ElMessage.success('操作成功')
      // 关闭对话框
      showDialog.value = false
      // 重置表单
      resetForm()
      // 重新加载数据
      queryAll()
    }else {
      ElMessage.error(result.msg)
    }
  })
}
</script>

<template>
  <h1>部门管理</h1>

  <!-- 按钮靠页面右侧显示 -->
  <el-button type="primary" @click="add()" style="float: right;"> + 新增部门</el-button> <br><br>

  <!-- 数据展示表格 -->
  <el-table :data="deptList" border style="width: 100%;">
    <el-table-column type="index" label="序号" width="100" align="center"/>
    <el-table-column prop="name" label="部门名称" width="300" align="center"/>
    <el-table-column prop="updateTime" label="最后修改时间" width="300" align="center"/>
    <el-table-column fixed="right" label="操作" align="center">
      <template #default="scope">
        <el-button size="small" @click="handleEdit(scope.row.id)">修改</el-button>
        <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- 新增部门的对话框 -->
  <el-dialog v-model="showDialog" :title="formTitle" width="30%" @close="resetForm">
    <el-form :model="deptForm" :rules="formRules" ref="deptFormRef">
      <el-form-item label="部门名称" prop="name" label-width="80px">
        <el-input v-model="deptForm.name" autocomplete="off"></el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </span>
    </template>
  </el-dialog>

</template>

<style scoped>

</style>
```

打开浏览器测试一下，根据ID查询部门页面回显：

![](</blogs/_assets/lakebook/b718206dc97036a985184d48.png>)

#### 保存修改

由于 新增部门 和 修改部门使用的是同一个Dialog对话框，当前点击 “确定” 按钮的时候，有可能执行的是新增操作，也有可能是修改操作。

![](</blogs/_assets/lakebook/74f5fae0a6b01706f0c33282.png>)

那应该如何辨别到底是新增，还是修改操作呢 ？

其实，我们只需要根据 `deptForm` 对象的id属性值，来判断即可。 如果没有id，则是新增操作 ；如果有id，则是修改操作。

所以，保存修改功能实现如下：

1\)\. 在 `src/api/dept.js` 中增加如下修改部门的请求

```text
//修改部门
export const updateDeptApi = (data) => request.put('/depts', data)
```

2\)\. 在 `src/views/dept/index.vue` 中引入上述函数，并完善\(修改\) save 函数的逻辑

```text
import { queryAllApi, addDeptApi, queryInfoApi, updateDeptApi } from '@/api/dept'
```

```text
// 提交表单
const save = async () => {
  await deptFormRef.value.validate(async valid => {
    if (!valid) return
    // 提交表单
    let result = null;
    if(deptForm.value.id){
      result = await updateDeptApi(deptForm.value) // 修改
    }else {
      result = await addDeptApi(deptForm.value) // 新增
    } 
    if(result.code){
      ElMessage.success('操作成功')
      // 关闭对话框
      showDialog.value = false
      // 重置表单
      resetForm()
      // 重新加载数据
      queryAll()
    }else {
      ElMessage.error(result.msg)
    }
  })
}
```

最终完整代码如下：

```text
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { queryAllApi, addDeptApi, queryInfoApi, updateDeptApi } from '@/api/dept'

// 声明列表展示数据
let deptList = ref([])

// 动态加载数据 - 查询部门
const queryAll = async () => {
  const result = await queryAllApi()
  deptList .value = result.data
}

// 钩子函数
onMounted(() => {
  queryAll()
})

const formTitle = ref('')
//新增部门
const add = () => {
  formTitle.value = '新增部门'
  showDialog.value = true
  deptForm.value = {name: ''}
}

// 编辑部门 - 根据ID查询回显数据
const handleEdit = async (id) => {
  console.log(`Edit item with ID ${id}`);
  formTitle.value = '修改部门'
  showDialog.value = true
  deptForm.value = {name: ''}

  const result = await queryInfoApi(id)
  if(result.code){
    deptForm.value = result.data
  }
};

// 删除部门 - 根据ID删除部门
const handleDelete = (id) => {
  console.log(`Delete item with ID ${id}`);
  // 在这里实现删除功能
};

// 新增部门对话框的状态
const showDialog = ref(false)
// 表单数据
const deptForm = ref({name: ''})
// 表单验证规则
const formRules = ref({
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
  ]
})

// 表单引用
const deptFormRef = ref(null)

// 重置表单
const resetForm = () => {
  deptFormRef.value.resetFields()
}

// 提交表单
const save = async () => {
  await deptFormRef.value.validate(async valid => {
    if (!valid) return
    // 提交表单
    let result = null;
    if(deptForm.value.id){
      result = await updateDeptApi(deptForm.value) // 修改
    }else {
      result = await addDeptApi(deptForm.value) // 新增
    } 
    if(result.code){
      ElMessage.success('操作成功')
      // 关闭对话框
      showDialog.value = false
      // 重置表单
      resetForm()
      // 重新加载数据
      queryAll()
    }else {
      ElMessage.error(result.msg)
    }
  })
}
</script>

<template>
  <h1>部门管理</h1>

  <!-- 按钮靠页面右侧显示 -->
  <el-button type="primary" @click="add()" style="float: right;"> + 新增部门</el-button> <br><br>

  <!-- 数据展示表格 -->
  <el-table :data="deptList" border style="width: 100%;">
    <el-table-column type="index" label="序号" width="100" align="center"/>
    <el-table-column prop="name" label="部门名称" width="300" align="center"/>
    <el-table-column prop="updateTime" label="最后修改时间" width="300" align="center"/>
    <el-table-column fixed="right" label="操作" align="center">
      <template #default="scope">
        <el-button size="small" @click="handleEdit(scope.row.id)">修改</el-button>
        <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- 新增部门的对话框 -->
  <el-dialog v-model="showDialog" :title="formTitle" width="30%" @close="resetForm">
    <el-form :model="deptForm" :rules="formRules" ref="deptFormRef">
      <el-form-item label="部门名称" prop="name" label-width="80px">
        <el-input v-model="deptForm.name" autocomplete="off"></el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </span>
    </template>
  </el-dialog>

</template>

<style scoped>

</style>
```

打开浏览器，测试修改员工功能：

![](</blogs/_assets/lakebook/8e62277989c2a650f6107878.png>)

![](</blogs/_assets/lakebook/e63b12f1e250f066506155b4.png>)

### 删除部门

![](</blogs/_assets/lakebook/7c1f77340c6da915ee4a64bf.png>)

- 点击删除按钮，需要删除当前这条数据，删除完成之后，刷新页面，展示出最新的数据。
- 由于删除是一个比较危险的操作，为避免误操作，通常会在点击删除之后，弹出确认框进行确认。
- Element 组件：ElMessageBox消息弹出框组件

**具体操作步骤：**

1\)\. 在 `src/api/dept.js` 中增加如下删除部门的请求

```text
//删除部门
export const deleteDeptApi = (id) => request.delete(`/depts?id=${id}`)
```

2\)\. 在 `src/views/dept/index.vue` 中为 删除 按钮绑定事件

```text
<el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
```

3\)\. 在 `src/views/dept/index.vue` 编写根据ID删除数据的函数 。

```text
// 删除部门 - 根据ID删除部门
const handleDelete = (id) => {
  console.log(`Delete item with ID ${id}`);
  //删除部门时, 需要弹出一个确认框, 如果是确认, 则删除部门
  ElMessageBox.confirm('此操作将永久删除该部门, 是否继续?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 删除部门
    const result = await deleteDeptApi(id)
    if(result.code){
      ElMessage.success('删除成功')
      queryAll()
    }
  })
};
```

注意上述，用到了ElementPlus中的 ElMessageBox组件，需要 import 导入进来。代码如下：

```text
import { ElMessage, ElMessageBox } from 'element-plus'
```

到目前为止，完整的 `src/views/dept/index.vue` 代码如下：

```text
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { queryAllApi, addDeptApi, queryInfoApi, updateDeptApi, deleteDeptApi } from '@/api/dept'

// 声明列表展示数据
let deptList= ref([])

// 动态加载数据 - 查询部门
const queryAll = async () => {
  const result = await queryAllApi()
  deptList.value = result.data
}

// 钩子函数
onMounted(() => {
  queryAll()
})

const formTitle = ref('')
//新增部门
const add = () => {
  formTitle.value = '新增部门'
  showDialog.value = true
  deptForm.value = {name: ''}
}

// 编辑部门 - 根据ID查询回显数据
const handleEdit = async (id) => {
  console.log(`Edit item with ID ${id}`);
  formTitle.value = '修改部门'
  showDialog.value = true
  deptForm.value = {name: ''}

  const result = await queryInfoApi(id)
  if(result.code){
    deptForm.value = result.data
  }
};

// 删除部门 - 根据ID删除部门
const handleDelete = (id) => {
  console.log(`Delete item with ID ${id}`);
  //删除部门时, 需要弹出一个确认框, 如果是确认, 则删除部门
  ElMessageBox.confirm('此操作将永久删除该部门, 是否继续?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 删除部门
    const result = await deleteDeptApi(id)
    if(result.code){
      ElMessage.success('删除成功')
      queryAll()
    }
  })
};

// 新增部门对话框的状态
const showDialog = ref(false)
// 表单数据
const deptForm = ref({name: ''})
// 表单验证规则
const formRules = ref({
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
  ]
})

// 表单引用
const deptFormRef = ref(null)

// 重置表单
const resetForm = () => {
  deptFormRef.value.resetFields()
}

// 提交表单
const save = async () => {
  await deptFormRef.value.validate(async valid => {
    if (!valid) return
    // 提交表单
    let result = null;
    if(deptForm.value.id){
      result = await updateDeptApi(deptForm.value) // 修改
    }else {
      result = await addDeptApi(deptForm.value) // 新增
    } 
    if(result.code){
      ElMessage.success('操作成功')
      // 关闭对话框
      showDialog.value = false
      // 重置表单
      resetForm()
      // 重新加载数据
      queryAll()
    }else {
      ElMessage.error(result.msg)
    }
  })
}
</script>

<template>
  <h1>部门管理</h1>

  <!-- 按钮靠页面右侧显示 -->
  <el-button type="primary" @click="add()" style="float: right;"> + 新增部门</el-button> <br><br>

  <!-- 数据展示表格 -->
  <el-table :data="deptList" border style="width: 100%;">
    <el-table-column type="index" label="序号" width="100" align="center"/>
    <el-table-column prop="name" label="部门名称" width="300" align="center"/>
    <el-table-column prop="updateTime" label="最后修改时间" width="300" align="center"/>
    <el-table-column fixed="right" label="操作" align="center">
      <template #default="scope">
        <el-button size="small" @click="handleEdit(scope.row.id)">修改</el-button>
        <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- 新增部门的对话框 -->
  <el-dialog v-model="showDialog" :title="formTitle" width="30%" @close="resetForm">
    <el-form :model="deptForm" :rules="formRules" ref="deptFormRef">
      <el-form-item label="部门名称" prop="name" label-width="80px">
        <el-input v-model="deptForm.name" autocomplete="off"></el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </span>
    </template>
  </el-dialog>

</template>

<style scoped>

</style>
```

打开浏览器，测试删除员工功能：

![](</blogs/_assets/lakebook/cad4fcbaad30c38e147216ac.png>)

![](</blogs/_assets/lakebook/235a3aa1fba0562ee34d951b.png>)

在昨天的课程中，我们完成了部门管理的功能开发。 那今天呢，我们要来开发的是员工管理的功能。 我们来看一下员工管理的页面原型：

![](</blogs/_assets/lakebook/d3153693d57839e1639f55fe.png>)

包括如下几个部分：

- 条件分页查询
- 新增员工
- 修改员工
- 删除员工

除了员工管理的功能以外，还涉及到登录、退出等功能。

## 条件分页查询

### 介绍

在页面原型中，我们可以看到在查询员工信息列表时，既需要根据条件动态查询，还需要对查询的结果进行分页处理。

![](</blogs/_assets/lakebook/c836b5f0a5f302347eb715e3.png>)

那接下来，我们在制作这个页面时，将先完成基本的页面布局，再完成数据的动态加载。 而页面布局，又分为4个部分，分别为：

- 搜索栏
- 按钮
- 数据展示表格
- 分页条

### 页面布局

#### 搜索表单

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1777798801815-67825fe6-d3c4-4070-96ff-41e14b3c6365.png>)

1\)\. 在 `views/emp/index.vue` 中的 `<script setup></script>` 中增加如下js代码:

```text
import { ref} from 'vue'

const searchEmp = ref({
  name: '',
  gender: '',
  date: [],
  begin: '',
  end: ''
})

const search = () => {
  // 处理查询逻辑
  console.log('Search:', searchEmp.value)
}

const clear = () => {
  // 清空表单
  searchEmp.value = {
    name: '',
    gender: '',
    date: []
  }
  search()
}
```

2\)\. 在 `views/emp/index.vue` 中的 `<template></template>` 中增加如下js代码:

```text
<h1>员工管理</h1> <br>
  {{ searchEmp }}
  <el-form :inline="true" :model="searchEmp">
    <el-form-item label="姓名">
      <el-input v-model="searchEmp.name" placeholder="请输入员工姓名"></el-input>
    </el-form-item>

    <el-form-item label="性别">
      <el-select v-model="searchEmp.gender" placeholder="请选择">
        <el-option label="男" value="1"></el-option>
        <el-option label="女" value="2"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="入职日期">
      <el-date-picker
        v-model="searchEmp.date"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      ></el-date-picker>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="clear">清空</el-button>
    </el-form-item>
  </el-form>
```

注意：在element\-plus中，提供的日期选择组件，最终提交的值的格式，如果为 `2024-02-01` 这种格式，需要设置value\-format属性为 `YYYY-MM-DD`。

我们在测试的时候，为了能够看到搜索表单采集到的数据，可以直接在通过插值表达式 \{\{searchEmp\}\} 在表单上方，将搜索表单项的值直接输出出来。

打开浏览器，我们可以看到如下页面效果：

![](</blogs/_assets/lakebook/91b4d2c0599f9a554f9294f6.png>)

通过测试，我们可以看到，输入的入职日期的搜索条件，用的是element\-plus的日期范围组件，开始时间和结束时间，两个值，是封装到了一个数组中。

而通过接口接口文档，我们可以可以看到最终在查询员工列表数据时，搜索条件中，入职日期的开始时间 和 结束时间，是两个值，一个是`begin`开始时间，一个是`end`结束时间。

![](</blogs/_assets/lakebook/1a055409832e6aba2d2f75ae.png>)

那么此时，我们就需要将`searchEmp`对象中的`date`这个数组的值，解析出来，复制给`begin`和`end`。而且，一旦`date`的值发生变化，我们就需要重新计算`begin`和`end`这两个时间，把数组中的第一个元素，赋值给begin；第二个元素，赋值给end。

![](</blogs/_assets/lakebook/2bfe34cbe4da801a8c12fd03.png>)

而要实现这个效果，我们就需要用到Vue3中提供的 watch 侦听。

#### watch侦听

- 作用：侦听一个或多个响应式数据源，并在数据源变化时调用所给的回调函数。
- 用法：

- 导入watch函数
- 执行watch函数，传入要侦听的响应式数据源（ref对象）和回调函数；

![](</blogs/_assets/lakebook/3016236cb5d83e4a122a84ea.png>)

- 侦听对象的单个属性

![](</blogs/_assets/lakebook/dccdd0ecc7f811f3db91ca5f.png>)

- 侦听对象的全部属性

![](</blogs/_assets/lakebook/d1da6f9248bf769159d96cd5.png>)

第三个可选参数，常见两个选项：

- deep（boolean）：是否深度侦听，默认浅层侦听。
- immediate（boolean）：是否在侦听创建时立即触发回调函数。

介绍完了watch侦听的基本语法之后，我们再来完成搜索栏中员工入职日期的开始时间和结束时间的处理。 我们要做到，在输入的时间发生变化时，自动为searchEmp中的begin，end两个属性赋值。

具体代码如下，在 `views/emp/index.vue` 文件中的 `<script></script>` 中增加watch监听：

```text
import { ref, watch } from 'vue'

const searchEmp = ref({
  name: '',
  gender: '',
  date: [],
  begin: '',
  end: ''
})

//侦听searchEmp中的date属性
watch(
  () => searchEmp.value.date,
  (newValue, oldValue) => {
     if(newValue.length == 2){
      searchEmp.value.begin = newValue[0]
      searchEmp.value.end = newValue[1]
     }else {
      searchEmp.value.begin = ''
      searchEmp.value.end = ''
     }
  }
)

const search= () => {
  // 处理查询逻辑
  console.log('Search:', searchEmp.value)
}

const clear = () => {
  // 清空表单
  searchEmp.value = {
    name: '',
    gender: '',
    date: [],
    begin: '',
    end: ''
  }
  search()
}
```

#### 表格展示

接下来，我们再来制作这个表格。通过页面原型，我们可以看到表格的展示内容及展示形式：

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1777798803249-bdec76da-039a-4055-b8f2-a4239912f7b5.png>)

调整后如下所示（绿色背景部分为新添加部分）：

```text
<script setup>
import { ref, watch } from 'vue'

const searchEmp = ref({
  name: '',
  gender: '',
  date: [],
  begin: '',
  end: ''
})

//侦听searchEmp中的date属性
watch(
  () => searchEmp.value.date,
  (newValue, oldValue) => {
     if(newValue.length == 2){
      searchEmp.value.begin = newValue[0]
      searchEmp.value.end = newValue[1]
     }else {
      searchEmp.value.begin = ''
      searchEmp.value.end = ''
     }
  }
)

const search= () => {
  // 处理查询逻辑
  console.log('Search:', searchEmp.value)
}

const clear = () => {
  // 清空表单
  searchEmp.value = {
    name: '',
    gender: '',
    date: [],
    begin: '',
    end: ''
  }
  search()
}

// 示例数据
const empList = ref([
   {
        "id": 1,
        "username": "jinyong",
        "password": "123456",
        "name": "金庸",
        "gender": 1,
        "image": "https://web-framework.oss-cn-hangzhou.aliyuncs.com/2022-09-02-00-27-53B.jpg",
        "job": 2,
        "salary": 8000,
        "entryDate": "2015-01-01",
        "deptId": 2,
        "deptName": "教研部",
        "createTime": "2022-09-01T23:06:30",
        "updateTime": "2022-09-02T00:29:04"
  }
])

// 分页配置
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 分页处理
const handleSizeChange = (val) => {
  search()
}
const handleCurrentChange = (val) => {
  search()
}


</script>

<template>
  <h1>员工管理</h1> <br>
  {{ searchEmp }}
  <el-form :inline="true" :model="searchEmp">
    <el-form-item label="姓名">
      <el-input v-model="searchEmp.name" placeholder="请输入员工姓名"></el-input>
    </el-form-item>

    <el-form-item label="性别">
      <el-select v-model="searchEmp.gender" placeholder="请选择">
        <el-option label="男" value="1"></el-option>
        <el-option label="女" value="2"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="入职日期">
      <el-date-picker
        v-model="searchEmp.date"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      ></el-date-picker>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="clear">清空</el-button>
    </el-form-item>
  </el-form>

  <el-button type="primary" @click=""> + 新增员工</el-button>
  <el-button type="danger" @click=""> - 批量删除</el-button>
  <br><br>

<!-- 表格 -->
  <el-table :data="empList" border style="width: 100%">
    <el-table-column type="selection" width="55" align="center"></el-table-column>
    <el-table-column prop="name" label="姓名" width="120" align="center"></el-table-column>
    <el-table-column label="性别" width="170" align="center">
      <template #default="scope" >
        {{ scope.row.gender == 1 ? '男' : '女' }}
      </template>
    </el-table-column>
    <el-table-column label="头像" width="170" align="center">
      <template #default="scope" >
        <img :src="scope.row.image" alt="Avatar" class="avatar" />
      </template>
    </el-table-column>
    <el-table-column prop="deptName" label="部门名称" width="170" align="center"></el-table-column>
    <el-table-column label="职位" width="120" align="center">
      <template #default="scope">
          <span v-if="scope.row.job == 1">班主任</span>
          <span v-else-if="scope.row.job == 2">讲师</span>
          <span v-else-if="scope.row.job == 3">学工主管</span>
          <span v-else-if="scope.row.job == 4">教研主管</span>
          <span v-else-if="scope.row.job == 5">咨询师</span>
          <span v-else>其他</span>
        </template>
    </el-table-column>
    <el-table-column prop="entryDate" label="入职日期" width="180" align="center"></el-table-column>
    <el-table-column prop="updateTime" label="最后操作时间" width="210" align="center"></el-table-column>
    <el-table-column label="操作" fixed="right" align="center">
      <template #default="scope">
        <el-button size="small" type="primary" @click="">编辑</el-button>
        <el-button size="small" type="danger" @click="">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <br>

  <!-- 分页 -->
  <el-pagination
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :page-sizes="[10, 20, 30, 40]"
    layout="total, sizes, prev, pager, next, jumper"
    :total="total"
  >
  </el-pagination>
</template>

<style scoped>
.avatar {
  height: 40px;
}
</style>
```

代码编写完毕后，我们打开浏览器会看到如下效果：

![](</blogs/_assets/lakebook/64fb17d7650919699135c3ed.png>)

我们可以看到，图片、职位字段都正常展示出来了。

### 页面交互

基本的页面布局完成之后，接下来，我们再来完成页面的交互效果，具体效果有如下三项：

- 页面加载完毕后，查询员工信息列表。
- 点击查询按钮，查询员工信息列表。
- 当页码、每页展示记录数发生变化时，查询员工信息列表。

那么要想实现上述的效果，我们就需要在Vue的钩子函数 onMounted 中，调用查询方法 search，然后在 search方法中发起异步请求，请求服务端。

当页码、每页展示的记录数发生变化时，会触发 handleSizeChange、handleCurrentChange 方法，然后在这两个方法中再调用 search方法，发起异步请求，请求服务端即可。

具体代码实现如下：

**1\)\. 在** `src/api` **目录下再定义一个** `emp.js`

我们可以一次性将增删改查相关的api操作的函数都定义好。

```text
import request from "@/utils/request";

//查询员工列表数据
export const queryPageApi = (name,gender,begin,end,page,pageSize) => 
  request.get(`/emps?name=${name}&gender=${gender}&begin=${begin}&end=${end}&page=${page}&pageSize=${pageSize}`)

//新增
export const addApi = (emp) =>  request.post('/emps', emp);

//根据ID查询
export const queryInfoApi = (id) =>  request.get(`/emps/${id}`);

//修改
export const updateApi = (emp) =>  request.put('/emps', emp);

//删除
export const deleteApi = (ids) =>  request.delete(`/emps?ids=${ids}`);
```

**2\)\. 在** `src/views/emp/index.vue` **文件中完成页面交互实现**

```text
<script setup>
import { ref, watch, onMounted } from 'vue'
import { queryPageApi } from '@/api/emp'

const searchEmp = ref({
  name: '',
  gender: '',
  date: [],
  begin: '',
  end: ''
})

//侦听searchEmp中的date属性
watch(
  () => searchEmp.value.date,
  (newValue, oldValue) => {
     if(newValue.length == 2){
      searchEmp.value.begin = newValue[0]
      searchEmp.value.end = newValue[1]
     }else {
      searchEmp.value.begin = ''
      searchEmp.value.end = ''
     }
  }
)

onMounted(() => {
  search()
})

//查询员工
const search= async () => {
  console.log('Search:', searchEmp.value)
  const result = await queryPageApi(searchEmp.value.name, searchEmp.value.gender, searchEmp.value.begin, searchEmp.value.end, currentPage.value, pageSize.value);
  if(result.code){
    empList.value = result.data.rows
    total.value = result.data.total
  }
}

const clear = () => {
  // 清空表单
  searchEmp.value = {
    name: '',
    gender: '',
    date: [],
    begin: '',
    end: ''
  }
  search()
}

// 示例数据
const empList = ref([])

// 分页配置
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 分页处理
const handleSizeChange = (val) => {
  search()
}
const handleCurrentChange = (val) => {
  search()
}

</script>

<template>
  <h1>员工管理</h1> <br>
  {{ searchEmp }}
  <el-form :inline="true" :model="searchEmp">
    <el-form-item label="姓名">
      <el-input v-model="searchEmp.name" placeholder="请输入员工姓名"></el-input>
    </el-form-item>

    <el-form-item label="性别">
      <el-select v-model="searchEmp.gender" placeholder="请选择">
        <el-option label="男" value="1"></el-option>
        <el-option label="女" value="2"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="入职日期">
      <el-date-picker
        v-model="searchEmp.date"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      ></el-date-picker>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="clear">清空</el-button>
    </el-form-item>
  </el-form>

  <el-button type="primary" @click=""> + 新增员工</el-button>
  <el-button type="danger" @click=""> - 批量删除</el-button>
  <br><br>

  <!-- 表格 -->
  <el-table :data="empList" border style="width: 100%">
    <el-table-column type="selection" width="55" align="center"></el-table-column>
    <el-table-column prop="name" label="姓名" width="120" align="center"></el-table-column>
    <el-table-column label="性别" width="80" align="center">
      <template #default="scope" >
        {{ scope.row.gender == 1 ? '男' : '女' }}
      </template>
    </el-table-column>
    <el-table-column label="头像" width="170" align="center">
      <template #default="scope" >
        <img :src="scope.row.image" class="avatar" />
      </template>
    </el-table-column>
    <el-table-column prop="deptName" label="部门名称" width="170" align="center"></el-table-column>
    <el-table-column label="职位" width="120" align="center">
      <template #default="scope">
          <span v-if="scope.row.job == 1">班主任</span>
          <span v-else-if="scope.row.job == 2">讲师</span>
          <span v-else-if="scope.row.job == 3">学工主管</span>
          <span v-else-if="scope.row.job == 4">教研主管</span>
          <span v-else-if="scope.row.job == 5">咨询师</span>
          <span v-else>其他</span>
      </template>
    </el-table-column>
    <el-table-column prop="entryDate" label="入职日期" width="180" align="center"></el-table-column>
    <el-table-column prop="updateTime" label="最后操作时间" width="210" align="center"></el-table-column>
    <el-table-column label="操作" fixed="right" align="center">
      <template #default="scope">
        <el-button size="small" type="primary" @click="">编辑</el-button>
        <el-button size="small" type="danger" @click="">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <br>

  <!-- 分页 -->
  <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 30, 50, 75, 100]"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </el-pagination>
</template>

<style scoped>
.avatar {
  height: 40px;
}
</style>
```

代码编写完成之后，我们可以打开浏览器测试一下：

![](</blogs/_assets/lakebook/06b8e28dfb2e435a0171b370.png>)

## 新增员工

### 页面布局

#### 需求

![](</blogs/_assets/lakebook/e2596f7b5ff2222d9be89886.png>)

从页面原型中，我们可以看到，新增员工信息的表单包含两个部分，分别为：

- 员工的基本信息
- 员工的工作经历信息

#### 基本布局实现

接下来，我们也可以基于AI来帮我们完成页面的整体布局。

在 `src/views/emp/index.vue` 中增加如下代码（绿色背景部分）：

```text
<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { queryPageApi } from '@/api/emp'

const searchEmp = ref({
  name: '',
  gender: '',
  date: [],
  begin: '',
  end: ''
})

//侦听searchEmp中的date属性
watch(
  () => searchEmp.value.date,
  (newValue, oldValue) => {
     if(newValue.length == 2){
      searchEmp.value.begin = newValue[0]
      searchEmp.value.end = newValue[1]
     }else {
      searchEmp.value.begin = ''
      searchEmp.value.end = ''
     }
  }
)

onMounted(() => {
  search()
})

//查询员工
const search= async () => {
  console.log('Search:', searchEmp.value)
  const result = await queryPageApi(searchEmp.value.name, searchEmp.value.gender, searchEmp.value.begin, searchEmp.value.end, currentPage.value, pageSize.value);
  if(result.code){
    empList.value = result.data.rows
    total.value = result.data.total
  }
}

const clear = () => {
  // 清空表单
  searchEmp.value = {
    name: '',
    gender: '',
    date: [],
    begin: '',
    end: ''
  }
  search()
}

// 示例数据
const empList = ref([])

// 分页配置
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)


// 分页处理
const handleSizeChange = (val) => {
  search();
}
const handleCurrentChange = (val) => {
  search();
}


//新增员工
const addEmp = () => {
  dialogVisible.value = true
  dialogTitle.value = '新增员工'
}


//新增/修改表单
const employeeFormRef = ref(null)
const employee = ref({
  username: '',
  name: '',
  gender: '',
  phone: '',
  job: '',
  salary: '',
  deptId: '',
  entryDate: '',
  image: '',
  exprList: []
})

// 控制弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')

//文件上传
// 图片上传成功后触发
const handleAvatarSuccess = (response,uploadFile) => {
  employee.value.image = response.data
}
// 文件上传之前触发
const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('只支持上传图片')
    return false
  } else if (rawFile.size / 1024 / 1024 > 10) {
    ElMessage.error('只能上传10M以内图片')
    return false
  }
  return true
}

</script>

<template>
  <h1>员工管理</h1> <br>
  <el-form :inline="true" :model="searchEmp">
    <el-form-item label="姓名">
      <el-input v-model="searchEmp.name" placeholder="请输入员工姓名"></el-input>
    </el-form-item>

    <el-form-item label="性别">
      <el-select v-model="searchEmp.gender" placeholder="请选择">
        <el-option label="男" value="1"></el-option>
        <el-option label="女" value="2"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="入职日期">
      <el-date-picker
        v-model="searchEmp.date"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      ></el-date-picker>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="clear">清空</el-button>
    </el-form-item>
  </el-form>

  <el-button type="primary" @click="addEmp"> + 新增员工</el-button>
  <el-button type="danger" @click=""> - 批量删除</el-button>
  <br><br>

  <!-- 表格 -->
  <el-table :data="empList" border style="width: 100%">
    <el-table-column type="selection" width="55" align="center"></el-table-column>
    <el-table-column prop="name" label="姓名" width="120" align="center"></el-table-column>
    <el-table-column label="性别" width="80" align="center">
      <template #default="scope" >
        {{ scope.row.gender == 1 ? '男' : '女' }}
      </template>
    </el-table-column>
    <el-table-column label="头像" width="170" align="center">
      <template #default="scope" >
        <img :src="scope.row.image" alt="Avatar" class="avatar" />
      </template>
    </el-table-column>
    <el-table-column prop="deptName" label="部门名称" width="170" align="center"></el-table-column>
    <el-table-column label="职位" width="120" align="center">
      <template #default="scope">
          <span v-if="scope.row.job == 1">班主任</span>
          <span v-else-if="scope.row.job == 2">讲师</span>
          <span v-else-if="scope.row.job == 3">学工主管</span>
          <span v-else-if="scope.row.job == 4">教研主管</span>
          <span v-else-if="scope.row.job == 5">咨询师</span>
          <span v-else>其他</span>
      </template>
    </el-table-column>
    <el-table-column prop="entryDate" label="入职日期" width="180" align="center"></el-table-column>
    <el-table-column prop="updateTime" label="最后操作时间" width="210" align="center"></el-table-column>
    <el-table-column label="操作" fixed="right" align="center">
      <template #default="scope">
        <el-button size="small" type="primary" @click="">编辑</el-button>
        <el-button size="small" type="danger" @click="">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <br>

  <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 30, 50, 75, 100]"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

  <!-- 新增/修改员工的对话框 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form ref="employeeFormRef" :model="employee" label-width="80px">
        <!-- 基本信息 -->
        <!-- 第一行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model="employee.username" placeholder="请输入员工用户名，2-20个字"></el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="employee.name" placeholder="请输入员工姓名，2-10个字"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第二行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="employee.gender" placeholder="请选择性别" style="width: 100%;">
                <el-option label="男" value="1"></el-option>
                <el-option label="女" value="2"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="employee.phone" placeholder="请输入员工手机号"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第三行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职位">
              <el-select v-model="employee.job" placeholder="请选择职位" style="width: 100%;">
                <el-option label="班主任" value="1"></el-option>
                <el-option label="讲师" value="2"></el-option>
                <el-option label="学工主管" value="3"></el-option>
                <el-option label="教研主管" value="4"></el-option>
                <el-option label="咨询师" value="5"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="薪资">
              <el-input v-model="employee.salary" placeholder="请输入员工薪资"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第四行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属部门">
              <el-select v-model="employee.deptId" placeholder="请选择部门" style="width: 100%;">
                <el-option label="研发部" value="1"></el-option>
                <el-option label="市场部" value="2"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期">
              <el-date-picker v-model="employee.entryDate" type="date" style="width: 100%;" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第五行 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                >
                <img v-if="employee.image" :src="employee.image" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
        

        <!-- 工作经历 -->
        <!-- 第六行 -->
        <el-row :gutter="10">
          <el-col :span="24">
            <el-form-item label="工作经历">
              <el-button type="success" size="small" @click="">+ 添加工作经历</el-button>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第七行 ...  工作经历 -->
        <el-row :gutter="3">
          <el-col :span="10">
            <el-form-item size="small" label="时间" label-width="80px">
              <el-date-picker type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" ></el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item size="small" label="公司" label-width="60px">
              <el-input placeholder="请输入公司名称"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item size="small" label="职位" label-width="60px">
              <el-input placeholder="请输入职位"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="2">
            <el-form-item size="small" label-width="0px">
              <el-button type="danger" >- 删除</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
        <!-- 底部按钮 -->
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="">保存</el-button>
          </span>
        </template>

    </el-dialog>
    
</template>

<style scoped>
.avatar {
  height: 40px;
}
.avatar-uploader .avatar {
  width: 78px;
  height: 78px;
  display: block;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 78px;
  height: 78px;
  text-align: center;
  /* 添加灰色的虚线边框 */
  border: 1px dashed var(--el-border-color);
}
</style>
```

代码编写完毕后，打开浏览器看到最终效果如下：

![](</blogs/_assets/lakebook/a353676394cb1665157c2d99.png>)

这样最基本的布局就有了，接下来，我们需要对其进行进一步的优化。

#### 页面布局优化

表单中的数据动态展示 。比如：所属部门、职位、性别，这些源数据我们可以定义在js代码中，在页面中基于v\-for指令，遍历展示出来，便于项目的统一维护处理。

优化后的页面内容如下：

```text
<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { queryPageApi } from '@/api/emp'
import { queryAllApi as queryAllDeptApi } from '@/api/dept'

//职位列表数据
const jobs = ref([{ name: '班主任', value: 1 },{ name: '讲师', value: 2 },{ name: '学工主管', value: 3 },{ name: '教研主管', value: 4 },{ name: '咨询师', value: 5 },{ name: '其他', value: 6 }])
//性别列表数据
const genders = ref([{ name: '男', value: 1 }, { name: '女', value: 2 }])
//部门列表数据
const deptList = ref([])

const searchEmp = ref({
  name: '',
  gender: '',
  date: [],
  begin: '',
  end: ''
})

//侦听searchEmp中的date属性
watch(
  () => searchEmp.value.date,
  (newValue, oldValue) => {
     if(newValue.length == 2){
      searchEmp.value.begin = newValue[0]
      searchEmp.value.end = newValue[1]
     }else {
      searchEmp.value.begin = ''
      searchEmp.value.end = ''
     }
  }
)

onMounted(async () => {
  search()

  //加载所有部门数据
  const result = await queryAllDeptApi();
  if(result.code){
    deptList.value = result.data
  }
})

//查询员工
const search= async () => {
  console.log('Search:', searchEmp.value)
  const result = await queryPageApi(searchEmp.value.name, searchEmp.value.gender, searchEmp.value.begin, searchEmp.value.end, currentPage.value, pageSize.value);
  if(result.code){
    empList.value = result.data.rows
    total.value = result.data.total
  }
}

const clear = () => {
  // 清空表单
  searchEmp.value = {
    name: '',
    gender: '',
    date: [],
    begin: '',
    end: ''
  }
  search()
}

// 示例数据
const empList = ref([])

// 分页配置
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)


// 分页处理
const handleSizeChange = (val) => {
  search()
}
const handleCurrentChange = (val) => {
  search()
}


//新增员工
const addEmp = () => {
  dialogVisible.value = true
  dialogTitle.value = '新增员工'
}

//新增/修改表单
const employeeFormRef = ref(null)
const employee = ref({
  username: '',
  name: '',
  gender: '',
  phone: '',
  job: '',
  salary: '',
  deptId: '',
  entryDate: '',
  image: '',
  exprList: []
})

// 控制弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')

//文件上传
// 图片上传成功后触发
const handleAvatarSuccess = (response,uploadFile) => {
  employee.value.image = response.data
}
// 文件上传之前触发
const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('只支持上传图片')
    return false
  } else if (rawFile.size / 1024 / 1024 > 10) {
    ElMessage.error('只能上传10M以内图片')
    return false
  }
  return true
}

</script>

<template>
  <h1>员工管理</h1> <br>
  <el-form :inline="true" :model="searchEmp">
    <el-form-item label="姓名">
      <el-input v-model="searchEmp.name" placeholder="请输入员工姓名"></el-input>
    </el-form-item>

    <el-form-item label="性别">
      <el-select v-model="searchEmp.gender" placeholder="请选择">
        <el-option label="男" value="1"></el-option>
        <el-option label="女" value="2"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="入职日期">
      <el-date-picker
        v-model="searchEmp.date"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      ></el-date-picker>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="clear">清空</el-button>
    </el-form-item>
  </el-form>

  <el-button type="primary" @click="addEmp"> + 新增员工</el-button>
  <el-button type="danger" @click=""> - 批量删除</el-button>
  <br><br>

  <!-- 表格 -->
  <el-table :data="empList" border style="width: 100%">
    <el-table-column type="selection" width="55" align="center"></el-table-column>
    <el-table-column prop="name" label="姓名" width="120" align="center"></el-table-column>
    <el-table-column label="性别" width="80" align="center">
      <template #default="scope" >
        {{ scope.row.gender == 1 ? '男' : '女' }}
      </template>
    </el-table-column>
    <el-table-column label="头像" width="170" align="center">
      <template #default="scope" >
        <img :src="scope.row.image" alt="Avatar" class="avatar" />
      </template>
    </el-table-column>
    <el-table-column prop="deptName" label="部门名称" width="170" align="center"></el-table-column>
    <el-table-column label="职位" width="120" align="center">
     <template #default="scope">
          <span v-if="scope.row.job == 1">班主任</span>
          <span v-else-if="scope.row.job == 2">讲师</span>
          <span v-else-if="scope.row.job == 3">学工主管</span>
          <span v-else-if="scope.row.job == 4">教研主管</span>
          <span v-else-if="scope.row.job == 5">咨询师</span>
          <span v-else>其他</span>
        </template>
    </el-table-column>
    <el-table-column prop="entryDate" label="入职日期" width="180" align="center"></el-table-column>
    <el-table-column prop="updateTime" label="最后操作时间" width="210" align="center"></el-table-column>
    <el-table-column label="操作" fixed="right" align="center">
      <template #default="scope">
        <el-button size="small" type="primary" @click="">编辑</el-button>
        <el-button size="small" type="danger" @click="">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <br>

  <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 30, 50, 75, 100]"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

  <!-- 新增/修改员工的对话框 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form ref="employeeFormRef" :model="employee" label-width="80px">
        <!-- 基本信息 -->
        <!-- 第一行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model="employee.username" placeholder="请输入员工用户名，2-20个字"></el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="employee.name" placeholder="请输入员工姓名，2-10个字"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第二行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="employee.gender" placeholder="请选择性别" style="width: 100%;">
                <el-option v-for="gender in genders" :key="gender.name" :label="gender.name" :value="gender.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="employee.phone" placeholder="请输入员工手机号"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第三行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职位">
              <el-select v-model="employee.job" placeholder="请选择职位" style="width: 100%;">
                <el-option v-for="job in jobs" :key="job.name" :label="job.name" :value="job.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="薪资">
              <el-input v-model="employee.salary" placeholder="请输入员工薪资"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第四行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属部门">
              <el-select v-model="employee.deptId" placeholder="请选择部门" style="width: 100%;">
                <el-option v-for="dept in deptList" :key="dept.id" :label="dept.name" :value="dept.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期">
              <el-date-picker v-model="employee.entryDate" type="date" style="width: 100%;" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第五行 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                >
                <img v-if="employee.image" :src="employee.image" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
        

        <!-- 工作经历 -->
        <!-- 第六行 -->
        <el-row :gutter="10">
          <el-col :span="24">
            <el-form-item label="工作经历">
              <el-button type="success" size="small" @click="">+ 添加工作经历</el-button>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第七行 ...  工作经历 -->
        <el-row :gutter="3">
          <el-col :span="10">
            <el-form-item size="small" label="时间" label-width="80px">
              <el-date-picker type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" ></el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item size="small" label="公司" label-width="60px">
              <el-input placeholder="请输入公司名称"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item size="small" label="职位" label-width="60px">
              <el-input placeholder="请输入职位"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="2">
            <el-form-item size="small" label-width="0px">
              <el-button type="danger" >- 删除</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
        <!-- 底部按钮 -->
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="">保存</el-button>
          </span>
        </template>

    </el-dialog>

</template>

<style scoped>
.avatar {
  height: 40px;
}
.avatar-uploader .avatar {
  width: 78px;
  height: 78px;
  display: block;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 78px;
  height: 78px;
  text-align: center;
  /* 添加灰色的虚线边框 */
  border: 1px dashed var(--el-border-color);
}
</style>
```

到此呢，页面的基本布局我们就已经完成了。 那接下来呢，我们就可以打开浏览器，看看最终的效果：

![](</blogs/_assets/lakebook/6fbde67a0d4fa45d99ab15fd.png>)

#### 添加/删除工作经历

##### 需求

新增员工的基本信息表单已经制作完成了，那接下来，要制作的是员工的工作经历。

点击 **"添加工作经历"** 按钮后，新添加一条工作经历；点击每一条后面的 **"删除"** 按钮，需要删除当前工作经历。

![](</blogs/_assets/lakebook/081b6f11a51b03ddd2116ff9.png>)

员工的过往工作经历可能是多条，点击 "添加员工工作经历" 按钮，如何增加一个条目 ？ 点击每一条后面的删除按钮，需要删除当前条件？

- Vue是基于数据驱动视图展示的。
- "添加" 时，我们可以往数组中添加数据。
- "删除" 时，可以删除数组中的元素。
- 一旦数据发生变化，视图中的展示就会发生变化。

##### 实现

1\)\. 在 `src/views/emp/index.vue` 中的 `<script> </script>` 中增加如下代码：

```text
//工作经历
//动态添加工作经历 .
const addExprItem = () => {
  employee.value.exprList.push({exprDate: [], begin: '', end: '', company: '', job: ''})
}

//动态删除工作经历 .
const delExprItem = (index) => {
  employee.value.exprList.splice(index, 1)
}

//监听-employee员工对象中的工作经历数据
watch(()=>employee.value.exprList, (newValue, oldValue) => {
  if(employee.value.exprList && employee.value.exprList.length > 0) {
    employee.value.exprList.forEach(expr => {
      expr.begin = expr.exprDate[0]
      expr.end = expr.exprDate[1]
    })
  }
}, {deep: true});
```

2\)\. 在 `src/views/emp/index.vue` 中的 `<template> </template>` 中的按钮绑定事件，并遍历展示工作经历信息：

```text
<!-- 新增/修改员工的对话框 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form ref="employeeFormRef" :model="employee" label-width="80px">
        <!-- 基本信息 -->
        <!-- 第一行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model="employee.username" placeholder="请输入员工用户名，2-20个字"></el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="employee.name" placeholder="请输入员工姓名，2-10个字"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第二行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="employee.gender" placeholder="请选择性别" style="width: 100%;">
                <el-option v-for="gender in genders" :key="gender.name" :label="gender.name" :value="gender.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="employee.phone" placeholder="请输入员工手机号"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第三行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职位">
              <el-select v-model="employee.job" placeholder="请选择职位" style="width: 100%;">
                <el-option v-for="job in jobs" :key="job.name" :label="job.name" :value="job.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="薪资">
              <el-input v-model="employee.salary" placeholder="请输入员工薪资"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第四行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属部门">
              <el-select v-model="employee.deptId" placeholder="请选择部门" style="width: 100%;">
                <el-option v-for="dept in deptList" :key="dept.id" :label="dept.name" :value="dept.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期">
              <el-date-picker v-model="employee.entryDate" type="date" style="width: 100%;" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第五行 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                >
                <img v-if="employee.image" :src="employee.image" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
        

        <!-- 工作经历 -->
        <!-- 第六行 -->
        <el-row :gutter="10">
          <el-col :span="24">
            <el-form-item label="工作经历">
              <el-button type="success" size="small" @click="addExprItem">+ 添加工作经历</el-button>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第七行 ...  工作经历 -->
        <el-row :gutter="3" v-for="(expr, index) in employee.exprList">
          <el-col :span="10">
            <el-form-item size="small" label="时间" label-width="80px">
              <el-date-picker type="daterange" v-model="expr.exprDate" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" ></el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item size="small" label="公司" label-width="60px">
              <el-input placeholder="请输入公司名称" v-model="expr.company"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item size="small" label="职位" label-width="60px">
              <el-input placeholder="请输入职位" v-model="expr.job"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="2">
            <el-form-item size="small" label-width="0px">
              <el-button type="danger" @click="delExprItem(index)">- 删除</el-button>
            </el-form-item>
          </el-col>
        </el-row>
       </el-form>
       
        <!-- 底部按钮 -->
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="">保存</el-button>
          </span>
        </template>

    </el-dialog>
```

到目前为止，`src/views/emp/index.vue` 页面的内容如下所示：

```text
<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { queryPageApi } from '@/api/emp'
import { queryAllApi as queryAllDeptApi } from '@/api/dept'

//职位列表数据
const jobs = ref([{ name: '班主任', value: 1 },{ name: '讲师', value: 2 },{ name: '学工主管', value: 3 },{ name: '教研主管', value: 4 },{ name: '咨询师', value: 5 },{ name: '其他', value: 6 }])
//性别列表数据
const genders = ref([{ name: '男', value: 1 }, { name: '女', value: 2 }])
//部门列表数据
const deptList = ref([])

const searchEmp = ref({
  name: '',
  gender: '',
  date: [],
  begin: '',
  end: ''
})

//侦听searchEmp中的date属性
watch(
  () => searchEmp.value.date,
  (newValue, oldValue) => {
     if(newValue.length == 2){
      searchEmp.value.begin = newValue[0]
      searchEmp.value.end = newValue[1]
     }else {
      searchEmp.value.begin = ''
      searchEmp.value.end = ''
     }
  }
)

onMounted(async () => {
  search()

  //加载所有部门数据
  const result = await queryAllDeptApi();
  if(result.code){
    deptList.value = result.data
  }
})

//查询员工
const search= async () => {
  console.log('Search:', searchEmp.value)
  const result = await queryPageApi(searchEmp.value.name, searchEmp.value.gender, searchEmp.value.begin, searchEmp.value.end, currentPage.value, pageSize.value);
  if(result.code){
    empList.value = result.data.rows
    total.value = result.data.total
  }
}

const clear = () => {
  // 清空表单
  searchEmp.value = {
    name: '',
    gender: '',
    date: [],
    begin: '',
    end: ''
  }
  search()
}

// 示例数据
const empList = ref([])

// 分页配置
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)


// 分页处理
const handleSizeChange = (val) => {
  search()
}
const handleCurrentChange = (val) => {
  search()
}


//新增员工
const addEmp = () => {
  dialogVisible.value = true
  dialogTitle.value = '新增员工'
}

//新增/修改表单
const employeeFormRef = ref(null)
const employee = ref({
  username: '',
  name: '',
  gender: '',
  phone: '',
  job: '',
  salary: '',
  deptId: '',
  entryDate: '',
  image: '',
  exprList: []
})

// 控制弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')

//文件上传
// 图片上传成功后触发
const handleAvatarSuccess = (response,uploadFile) => {
  employee.value.image = response.data
}
// 文件上传之前触发
const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('只支持上传图片')
    return false
  } else if (rawFile.size / 1024 / 1024 > 10) {
    ElMessage.error('只能上传10M以内图片')
    return false
  }
  return true
}

//工作经历
//动态添加工作经历 .
const addExprItem = () => {
  employee.value.exprList.push({exprDate: [], begin: '', end: '', company: '', job: ''})
}

//动态删除工作经历 .
const delExprItem = (index) => {
  employee.value.exprList.splice(index, 1)
}

//监听-employee员工对象中的工作经历数据
watch(()=>employee.value.exprList, (newValue, oldValue) => {
  if(employee.value.exprList && employee.value.exprList.length > 0) {
    employee.value.exprList.forEach(expr => {
      expr.begin = expr.exprDate[0]
      expr.end = expr.exprDate[1]
    })
  }
}, {deep: true});
</script>

<template>
  <h1>员工管理</h1> <br>
  <el-form :inline="true" :model="searchEmp">
    <el-form-item label="姓名">
      <el-input v-model="searchEmp.name" placeholder="请输入员工姓名"></el-input>
    </el-form-item>

    <el-form-item label="性别">
      <el-select v-model="searchEmp.gender" placeholder="请选择">
        <el-option label="男" value="1"></el-option>
        <el-option label="女" value="2"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="入职日期">
      <el-date-picker
        v-model="searchEmp.date"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      ></el-date-picker>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="clear">清空</el-button>
    </el-form-item>
  </el-form>

  <el-button type="primary" @click="addEmp"> + 新增员工</el-button>
  <el-button type="danger" @click=""> - 批量删除</el-button>
  <br><br>

  <!-- 表格 -->
  <el-table :data="empList" border style="width: 100%">
    <el-table-column type="selection" width="55" align="center"></el-table-column>
    <el-table-column prop="name" label="姓名" width="120" align="center"></el-table-column>
    <el-table-column label="性别" width="80" align="center">
      <template #default="scope" >
        {{ scope.row.gender == 1 ? '男' : '女' }}
      </template>
    </el-table-column>
    <el-table-column label="头像" width="170" align="center">
      <template #default="scope" >
        <img :src="scope.row.image" alt="Avatar" class="avatar" />
      </template>
    </el-table-column>
    <el-table-column prop="deptName" label="部门名称" width="170" align="center"></el-table-column>
    <el-table-column label="职位" width="120" align="center">
      <template #default="scope">
          <span v-if="scope.row.job == 1">班主任</span>
          <span v-else-if="scope.row.job == 2">讲师</span>
          <span v-else-if="scope.row.job == 3">学工主管</span>
          <span v-else-if="scope.row.job == 4">教研主管</span>
          <span v-else-if="scope.row.job == 5">咨询师</span>
          <span v-else>其他</span>
        </template>
    </el-table-column>
    <el-table-column prop="entryDate" label="入职日期" width="180" align="center"></el-table-column>
    <el-table-column prop="updateTime" label="最后操作时间" width="210" align="center"></el-table-column>
    <el-table-column label="操作" fixed="right" align="center">
      <template #default="scope">
        <el-button size="small" type="primary" @click="">编辑</el-button>
        <el-button size="small" type="danger" @click="">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <br>

  <!-- 分页 -->
  <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 30, 50, 75, 100]"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

  <!-- 新增/修改员工的对话框 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form ref="employeeFormRef" :model="employee" label-width="80px">
        <!-- 基本信息 -->
        <!-- 第一行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model="employee.username" placeholder="请输入员工用户名，2-20个字"></el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="employee.name" placeholder="请输入员工姓名，2-10个字"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第二行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="employee.gender" placeholder="请选择性别" style="width: 100%;">
                <el-option v-for="gender in genders" :key="gender.name" :label="gender.name" :value="gender.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="employee.phone" placeholder="请输入员工手机号"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第三行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职位">
              <el-select v-model="employee.job" placeholder="请选择职位" style="width: 100%;">
                <el-option v-for="job in jobs" :key="job.name" :label="job.name" :value="job.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="薪资">
              <el-input v-model="employee.salary" placeholder="请输入员工薪资"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第四行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属部门">
              <el-select v-model="employee.deptId" placeholder="请选择部门" style="width: 100%;">
                <el-option v-for="dept in deptList" :key="dept.id" :label="dept.name" :value="dept.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期">
              <el-date-picker v-model="employee.entryDate" type="date" style="width: 100%;" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第五行 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                >
                <img v-if="employee.image" :src="employee.image" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
        

        <!-- 工作经历 -->
        <!-- 第六行 -->
        <el-row :gutter="10">
          <el-col :span="24">
            <el-form-item label="工作经历">
              <el-button type="success" size="small" @click="addExprItem">+ 添加工作经历</el-button>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第七行 ...  工作经历 -->
        <el-row :gutter="3" v-for="(expr, index) in employee.exprList">
          <el-col :span="10">
            <el-form-item size="small" label="时间" label-width="80px">
              <el-date-picker type="daterange" v-model="expr.exprDate" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" ></el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item size="small" label="公司" label-width="60px">
              <el-input placeholder="请输入公司名称" v-model="expr.company"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item size="small" label="职位" label-width="60px">
              <el-input placeholder="请输入职位" v-model="expr.job"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="2">
            <el-form-item size="small" label-width="0px">
              <el-button type="danger" @click="delExprItem(index)">- 删除</el-button>
            </el-form-item>
          </el-col>
        </el-row>
       </el-form>
       
        <!-- 底部按钮 -->
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="">保存</el-button>
          </span>
        </template>

    </el-dialog>

</template>

<style scoped>
.avatar {
  height: 40px;
}
.avatar-uploader .avatar {
  width: 78px;
  height: 78px;
  display: block;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 78px;
  height: 78px;
  text-align: center;
  /* 添加灰色的虚线边框 */
  border: 1px dashed var(--el-border-color);
}
</style>
```

接下来，我们就可以打开浏览器看到具体的页面效果了。

![](</blogs/_assets/lakebook/bbe0c186d4c69e004e46b295.png>)

### 页面交互

#### 保存员工信息

基本的页面布局，我们完成之后，接下来，就需要完成页面的交互操作。 当点击 “保存” 按钮，需要执行如下操作：

1. 点击保存之后，发送异步请求到服务端，提交数据。
2. 保存完毕之后，如果成功，关闭对话框，重新加载列表数据。
3. 保存完毕之后，如果失败，提示错误信息。

具体操作如下：

**1\)\. 为 "保存" 按钮绑定事件**

```text
<!-- ........ 前面的代码省略了......... -->
        <!-- 底部按钮 -->
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="save">保存</el-button>
          </span>
        </template>
    </el-dialog>
```

**2\)\. 在** `<script></script>` **中定义函数 save**

```text
//保存员工信息
const save = async () => {
  const result = await addApi(employee.value);
  if(result.code){
    ElMessage.success('新增员工成功')
    dialogVisible.value = false
    search()
  }else {
    ElMessage.error(result.msg)
  }
}
```

然后我们就可以打开浏览器，测试添加员工了。

![](</blogs/_assets/lakebook/03f84d0cf9a5189e76736bf0.png>)

#### 表单校验

从页面原型中的需求描述，我们就可以提取出这个表单的校验规则。 我们可以打开页面原型来看一下：

![](</blogs/_assets/lakebook/d5f1c5bd075ed6b056563d75.png>)

通过页面原型，我们可以提取到的校验规则如下：

表单校验规则：

- 用户名：必填，长度2\-20
- 姓名：必填，长度2\-10
- 性别：必填
- 手机号：必填，符合手机号规则

接下来，我们可以借助于AI，帮我们生成对应的校验规则：

**AI提示词\(prompt\):**

请帮我生成ElementPlus中表单的校验规则，具体规则如下：

1. 用户名: 必填, 长度2\-20
2. 姓名: 必填, 长度2\-10
3. 性别: 必填
4. 手机号: 必填, 11位, 符合手机号规则

请帮我生成表单的校验规则, 并为表单项绑定对应的校验规则。

参考AI生成的代码，并在其基础上进行改造完成新增员工表单的校验。最终代码形式如下\(新增代码为绿色背景\)：

```text
<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { queryPageApi, addApi } from '@/api/emp'
import { queryAllApi as queryAllDeptApi } from '@/api/dept'

//职位列表数据
const jobs = ref([{ name: '班主任', value: 1 },{ name: '讲师', value: 2 },{ name: '学工主管', value: 3 },{ name: '教研主管', value: 4 },{ name: '咨询师', value: 5 },{ name: '其他', value: 6 }])
//性别列表数据
const genders = ref([{ name: '男', value: 1 }, { name: '女', value: 2 }])
//部门列表数据
const deptList = ref([])

const searchEmp = ref({
  name: '',
  gender: '',
  date: [],
  begin: '',
  end: ''
})

//侦听searchEmp中的date属性
watch(
  () => searchEmp.value.date,
  (newValue, oldValue) => {
     if(newValue.length == 2){
      searchEmp.value.begin = newValue[0]
      searchEmp.value.end = newValue[1]
     }else {
      searchEmp.value.begin = ''
      searchEmp.value.end = ''
     }
  }
)

onMounted(async () => {
  search()

  //加载所有部门数据
  const result = await queryAllDeptApi();
  if(result.code){
    deptList.value = result.data
  }
})

//查询员工
const search = async () => {
  console.log('Search:', searchEmp.value)
  const result = await queryPageApi(searchEmp.value.name, searchEmp.value.gender, searchEmp.value.begin, searchEmp.value.end, currentPage.value, pageSize.value);
  if(result.code){
    empList.value = result.data.rows
    total.value = result.data.total
  }
}

const clear = () => {
  // 清空表单
  searchEmp.value = {
    name: '',
    gender: '',
    date: [],
    begin: '',
    end: ''
  }
  search()
}

// 示例数据
const empList = ref([])

// 分页配置
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 分页处理
const handleSizeChange = (val) => {
  search()
}
const handleCurrentChange = (val) => {
  search()
}


//新增/修改表单
const employeeFormRef = ref(null)
const employee = ref({
  username: '',
  name: '',
  gender: '',
  phone: '',
  job: '',
  salary: '',
  deptId: '',
  entryDate: '',
  image: '',
  exprList: []
})

//新增员工
const addEmp = () => {
  dialogVisible.value = true
  dialogTitle.value = '新增员工'
  
  //清空表单内容及校验提示信息
  employee.value = {
    username: '',
    name: '',
    gender: '',
    phone: '',
    job: '',
    salary: '',
    deptId: '',
    entryDate: '',
    image: '',
    exprList: []
  }
  if(employeeFormRef.value){
      employeeFormRef.value.resetFields()
  }
}

//表单校验规则
// 验证规则
const rules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应在2到20个字符之间', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度应在2到10个字符之间', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/g, message: '请输入有效的手机号', trigger: 'blur' }
  ]
});

// 控制弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')

//文件上传
// 图片上传成功后触发
const handleAvatarSuccess = (response,uploadFile) => {
  employee.value.image = response.data
}
// 文件上传之前触发
const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('只支持上传图片')
    return false
  } else if (rawFile.size / 1024 / 1024 > 10) {
    ElMessage.error('只能上传10M以内图片')
    return false
  }
  return true
}

//工作经历
//动态添加工作经历 .
const addExprItem = () => {
  employee.value.exprList.push({exprDate: [], begin: '', end: '', company: '', job: ''})
}

//动态删除工作经历 .
const delExprItem = (index) => {
  employee.value.exprList.splice(index, 1)
}

//监听-employee员工对象中的工作经历数据
watch(employee, (newVal, oldVal) => {
  if(employee.value.exprList) {
    employee.value.exprList.forEach(expr => {
      expr.begin = expr.exprDate[0]
      expr.end = expr.exprDate[1]
    })
  }
}, {deep: true})

//保存员工信息
const save = async () => {
  employeeFormRef.value.validate(async valid => {
    if(valid){ // 校验通过
      const result = await addApi(employee.value);
      if(result.code){
        ElMessage.success('新增员工成功')
        dialogVisible.value = false
        search()
      }else {
        ElMessage.error(result.msg)
      }
    }
  })
}
</script>

<template>
  <h1>员工管理</h1> <br>
  <el-form :inline="true" :model="searchEmp">
    <el-form-item label="姓名">
      <el-input v-model="searchEmp.name" placeholder="请输入员工姓名"></el-input>
    </el-form-item>

    <el-form-item label="性别">
      <el-select v-model="searchEmp.gender" placeholder="请选择">
        <el-option label="男" value="1"></el-option>
        <el-option label="女" value="2"></el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="入职日期">
      <el-date-picker
        v-model="searchEmp.date"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      ></el-date-picker>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="clear">清空</el-button>
    </el-form-item>
  </el-form>

  <el-button type="primary" @click="addEmp"> + 新增员工</el-button>
  <el-button type="danger" @click=""> - 批量删除</el-button>
  <br><br>

  <!-- 表格 -->
  <el-table :data="empList" border style="width: 100%">
    <el-table-column type="selection" width="55" align="center"></el-table-column>
    <el-table-column prop="name" label="姓名" width="120" align="center"></el-table-column>
    <el-table-column label="性别" width="80" align="center">
      <template #default="scope" >
        {{ scope.row.gender == 1 ? '男' : '女' }}
      </template>
    </el-table-column>
    <el-table-column label="头像" width="170" align="center">
      <template #default="scope" >
        <img :src="scope.row.image" alt="Avatar" class="avatar" />
      </template>
    </el-table-column>
    <el-table-column prop="deptName" label="部门名称" width="170" align="center"></el-table-column>
    <el-table-column label="职位" width="120" align="center">
      <template #default="scope">
          <span v-if="scope.row.job == 1">班主任</span>
          <span v-else-if="scope.row.job == 2">讲师</span>
          <span v-else-if="scope.row.job == 3">学工主管</span>
          <span v-else-if="scope.row.job == 4">教研主管</span>
          <span v-else-if="scope.row.job == 5">咨询师</span>
          <span v-else>其他</span>
        </template>
    </el-table-column>
    <el-table-column prop="entryDate" label="入职日期" width="180" align="center"></el-table-column>
    <el-table-column prop="updateTime" label="最后操作时间" width="210" align="center"></el-table-column>
    <el-table-column label="操作" fixed="right" align="center">
      <template #default="scope">
        <el-button size="small" type="primary" @click="">编辑</el-button>
        <el-button size="small" type="danger" @click="">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <br>

  <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 30, 50, 75, 100]"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

  <!-- 新增/修改员工的对话框 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form ref="employeeFormRef" :model="employee" :rules="rules" label-width="80px">
        <!-- 基本信息 -->
        <!-- 第一行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="employee.username" placeholder="请输入员工用户名，2-20个字"></el-input>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="employee.name" placeholder="请输入员工姓名，2-10个字"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第二行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="employee.gender" placeholder="请选择性别" style="width: 100%;">
                <el-option v-for="gender in genders" :key="gender.name" :label="gender.name" :value="gender.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="employee.phone" placeholder="请输入员工手机号"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第三行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职位">
              <el-select v-model="employee.job" placeholder="请选择职位" style="width: 100%;">
                <el-option v-for="job in jobs" :key="job.name" :label="job.name" :value="job.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="薪资">
              <el-input v-model="employee.salary" placeholder="请输入员工薪资"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第四行 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属部门">
              <el-select v-model="employee.deptId" placeholder="请选择部门" style="width: 100%;">
                <el-option v-for="dept in deptList" :key="dept.id" :label="dept.name" :value="dept.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期">
              <el-date-picker v-model="employee.entryDate" type="date" style="width: 100%;" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第五行 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                >
                <img v-if="employee.image" :src="employee.image" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
        

        <!-- 工作经历 -->
        <!-- 第六行 -->
        <el-row :gutter="10">
          <el-col :span="24">
            <el-form-item label="工作经历">
              <el-button type="success" size="small" @click="addExprItem">+ 添加工作经历</el-button>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第七行 ...  工作经历 -->
        <el-row :gutter="3" v-for="(expr, index) in employee.exprList">
          <el-col :span="10">
            <el-form-item size="small" label="时间" label-width="80px">
              <el-date-picker type="daterange" v-model="expr.exprDate" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" ></el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item size="small" label="公司" label-width="60px">
              <el-input placeholder="请输入公司名称" v-model="expr.company"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item size="small" label="职位" label-width="60px">
              <el-input placeholder="请输入职位" v-model="expr.job"></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="2">
            <el-form-item size="small" label-width="0px">
              <el-button type="danger" @click="delExprItem(index)">- 删除</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 底部按钮 -->
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </span>
      </template>
    </el-dialog>

</template>

<style scoped>
.avatar {
  height: 40px;
}
.avatar-uploader .avatar {
  width: 78px;
  height: 78px;
  display: block;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 78px;
  height: 78px;
  text-align: center;
  /* 添加灰色的虚线边框 */
  border: 1px dashed var(--el-border-color);
}
</style>
```

代码编写完毕后，我们可以打开浏览器测试一下。

![](</blogs/_assets/lakebook/67f0d93a89571c886cbc264f.png>)

我们可以看到，我们为表单添加的校验规则，确实生效了。 并且，如果表单校验不通过，是不能保存员工信息的。

在昨天的课程中，我们完成了员工管理的查询、新增功能开发。 那今天呢，我们继续来完成员工管理的功能开发，而我们今天要来完成功能包括：

- 修改员工
- 删除员工
- 登录退出
- 前端打包部署

## 修改员工

![](</blogs/_assets/lakebook/2180ef01f9dfe88345712603.png>)

对于修改功能，分为两步实现：

1. 点击 “编辑” 根据ID查询员工的信息，回显展示。
2. 点击 “保存” 按钮，修改员工的信息 。

### 查询回显

**1\)\. 为 "编辑" 按钮绑定事件**

```text
<el-table-column label="操作" align="center">
    <template #default="scope">
      <el-button type="primary" size="small" @click="edit(scope.row.id)"><el-icon><EditPen /></el-icon> 编辑</el-button>
      <el-button type="danger" size="small" @click=""><el-icon><Delete /></el-icon> 删除</el-button>
    </template>
</el-table-column>
```

**2\)\. 在** `<script> </script>` **中定义** `edit`**函数**

```text
//编辑
const edit = async (id) => {
  const result = await queryInfoApi(id);
  if(result.code){
    dialogVisible.value = true;
    dialogTitle.value = '修改员工';
    employee.value = result.data;

    //对工作经历进行处理
    let exprList = employee.value.exprList;
    if(exprList && exprList.length > 0){
      exprList.forEach((expr) => {
        expr.exprDate = [expr.begin, expr.end];
      })
    }
  }
}
```

这里需要根据id查询员工信息，所以此时要import导入 `queryInfoApi`。

```text
import { queryPageApi, addEmpApi, queryInfoApi } from '@/api/emp'
```

打开浏览器，点击 编辑 按钮，测试数据回显：

![](</blogs/_assets/lakebook/e0afe198ba01158eeba81e0a.png>)

### 修改员工

完成了数据回显展示之后，接下来，我们就来完成保存修改操作。 由于修改员工与新增员工共用一个 `Dialog`对话框。 点击保存按钮时，我们只需要根据 id 来判别是新增员工，还是修改员工。

那我们就需要对保存员工的函数，进行完善优化。 最终代码如下：

```text
//保存员工
const save = async () => {
  //表单校验
  if(!empFormRef.value) return;
  empFormRef.value.validate(async (valid) => { //valid 表示是否校验通过: true 通过 / false  不通过
    if(valid){ //通过

      let result;
      if(employee.value.id){ //修改
        result = await updateApi(employee.value);
      }else { //新增
        result = await addApi(employee.value);
      }
      
      if(result.code) {//成功
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        search();
      }else { //失败了
        ElMessage.error(result.msg);
      }
    }else { //不通过
      ElMessage.error('表单校验不通过');
    }
  })
}
```

打开浏览器，测试修改员工信息操作：

![](</blogs/_assets/lakebook/2f145da8c5052e60711f6b80.png>)

![](</blogs/_assets/lakebook/65f6b3b9b08eb3480781c411.png>)

到目前为止，`src/views/emp/index.vue` 中完整的代码如下：

```text
<script setup>
import { ref, watch, onMounted } from 'vue';
import { queryPageApi, addApi, queryInfoApi, updateApi, deleteApi } from '@/api/emp';
import { queryAllApi as queryAllDeptApi } from '@/api/dept';
import { ElMessage, ElMessageBox } from 'element-plus'

//元数据
//职位列表数据
const jobs = ref([{ name: '班主任', value: 1 },{ name: '讲师', value: 2 },{ name: '学工主管', value: 3 },{ name: '教研主管', value: 4 },{ name: '咨询师', value: 5 },{ name: '其他', value: 6 }])
//性别列表数据
const genders = ref([{ name: '男', value: 1 }, { name: '女', value: 2 }])
//部门列表数据
const depts = ref([])

//搜索表单对象
const searchEmp = ref({name: '', gender: '', date: [], begin: '', end: ''})

//侦听searchEmp的date属性
watch(() => searchEmp.value.date, (newVal, oldVal) => {
  if(newVal.length == 2){
    searchEmp.value.begin = newVal[0];
    searchEmp.value.end = newVal[1];
  }else {
    searchEmp.value.begin = '';
    searchEmp.value.end = '';
  }
})

//钩子函数
onMounted(() => {
  search(); //查询员工列表数据
  queryAllDepts();//查询所有部门列表数据
})

//查询所有部门数据
const queryAllDepts = async () => {
  const result = await queryAllDeptApi();
  if(result.code){
    depts.value = result.data;
  }
}

//查询员工列表
const search = async () => {
  const result = await queryPageApi(searchEmp.value.name, searchEmp.value.gender,
                         searchEmp.value.begin, searchEmp.value.end, currentPage.value, pageSize.value);
  if(result.code){
    empList.value = result.data.rows;
    total.value = result.data.total;
  }
}

//清空
const clear = () => {
  searchEmp.value = {name: '', gender: '', date: [], begin: '', end: ''};
  search();
}

//员工列表数据
const empList = ref([])

//分页
const currentPage = ref(1); //页码
const pageSize = ref(10); //每页展示记录数
const background = ref(true); //背景色
const total = ref(0); //总记录数

//每页展示记录数变化
const handleSizeChange = (val) => {
  search();
}
//页码变化时触发
const handleCurrentChange = (val) => {
  search();
}

//新增员工
const addEmp = () => {
  dialogVisible.value = true;
  dialogTitle.value = '新增员工';
  employee.value = {
    username: '',
    name: '',
    gender: '',
    phone: '',
    job: '',
    salary: '',
    deptId: '',
    entryDate: '',
    image: '',
    exprList: []
  }

  //重置表单的校验规则-提示信息
  if (empFormRef.value){
    empFormRef.value.resetFields();
  }
}

//新增/修改表单
const employee = ref({
  username: '',
  name: '',
  gender: '',
  phone: '',
  job: '',
  salary: '',
  deptId: '',
  entryDate: '',
  image: '',
  exprList: []
})

// 控制弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')

// 文件上传
// 图片上传成功后触发
const handleAvatarSuccess = (response) => {
  employee.value.image = response.data;
}
// 文件上传之前触发
const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('只支持上传图片')
    return false
  } else if (rawFile.size / 1024 / 1024 > 10) {
    ElMessage.error('只能上传10M以内图片')
    return false
  }
  return true
}

//添加工作经历
const addExprItem = () => {
  employee.value.exprList.push({company: '', job: '', begin: '', end: '', exprDate: []});
}
//删除工作经历
const delExprItem = (index) => {
  employee.value.exprList.splice(index,1);
}
//侦听-employee员工对象中的工作经历信息
watch(() => employee.value.exprList, (newVal, oldVal) => {
  if(employee.value.exprList && employee.value.exprList.length > 0){
    employee.value.exprList.forEach((expr) => {
      expr.begin = expr.exprDate[0];
      expr.end = expr.exprDate[1];
    })
  }
}, {deep: true}) //深度侦听

//保存员工
const save = async () => {
  //表单校验
  if(!empFormRef.value) return;
  empFormRef.value.validate(async (valid) => { //valid 表示是否校验通过: true 通过 / false  不通过
    if(valid){ //通过

      let result;
      if(employee.value.id){ //修改
        result = await updateApi(employee.value);
      }else { //新增
        result = await addApi(employee.value);
      }
      
      if(result.code) {//成功
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        search();
      }else { //失败了
        ElMessage.error(result.msg);
      }
    }else { //不通过
      ElMessage.error('表单校验不通过');
    }
  })
}
//表单引用
const empFormRef = ref();

//表单校验规则
const rules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应在2到20个字符之间', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度应在2到10个字符之间', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    /**
     * 正则表达式: / ..... / ;  ^ : 以...开始 ;  $ : 以 ... 结束
     * [3-9] : 范围 3-9 之间
     * \d : 数字, [0-9]
     * {9} : 量词
     */
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }
  ]
});

//编辑
const edit = async (id) => {
  const result = await queryInfoApi(id);
  if(result.code){
    dialogVisible.value = true;
    dialogTitle.value = '修改员工';
    employee.value = result.data;

    //对工作经历进行处理
    let exprList = employee.value.exprList;
    if(exprList && exprList.length > 0){
      exprList.forEach((expr) => {
        expr.exprDate = [expr.begin, expr.end];
      })
    }
  }
}


</script>

<template>
  <h1>员工管理</h1>

  <!-- 搜索栏 -->
  <div class="container">
    <el-form :inline="true" :model="searchEmp" class="demo-form-inline">
      <el-form-item label="姓名">
        <el-input v-model="searchEmp.name" placeholder="请输入员工姓名" />
      </el-form-item>

      <el-form-item label="性别">
        <el-select v-model="searchEmp.gender" placeholder="请选择">
          <el-option label="男" value="1" />
          <el-option label="女" value="2" />
        </el-select>
      </el-form-item>

      <el-form-item label="入职时间">
        <el-date-picker
          v-model="searchEmp.date"
          type="daterange"
          range-separator="到"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button type="info" @click="clear">清空</el-button>
      </el-form-item>
    </el-form>
  </div>
  
  <!-- 功能按钮 -->
  <div class="container">
    <el-button type="primary" @click="addEmp">+ 新增员工</el-button>
    <el-button type="danger" @click="deleteByIds">- 批量删除</el-button>
  </div>

  <!-- 数据展示表格 -->
  <div class="container">
    <el-table :data="empList" border style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column prop="name" label="姓名" width="120" align="center"/>
      <el-table-column label="性别" width="120"  align="center">
        <template #default="scope">
          {{ scope.row.gender == 1 ? '男' : '女' }}
        </template>
      </el-table-column>
      <el-table-column label="头像" width="120"  align="center">
        <template #default="scope">
          <img :src="scope.row.image" height="30px">
        </template>
      </el-table-column>
      <el-table-column prop="deptName" label="所属部门" width="120"  align="center"/>
      <el-table-column prop="job" label="职位" width="120"  align="center">
        <template #default="scope">
          <span v-if="scope.row.job == 1">班主任</span>
          <span v-else-if="scope.row.job == 2">讲师</span>
          <span v-else-if="scope.row.job == 3">学工主管</span>
          <span v-else-if="scope.row.job == 4">教研主管</span>
          <span v-else-if="scope.row.job == 5">咨询师</span>
          <span v-else>其他</span>
        </template>
      </el-table-column>
      <el-table-column prop="entryDate" label="入职日期" width="180"  align="center"/>
      <el-table-column prop="updateTime" label="最后操作时间" width="200"  align="center"/>
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="edit(scope.row.id)"><el-icon><EditPen /></el-icon> 编辑</el-button>
          <el-button type="danger" size="small" @click=""><el-icon><Delete /></el-icon> 删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- 分页条 -->
  <div class="container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 30, 50, 75, 100]"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
  
  <!-- 新增员工/修改员工的对话框 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form :model="employee" :rules="rules" ref="empFormRef" label-width="80px">
      <!-- 基本信息 -->
      <!-- 第一行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="employee.username" placeholder="请输入员工用户名，2-20个字"></el-input>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="employee.name" placeholder="请输入员工姓名，2-10个字"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第二行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="性别"  prop="gender">
            <el-select v-model="employee.gender" placeholder="请选择性别" style="width: 100%;">
              <el-option v-for="g in genders" :key="g.value" :label="g.name" :value="g.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="employee.phone" placeholder="请输入员工手机号"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第三行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="职位">
            <el-select v-model="employee.job" placeholder="请选择职位" style="width: 100%;">
              <el-option v-for="j in jobs" :key="j.value" :label="j.name" :value="j.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="薪资">
            <el-input v-model="employee.salary" placeholder="请输入员工薪资"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第四行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属部门">
            <el-select v-model="employee.deptId" placeholder="请选择部门" style="width: 100%;">
              <el-option v-for="d in depts" :key="d.id" :label="d.name" :value="d.id"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="入职日期">
            <el-date-picker v-model="employee.entryDate" type="date" style="width: 100%;" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第五行 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="头像">
            <el-upload
              class="avatar-uploader"
              action="/api/upload"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              >
              <img v-if="employee.image" :src="employee.image" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
          </el-form-item>
        </el-col>
      </el-row>
      

      <!-- 工作经历 -->
      <!-- 第六行 -->
      <el-row :gutter="10">
        <el-col :span="24">
          <el-form-item label="工作经历">
            <el-button type="success" size="small" @click="addExprItem">+ 添加工作经历</el-button>
          </el-form-item>
        </el-col>
      </el-row>
      
      <!-- 第七行 ...  工作经历 -->
      <el-row :gutter="3" v-for="(expr,index) in employee.exprList">
        <el-col :span="10">
          <el-form-item size="small" label="时间" label-width="80px">
            <el-date-picker type="daterange" v-model="expr.exprDate" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" ></el-date-picker>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item size="small" label="公司" label-width="60px">
            <el-input placeholder="请输入公司名称" v-model="expr.company"></el-input>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item size="small" label="职位" label-width="60px">
            <el-input placeholder="请输入职位" v-model="expr.job"></el-input>
          </el-form-item>
        </el-col>

        <el-col :span="2">
          <el-form-item size="small" label-width="0px">
            <el-button type="danger" @click="delExprItem(index)">- 删除</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    
    <!-- 底部按钮 -->
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </span>
    </template>
  </el-dialog>

</template>

<style scoped>
.container {
  margin: 10px 0px;
}

.avatar {
  height: 40px;
}
.avatar-uploader .avatar {
  width: 78px;
  height: 78px;
  display: block;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 78px;
  height: 78px;
  text-align: center;
  border-radius: 10px;
  /* 添加灰色的虚线边框 */
  border: 1px dashed var(--el-border-color);
}
</style>
```

## 删除员工

![](</blogs/_assets/lakebook/7a208114bb990f07368709da.png>)

在删除员工信息时，有两个操作入口：

- 点击每条记录之后的“删除”按钮，删除当前这条记录；
- 选择前面的复选框，选中要删除的员工，点击“批量删除”之后，会批量删除员工信息；

### 删除单个

**1\)\. 为 "删除" 按钮 绑定事件**

```text
<el-table-column label="操作" fixed="right" align="center">
  <template #default="scope">
    <el-button size="small" type="primary" @click="handleEdit(scope.row.id)">编辑</el-button>
    <el-button size="small" type="danger" @click="deleteById(scope.row.id)">删除</el-button>
  </template>
</el-table-column>
```

**2\)\. 在** `<script> </script>` **中定义函数**

```text
//删除员工
const deleteById = (id) => {
  //弹出确认框
  ElMessageBox.confirm('您确认删除该员工吗?','提示',
    { confirmButtonText: '确认',cancelButtonText: '取消',type: 'warning'}
  ).then(async () => { //确认
    const result = await deleteApi(id);
    if(result.code){
      ElMessage.success('删除成功');
      search();
    }else{
      ElMessage.error(result.msg);
    }
  }).catch(() => { //取消
    ElMessage.info('您已取消删除');
  })
}
```

这里用到了ElmentPlus中的消息确认框 `ElMessageBox`，就记得需要引入进来这个组件。

```text
import { ElMessage, ElMessageBox } from 'element-plus'
```

打开浏览器，测试一下：

![](</blogs/_assets/lakebook/1d7f993a3f8c68ed6a8fb83c.png>)

### 批量删除

**1\)\. 为复选框绑定事件** `@selection-change`

```text
<!-- 数据展示表格 -->
  <div class="container">
    <el-table :data="empList" border style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column prop="name" label="姓名" width="120" align="center"/>
      <el-table-column label="性别" width="120"  align="center">
        <template #default="scope">
          {{ scope.row.gender == 1 ? '男' : '女' }}
        </template>
      </el-table-column>
      <el-table-column label="头像" width="120"  align="center">
        <template #default="scope">
          <img :src="scope.row.image" height="30px">
        </template>
      </el-table-column>
      <el-table-column prop="deptName" label="所属部门" width="120"  align="center"/>
      <el-table-column prop="job" label="职位" width="120"  align="center">
        <template #default="scope">
          <span v-if="scope.row.job == 1">班主任</span>
          <span v-else-if="scope.row.job == 2">讲师</span>
          <span v-else-if="scope.row.job == 3">学工主管</span>
          <span v-else-if="scope.row.job == 4">教研主管</span>
          <span v-else-if="scope.row.job == 5">咨询师</span>
          <span v-else>其他</span>
        </template>
      </el-table-column>
      <el-table-column prop="entryDate" label="入职日期" width="180"  align="center"/>
      <el-table-column prop="updateTime" label="最后操作时间" width="200"  align="center"/>
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="edit(scope.row.id)"><el-icon><EditPen /></el-icon> 编辑</el-button>
          <el-button type="danger" size="small" @click="deleteById(scope.row.id)"><el-icon><Delete /></el-icon> 删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
```

**2\)\. 定义** `handleSelectionChange`**函数**

```text
//记录勾选的员工的id
const selectedIds = ref([]);
//复选框勾选发生变化时触发 - selection: 当前选中的记录 (数组)
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map( item => item.id);
}
```

**3\)\. 为 "批量删除" 按钮绑定事件**

```text
<el-button type="primary" @click="addEmp"> + 新增员工</el-button>
  <el-button type="danger" @click="deleteByIds"> - 批量删除</el-button>
```

**4\)\. 在** `<script> </script>` **中定义函数**

```text
//批量删除
const deleteByIds = () => {
  //弹出确认框
  ElMessageBox.confirm('您确认删除该员工吗?','提示',
    { confirmButtonText: '确认',cancelButtonText: '取消',type: 'warning'}
  ).then(async () => { //确认
    if(selectedIds.value && selectedIds.value.length > 0){
      const result = await deleteApi(selectedIds.value);
      if(result.code){
        ElMessage.success('删除成功');
        search();
      }else{
        ElMessage.error(result.msg);
      }
    }else {
      ElMessage.info('您没有选择任何要删除的数据');
    }
  }).catch(() => { //取消
    ElMessage.info('您已取消删除');
  })
}
```

打开浏览器，测试一下：

![](</blogs/_assets/lakebook/3cdf4af15190e0d603e0a78a.png>)

到此呢，关于员工管理的基本的增删改查功能，我们已经完成了。 目前为止，`src/views/emp/index.vue` 的完整代码如下：

```text
<script setup>
import { ref, watch, onMounted } from 'vue';
import { queryPageApi, addApi, queryInfoApi, updateApi, deleteApi } from '@/api/emp';
import { queryAllApi as queryAllDeptApi } from '@/api/dept';
import { ElMessage, ElMessageBox } from 'element-plus'

//元数据
//职位列表数据
const jobs = ref([{ name: '班主任', value: 1 },{ name: '讲师', value: 2 },{ name: '学工主管', value: 3 },{ name: '教研主管', value: 4 },{ name: '咨询师', value: 5 },{ name: '其他', value: 6 }])
//性别列表数据
const genders = ref([{ name: '男', value: 1 }, { name: '女', value: 2 }])
//部门列表数据
const depts = ref([])

//搜索表单对象
const searchEmp = ref({name: '', gender: '', date: [], begin: '', end: ''})

//侦听searchEmp的date属性
watch(() => searchEmp.value.date, (newVal, oldVal) => {
  if(newVal.length == 2){
    searchEmp.value.begin = newVal[0];
    searchEmp.value.end = newVal[1];
  }else {
    searchEmp.value.begin = '';
    searchEmp.value.end = '';
  }
})

//钩子函数
onMounted(() => {
  search(); //查询员工列表数据
  queryAllDepts();//查询所有部门列表数据
})

//查询所有部门数据
const queryAllDepts = async () => {
  const result = await queryAllDeptApi();
  if(result.code){
    depts.value = result.data;
  }
}

//查询员工列表
const search = async () => {
  const result = await queryPageApi(searchEmp.value.name, searchEmp.value.gender,
                         searchEmp.value.begin, searchEmp.value.end, currentPage.value, pageSize.value);
  if(result.code){
    empList.value = result.data.rows;
    total.value = result.data.total;
  }
}

//清空
const clear = () => {
  searchEmp.value = {name: '', gender: '', date: [], begin: '', end: ''};
  search();
}

//员工列表数据
const empList = ref([])

//分页
const currentPage = ref(1); //页码
const pageSize = ref(10); //每页展示记录数
const background = ref(true); //背景色
const total = ref(0); //总记录数

//每页展示记录数变化
const handleSizeChange = (val) => {
  search();
}
//页码变化时触发
const handleCurrentChange = (val) => {
  search();
}

//新增员工
const addEmp = () => {
  dialogVisible.value = true;
  dialogTitle.value = '新增员工';
  employee.value = {
    username: '',
    name: '',
    gender: '',
    phone: '',
    job: '',
    salary: '',
    deptId: '',
    entryDate: '',
    image: '',
    exprList: []
  }

  //重置表单的校验规则-提示信息
  if (empFormRef.value){
    empFormRef.value.resetFields();
  }
}

//新增/修改表单
const employee = ref({
  username: '',
  name: '',
  gender: '',
  phone: '',
  job: '',
  salary: '',
  deptId: '',
  entryDate: '',
  image: '',
  exprList: []
})

// 控制弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')

// 文件上传
// 图片上传成功后触发
const handleAvatarSuccess = (response) => {
  employee.value.image = response.data;
}
// 文件上传之前触发
const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('只支持上传图片')
    return false
  } else if (rawFile.size / 1024 / 1024 > 10) {
    ElMessage.error('只能上传10M以内图片')
    return false
  }
  return true
}

//添加工作经历
const addExprItem = () => {
  employee.value.exprList.push({company: '', job: '', begin: '', end: '', exprDate: []});
}
//删除工作经历
const delExprItem = (index) => {
  employee.value.exprList.splice(index,1);
}
//侦听-employee员工对象中的工作经历信息
watch(() => employee.value.exprList, (newVal, oldVal) => {
  if(employee.value.exprList && employee.value.exprList.length > 0){
    employee.value.exprList.forEach((expr) => {
      expr.begin = expr.exprDate[0];
      expr.end = expr.exprDate[1];
    })
  }
}, {deep: true}) //深度侦听

//保存员工
const save = async () => {
  //表单校验
  if(!empFormRef.value) return;
  empFormRef.value.validate(async (valid) => { //valid 表示是否校验通过: true 通过 / false  不通过
    if(valid){ //通过

      let result;
      if(employee.value.id){ //修改
        result = await updateApi(employee.value);
      }else { //新增
        result = await addApi(employee.value);
      }
      
      if(result.code) {//成功
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        search();
      }else { //失败了
        ElMessage.error(result.msg);
      }
    }else { //不通过
      ElMessage.error('表单校验不通过');
    }
  })
}
//表单引用
const empFormRef = ref();

//表单校验规则
const rules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应在2到20个字符之间', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度应在2到10个字符之间', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    /**
     * 正则表达式: / ..... / ;  ^ : 以...开始 ;  $ : 以 ... 结束
     * [3-9] : 范围 3-9 之间
     * \d : 数字, [0-9]
     * {9} : 量词
     */
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }
  ]
});

//编辑
const edit = async (id) => {
  const result = await queryInfoApi(id);
  if(result.code){
    dialogVisible.value = true;
    dialogTitle.value = '修改员工';
    employee.value = result.data;

    //对工作经历进行处理
    let exprList = employee.value.exprList;
    if(exprList && exprList.length > 0){
      exprList.forEach((expr) => {
        expr.exprDate = [expr.begin, expr.end];
      })
    }
  }
}

//删除员工
const deleteById = (id) => {
  //弹出确认框
  ElMessageBox.confirm('您确认删除该员工吗?','提示',
    { confirmButtonText: '确认',cancelButtonText: '取消',type: 'warning'}
  ).then(async () => { //确认
    const result = await deleteApi(id);
    if(result.code){
      ElMessage.success('删除成功');
      search();
    }else{
      ElMessage.error(result.msg);
    }
  }).catch(() => { //取消
    ElMessage.info('您已取消删除');
  })
}
//记录勾选的员工的id
const selectedIds = ref([]);
//复选框勾选发生变化时触发 - selection: 当前选中的记录 (数组)
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map( item => item.id);
}

//批量删除
const deleteByIds = () => {
  //弹出确认框
  ElMessageBox.confirm('您确认删除该员工吗?','提示',
    { confirmButtonText: '确认',cancelButtonText: '取消',type: 'warning'}
  ).then(async () => { //确认
    if(selectedIds.value && selectedIds.value.length > 0){
      const result = await deleteApi(selectedIds.value);
      if(result.code){
        ElMessage.success('删除成功');
        search();
      }else{
        ElMessage.error(result.msg);
      }
    }else {
      ElMessage.info('您没有选择任何要删除的数据');
    }
  }).catch(() => { //取消
    ElMessage.info('您已取消删除');
  })
}

</script>

<template>
  <h1>员工管理</h1>

  <!-- 搜索栏 -->
  <div class="container">
    <el-form :inline="true" :model="searchEmp" class="demo-form-inline">
      <el-form-item label="姓名">
        <el-input v-model="searchEmp.name" placeholder="请输入员工姓名" />
      </el-form-item>

      <el-form-item label="性别">
        <el-select v-model="searchEmp.gender" placeholder="请选择">
          <el-option label="男" value="1" />
          <el-option label="女" value="2" />
        </el-select>
      </el-form-item>

      <el-form-item label="入职时间">
        <el-date-picker
          v-model="searchEmp.date"
          type="daterange"
          range-separator="到"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button type="info" @click="clear">清空</el-button>
      </el-form-item>
    </el-form>
  </div>
  
  <!-- 功能按钮 -->
  <div class="container">
    <el-button type="primary" @click="addEmp">+ 新增员工</el-button>
    <el-button type="danger" @click="deleteByIds">- 批量删除</el-button>
  </div>

  <!-- 数据展示表格 -->
  <div class="container">
    <el-table :data="empList" border style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column prop="name" label="姓名" width="120" align="center"/>
      <el-table-column label="性别" width="120"  align="center">
        <template #default="scope">
          {{ scope.row.gender == 1 ? '男' : '女' }}
        </template>
      </el-table-column>
      <el-table-column label="头像" width="120"  align="center">
        <template #default="scope">
          <img :src="scope.row.image" height="30px">
        </template>
      </el-table-column>
      <el-table-column prop="deptName" label="所属部门" width="120"  align="center"/>
      <el-table-column prop="job" label="职位" width="120"  align="center">
        <template #default="scope">
          <span v-if="scope.row.job == 1">班主任</span>
          <span v-else-if="scope.row.job == 2">讲师</span>
          <span v-else-if="scope.row.job == 3">学工主管</span>
          <span v-else-if="scope.row.job == 4">教研主管</span>
          <span v-else-if="scope.row.job == 5">咨询师</span>
          <span v-else>其他</span>
        </template>
      </el-table-column>
      <el-table-column prop="entryDate" label="入职日期" width="180"  align="center"/>
      <el-table-column prop="updateTime" label="最后操作时间" width="200"  align="center"/>
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="edit(scope.row.id)"><el-icon><EditPen /></el-icon> 编辑</el-button>
          <el-button type="danger" size="small" @click="deleteById(scope.row.id)"><el-icon><Delete /></el-icon> 删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- 分页条 -->
  <div class="container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 30, 50, 75, 100]"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
  
  <!-- 新增员工/修改员工的对话框 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form :model="employee" :rules="rules" ref="empFormRef" label-width="80px">
      <!-- 基本信息 -->
      <!-- 第一行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="employee.username" placeholder="请输入员工用户名，2-20个字"></el-input>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="employee.name" placeholder="请输入员工姓名，2-10个字"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第二行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="性别"  prop="gender">
            <el-select v-model="employee.gender" placeholder="请选择性别" style="width: 100%;">
              <el-option v-for="g in genders" :key="g.value" :label="g.name" :value="g.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="employee.phone" placeholder="请输入员工手机号"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第三行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="职位">
            <el-select v-model="employee.job" placeholder="请选择职位" style="width: 100%;">
              <el-option v-for="j in jobs" :key="j.value" :label="j.name" :value="j.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="薪资">
            <el-input v-model="employee.salary" placeholder="请输入员工薪资"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第四行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属部门">
            <el-select v-model="employee.deptId" placeholder="请选择部门" style="width: 100%;">
              <el-option v-for="d in depts" :key="d.id" :label="d.name" :value="d.id"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="入职日期">
            <el-date-picker v-model="employee.entryDate" type="date" style="width: 100%;" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD"></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第五行 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="头像">
            <el-upload
              class="avatar-uploader"
              action="/api/upload"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              >
              <img v-if="employee.image" :src="employee.image" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
          </el-form-item>
        </el-col>
      </el-row>
      

      <!-- 工作经历 -->
      <!-- 第六行 -->
      <el-row :gutter="10">
        <el-col :span="24">
          <el-form-item label="工作经历">
            <el-button type="success" size="small" @click="addExprItem">+ 添加工作经历</el-button>
          </el-form-item>
        </el-col>
      </el-row>
      
      <!-- 第七行 ...  工作经历 -->
      <el-row :gutter="3" v-for="(expr,index) in employee.exprList">
        <el-col :span="10">
          <el-form-item size="small" label="时间" label-width="80px">
            <el-date-picker type="daterange" v-model="expr.exprDate" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" ></el-date-picker>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item size="small" label="公司" label-width="60px">
            <el-input placeholder="请输入公司名称" v-model="expr.company"></el-input>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item size="small" label="职位" label-width="60px">
            <el-input placeholder="请输入职位" v-model="expr.job"></el-input>
          </el-form-item>
        </el-col>

        <el-col :span="2">
          <el-form-item size="small" label-width="0px">
            <el-button type="danger" @click="delExprItem(index)">- 删除</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    
    <!-- 底部按钮 -->
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </span>
    </template>
  </el-dialog>

</template>

<style scoped>
.container {
  margin: 10px 0px;
}

.avatar {
  height: 40px;
}
.avatar-uploader .avatar {
  width: 78px;
  height: 78px;
  display: block;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 78px;
  height: 78px;
  text-align: center;
  border-radius: 10px;
  /* 添加灰色的虚线边框 */
  border: 1px dashed var(--el-border-color);
}
</style>
```

## 登录退出

员工的增删改查功能我们完成之后，最后我们再来完成一个功能，那就是登录退出功能。

![](</blogs/_assets/lakebook/7e788114f4959f90a2630ebf.png>)

登录页面所在位置为：

我们可以在浏览器中访问路径：http://localhost:5173/login 访问到登录页面。

![](</blogs/_assets/lakebook/94dd0c88123c0ece0a10bc87.png>)

那接下来呢，我们就先来完成登录功能。

### 登录d

1\)\. 定义登录请求的api : `src/api/login.js`

```text
import request from '@/utils/request'

//登录
export const loginApi = (data) => request.post('/login', data)
```

2\)\. 在 `src/views/login/index.vue` 中增加如下代码:

```text
<script setup>
import { ref } from 'vue'
import {loginApi} from '@/api/login'
import { ElMessage } from 'element-plus'   // 提示组件需要实现引入

import { useRouter } from 'vue-router'  //跳转页面

let loginForm = ref({username:'', password:''})
let router = useRouter()

//登录  使用 JS, aniox实现 绑定操作
const login = async () => {
  const result = await loginApi(loginForm.value)
  if (result.code) {// 登录成功 需要的提示信息
   
    ElMessage.success('登录成功') --> 跳转页面 , JSON.stringfy实现转字符串
    localStorage.setItem('loginUser', JSON.stringify(result.data))  [内部的数据类型(String , value:String )]
    router.push('/')// 跳转
  }else {
    ElMessage.error(result.msg)
  }
}

//取消
const clear = () => {
  loginForm.value = {
    username: '',
    password: ''
  }
}
</script>

<template>
  <div id="container">
    <div class="login-form">
      <el-form label-width="80px">
        <p class="title">Tlias智能学习辅助系统</p>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="loginForm.password" placeholder="请输入密码"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button class="button" type="primary" @click="login">登 录</el-button>
          <el-button class="button" type="info" @click="clear">重 置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
#container {
  padding: 10%;
  height: 410px;
  background-image: url('../../assets/bg1.jpg');
  background-repeat: no-repeat;
  background-size: cover;
}

.login-form {
  max-width: 400px;
  padding: 30px;
  margin: 0 auto;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  background-color: white;
}

.title {
  font-size: 30px;
  font-family: '楷体';
  text-align: center;
  margin-bottom: 30px;
  font-weight: bold;
}

.button {
  margin-top: 30px;
  width: 120px;
}
</style>
```

在登录成功之后，需要记录用户的登录信息，这里我们可以直接将用户的登录信息记录在浏览器端的 `localStorage` 本地存储中，以后需要使用登录的相关信息，直接从 `localStorage` 中取出即可。

- localStorage是浏览器提供的本地存储机制 \(5MB\)。
- 存储形式为key\-value形式，键和值都是字符串类型。
- API方法：

- `localStorage.setItem(key, value)`
- `localStorage.getItem(key)`
- `localStorage.removeItem(key)`
- `localStorage.clear()`

### 携带令牌访问

在后续的每一次Ajax请求中都获取 `localStorage` 中的令牌，在请求头中将令牌携带到服务端。 如果这么做，就会非常麻烦，需要在每一次ajax请求的时候获取中存储在 `localStorage` 中的令牌，并携带到服务端，是非常繁琐的。

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1777798899848-5771f7a0-aac4-4e6d-a7b9-e0e856ee4533.png>)

我们可以思考一下，目前我们项目的Ajax请求，是不是都是基于Axios发送的，而在我们的项目中，我们是自己定义了一个axios的请求对象request。所有的异步请求，是不都是基于request对象发起的。 所以，这里呢，我们可以借助于axios中提供的拦截器来进行统一处理。

![](</blogs/_assets/lakebook/b6d7ace853818be7c86caa54.png>)

接下来，我们就需要在request\.js 中通过axios的拦截器实现此功能。具体代码实现如下:

前端使用的 request 拦截器 可以实现在请求前 给 请求 实现一些 功能;

```text
import axios from 'axios'

//创建axios实例对象
const request = axios.create({
  baseURL: '/api',
  timeout: 600000
})

//axios的请求 request 拦截器, 每次请求获取localStorage中的loginUser, 从中获取到token, 在请求头token中携带到服务端
request.interceptors.request.use(
  (config) => {
    let loginUser = JSON.parse(localStorage.getItem('loginUser')) 直接获取是字符串,需要转化为json对象后才能实现选中
    console.log(localStorage.getItem('loginUser'))
    if (loginUser) {
      config.headers.token = loginUser.token
    }
    return config
  }
)

//axios的响应 response 拦截器
request.interceptors.response.use(
  (response) => { //成功回调
    return response.data
  },
  (error) => { //失败回调
    return Promise.reject(error)
  }
)

export default request
```

### 响应401跳转到登录页面

目前，即使用户未登录的情况下访问服务器，服务器会响应401状态码，但是前端并不会跳转到登录页面。 因为，我们在前端并未做任何的拦截判断。接下来，我们就来实现此功能，我们只需要在服务端将数据响应给前端时，在axios的响应拦截器中统一判断处理即可。

![](</blogs/_assets/lakebook/b1cf33928dd4005de5f42430.png>)

接下来，我们就需要在request\.js 中通过axios的响应拦截器实现此功能。具体代码如下：

```text
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

//创建axios实例对象
const request = axios.create({
  baseURL: '/api',
  timeout: 600000
})

//axios的请求 request 拦截器, 每次请求获取localStorage中的loginUser, 从中获取到token, 在请求头token中携带到服务端
request.interceptors.request.use(
  (config) => {
    let loginUser = JSON.parse(localStorage.getItem('loginUser'))
    console.log(localStorage.getItem('loginUser'))
    if (loginUser) {
      config.headers.token = loginUser.token
    }
    return config
  }
)

//axios的响应 response 拦截器
request.interceptors.response.use(
  (response) => { //成功回调
    return response.data
  },
  (error) => { //失败回调
    //如果响应的状态码为401, 则路由到登录页面
    if (error.response.status === 401) {
      ElMessage.error('登录失效, 请重新登录')
      router.push('/login')
    }else{
      ElMessage.success('接口访问异常')
    }
    return Promise.reject(error)
  }
)

export default request
```

### 展示登录用户

```text
<script setup>
import {ref, onMounted} from 'vue'
const loginName = ref('')
//定义钩子函数, 获取登录用户名
onMounted(() => {
  //获取登录用户名
  let loginUser = JSON.parse(localStorage.getItem('loginUser'))
  if (loginUser) {
    loginName.value = loginUser.name
  }
})
</script>

<template>
  <div class="common-layout">
    <el-container>
      <!-- Header 区域 -->
      <el-header class="header">
        <span class="title">Tlias智能学习辅助系统</span>
        <span class="right_tool">
          <a href="">
            <el-icon><EditPen /></el-icon> 修改密码 &nbsp;&nbsp;&nbsp; |  &nbsp;&nbsp;&nbsp;
          </a>
          <a href="">
            <el-icon><SwitchButton /></el-icon> 退出登录 【{{ loginName }}】
          </a>
        </span>
      </el-header>
      
      <el-container>
        <!-- 左侧菜单 -->
        <el-aside width="200px" class="aside">

          <el-menu router>
            <!-- 首页菜单 -->
            <el-menu-item index="/index">
              <el-icon><Promotion /></el-icon> 首页
            </el-menu-item>
            
            <!-- 班级管理菜单 -->
            <el-sub-menu index="/manage">
              <template #title>
                <el-icon><Menu /></el-icon> 班级学员管理
              </template>
              <el-menu-item index="/clazz">
                <el-icon><HomeFilled /></el-icon>班级管理
              </el-menu-item>
              <el-menu-item index="/stu">
                <el-icon><UserFilled /></el-icon>学员管理
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 系统信息管理 -->
            <el-sub-menu index="/system">
              <template #title>
                <el-icon><Tools /></el-icon>系统信息管理
              </template>
              <el-menu-item index="/dept">
                <el-icon><HelpFilled /></el-icon>部门管理
              </el-menu-item>
              <el-menu-item index="/emp">
                <el-icon><Avatar /></el-icon>员工管理
              </el-menu-item>
            </el-sub-menu>

            <!-- 数据统计管理 -->
            <el-sub-menu index="/report">
              <template #title>
                <el-icon><Histogram /></el-icon>数据统计管理
              </template>
              <el-menu-item index="/report/emp">
                <el-icon><InfoFilled /></el-icon>员工信息统计
              </el-menu-item>
              <el-menu-item index="/report/stu">
                <el-icon><Share /></el-icon>学员信息统计
              </el-menu-item>
              <el-menu-item index="/log">
                <el-icon><Document /></el-icon>日志信息统计
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-aside>
        
        <!-- 主展示区域 -->
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.header {
  background-image: linear-gradient(to right, #00547d, #007fa4, #00aaa0, #00d072, #a8eb12);
}

.title {
  color: white;
  font-size: 40px;
  font-family: 楷体;
  line-height: 60px;
  font-weight: bolder;
}

.right_tool{
  float: right;
  line-height: 60px;
}

a {
  color: white;
  text-decoration: none;
}

.aside {
  width: 220px;
  border-right: 1px solid #ccc;
  height: 730px;
}
</style>
```

我们打开浏览器，完成登录之后，就可以看到，在退出登录之后，就显示出了当前登录员工的姓名。效果如下：

![](</blogs/_assets/lakebook/be3454ad63c9ab9750ff3dc9.png>)

### 退出

```text
<script setup>
import {ref, onMounted} from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import {useRouter} from 'vue-router'

let router = useRouter()

const loginName = ref('')
//定义钩子函数, 获取登录用户名
onMounted(() => {
  //获取登录用户名
  let loginUser = JSON.parse(localStorage.getItem('loginUser'))
  if (loginUser) {
    loginName.value = loginUser.name
  }
})

const logout = () => {
  //弹出确认框, 如果确认, 则退出登录, 跳转到登录页面
  ElMessageBox.confirm('确认退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {//确认, 则清空登录信息
    ElMessage.success('退出登录成功')
    localStorage.removeItem('loginUser')
    router.push('/login')//跳转到登录页面
  })
}
</script>

<template>
  <div class="common-layout">
    <el-container>
      <!-- Header 区域 -->
      <el-header class="header">
        <span class="title">Tlias智能学习辅助系统</span>
        <span class="right_tool">
          <a href="">
            <el-icon><EditPen /></el-icon> 修改密码 &nbsp;&nbsp;&nbsp; |  &nbsp;&nbsp;&nbsp;
          </a>
          <a href="javascript:void(0)" @click="logout">
            <el-icon><SwitchButton /></el-icon> 退出登录 【{{ loginName }}】
          </a>
        </span>
      </el-header>
      
      <el-container>
        <!-- 左侧菜单 -->
        <el-aside width="200px" class="aside">

          <el-menu router>
            <!-- 首页菜单 -->
            <el-menu-item index="/index">
              <el-icon><Promotion /></el-icon> 首页
            </el-menu-item>
            
            <!-- 班级管理菜单 -->
            <el-sub-menu index="/manage">
              <template #title>
                <el-icon><Menu /></el-icon> 班级学员管理
              </template>
              <el-menu-item index="/clazz">
                <el-icon><HomeFilled /></el-icon>班级管理
              </el-menu-item>
              <el-menu-item index="/stu">
                <el-icon><UserFilled /></el-icon>学员管理
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 系统信息管理 -->
            <el-sub-menu index="/system">
              <template #title>
                <el-icon><Tools /></el-icon>系统信息管理
              </template>
              <el-menu-item index="/dept">
                <el-icon><HelpFilled /></el-icon>部门管理
              </el-menu-item>
              <el-menu-item index="/emp">
                <el-icon><Avatar /></el-icon>员工管理
              </el-menu-item>
            </el-sub-menu>

            <!-- 数据统计管理 -->
            <el-sub-menu index="/report">
              <template #title>
                <el-icon><Histogram /></el-icon>数据统计管理
              </template>
              <el-menu-item index="/report/emp">
                <el-icon><InfoFilled /></el-icon>员工信息统计
              </el-menu-item>
              <el-menu-item index="/report/stu">
                <el-icon><Share /></el-icon>学员信息统计
              </el-menu-item>
              <el-menu-item index="/log">
                <el-icon><Document /></el-icon>日志信息统计
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-aside>
        
        <!-- 主展示区域 -->
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.header {
  background-image: linear-gradient(to right, #00547d, #007fa4, #00aaa0, #00d072, #a8eb12);
}

.title {
  color: white;
  font-size: 40px;
  font-family: 楷体;
  line-height: 60px;
  font-weight: bolder;
}

.right_tool{
  float: right;
  line-height: 60px;
}

a {
  color: white;
  text-decoration: none;
}

.aside {
  width: 220px;
  border-right: 1px solid #ccc;
  height: 730px;
}
</style>
```

我们打开浏览器，完成登录之后，就可以看到，在退出登录之后，就显示出了当前登录员工的姓名。然后点击退出登录，就可以看到效果如下：

![](</blogs/_assets/lakebook/f3d8a439e036e494070da2db.png>)

点击确定之后，就会退出登录，跳转到登录页面。

![](</blogs/_assets/lakebook/9174761b1e5560a1e0e23dde.png>)

### 图片上传401问题

目前，我们已经完成了部门管理，员工管理，以及登录退出等所有的功能。 但是其实目前程序中还存在一点小问题，那就是图片上传的时候，服务器端响应 401。如下图：

![](</blogs/_assets/lakebook/1e812e1abb71ff26adf93642.png>)

出现这个问题的原因是因为图片上传我们使用的是 ElementPlus 中提供的 el\-upload 组件，请求服务端的时候并未通过axios，所以也并不会通过我们配置的axios的拦截器，携带请求头token 了。 服务器端，拦截到请求之后，发现未携带令牌，就会出现这个问题。

那接下来，针对于这个文件上传的请求，我们则需要单独处理一下。处理思路如下：

- 页面加载完毕后，从localStorage中获取登录员工信息，然后获取到token令牌。
- 然后在文件上传时，在请求头中将令牌携带到服务端。

**具体操作步骤：**

1\)\. 在 `src/views/emp/index.vue` 中的 `<script></script>` 添加如下代码:

```text
//声明token
const token = ref('')

//钩子函数
onMounted(() => {
  search(); //查询员工列表数据
  queryAllDepts();//查询所有部门列表数据
  getToken(); //获取token
})

//获取token
const getToken = () => {
  const loginUser = JSON.parse(localStorage.getItem('loginUser'));
  if(loginUser && loginUser.token){
    token.value = loginUser.token;
  }
}
```

1\)\. 在 `src/views/emp/index.vue` 中的 `<template></template>` 添加如下代码:

```text
<!-- 第五行 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action="/api/upload"
                :headers="{'token': token}"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                >
                <img v-if="employee.image" :src="employee.image" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
```

这样，这个问题就解决了，我们打开浏览器，测试一下文件上传。我们看到，在文件上传时，在请求头中携带了token令牌。

![](</blogs/_assets/lakebook/50286f8b235d85ced93d4671.png>)

## 打包部署

到此呢，部门管理、员工管理、登录认证的功能，我们都已经完成了。 那接下来，我们就来说一下前端工程的打包部署。 前端项目最终开发完毕之后，是需要打包，然后部署在nginx服务器上运行的 。

![](</blogs/_assets/lakebook/90afd2cf6dc541ab911f0a44.png>)

### 打包

直接双击npm脚本中的 `build` 即可将项目打包，打包后的文件会出现在 `dist` 目录中。

![](</blogs/_assets/lakebook/73afe6abed03b63f521967da.png>)

### 部署

- **Nginx**

介绍：Nginx是一款轻量级的Web服务器/反向代理服务器及电子邮件（IMAP/POP3）代理服务器。其特点是占有内存少，并发能力强，在各大型互联网公司都有非常广泛的使用。

官网：[https://nginx\.org/](https://nginx.org/)

- **部署**

打包完成之后，就可以将打包后的项目，部署到 `nginx` 服务器上了，记得将nginx解压到一个没有中文不带空格的目录中 。

然后直接将 `dist` 目录中的内容，拷贝到nginx的解压目录中的 `html` 中即可 \(html目录下原有的两个文件, 可以直接删除\)。

![](</blogs/_assets/lakebook/eff39047f79ca363bdb4f1e1.png>)

然后，在nginx服务器的核心配置文件 `conf/nginx` 中，在 `http` 配置块里面 添加如下反向代理的配置：

```text
server {
    listen       80;
    server_name  localhost;
    client_max_body_size 10m;

    location / {
        root   html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
        
    location ^~ /api/ {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://localhost:8080;
    }
        
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   html;
    }
}
```

然后就可以双击 `nginx.exe` 启动项目了。 访问 http://localhost

![](</blogs/_assets/lakebook/c6c5378773ea186b8e859c83.png>)

Nginx默认占用80端口号，如果80端口号被占用，可以在nginx\.conf中修改端口号。\(netstat –ano \| findStr 80\)

Nginx服务器启动、重载、停止的相关命令：

- 启动：`nginx.exe`
- 重载：`nginx.exe -s reload`
- 停止：`nginx.exe -s stop`

通过修改内部 配置文件 nginx\.conf 可以实现 反向代理 ;

### 你的方式：用 rewrite 剥离前缀

nginx

```text
location ^~ /api/ {
    rewrite ^/api/(.*)$ /$1 break;
    proxy_pass http://localhost:8080;
}
```

效果：

text

```text
用户请求：/api/user/login
       ↓ rewrite 重写
内部转发：/user/login
       ↓ proxy_pass
后端接收：http://localhost:8080/user/login
```

### 我的方式：用 proxy\_pass 末尾 / 剥离前缀

nginx

```text
location ^~ /api/ {
    proxy_pass http://localhost:8080/;  # 注意末尾的 /
}
```

效果：

text

```text
用户请求：/api/user/login
       ↓ proxy_pass 自动剥离 /api/
后端接收：http://localhost:8080/user/login
```
