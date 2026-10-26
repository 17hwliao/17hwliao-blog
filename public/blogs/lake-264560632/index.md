### 概述

Vue（读音 /vjuː /, 类似于 view），是一款用于**构建用户界面**的**渐进式**的JavaScript**框架**（官方网站：https://cn\.vuejs\.org）。

**Vue 是一个基于 JavaScript 的声明式 UI 框架**。

底层　: JS语言编写 ;

核心 : 减少使用手动DOM的操作 ;

![](</blogs/_assets/lakebook/9d1c7def06463b20d701f0eb.png>)

在上面的这句话中呢，出现了三个词，分别是：**构建用户界面、渐进式、框架**。

前后端交互展示的都是JSON 格式 :

方便记忆 : 俩绑定的代码 :

alert\(JSON\.stringify\(person\)\); //js对象 \-\-&gt; json字符串

#### **1 \. 构建用户界面**

**vue 可以将原始数据渲染展示 \. 就是基于数据渲染出用户看到的界面 ;**

alert\(JSON\.parse\(personJson\)\.name\); //json字符串 \-\-&gt; js对象

#### **2 \. 渐进式**

渐进式中的渐进呢，字面意思就是 "循序渐进"。Vue生态中的语法呢是非常多的，比如声明式渲染、组件系统、客户端路由（VueRouter）、状态管理（Vuex、Pinia）、构建工具（Webpack、Vite）等等。

![](</blogs/_assets/lakebook/e5924269b5647eb6364310ff.png>)

所谓渐进，指的是我们使用Vue框架呢，我们不需要把所有的组件、语法全部学习完毕才可以使用Vue。 而是，我们学习一点就可以使用一点了，比如：

- 我们学习了声明式渲染，我们就可以使用Vue来构建用户界面了。
- 我们再学习了组件系统，我们就可以使用Vue中的组件，从而来复用了。
- 我们再学习了路由VueRouter，就可以使用Vue中的中的路由功能了。

也就是说，并不需要全部学习完毕就可以直接使用Vue进行开发，简化操作、提高效率了。 Vue是一个框架，但其实也是一个生态。

那由此呢，也就引出了Vue中两种常见的开发模式：

- 基于Vue提供的核心包，完成项目局部模块的改造了。
- 基于Vue提供的核心包、插件进行工程化开发，也就是做整站开发。

那上面的这两种Vue的使用形式，我们都会学习，今天我们先来学习第一种方式，就是使用Vue来完成局部模块改造。

#### **3 \. 框架**

- 框架：就是一套完整的项目解决方案，用于快速构建项目 。这是我们接触的第一个框架，那在我们后面的学习中，我们还会学习很多的java语言中的框架，那通过这些框架呢，就可以来快速开发java项目，提高开发效率。
- 优点：大大提升前端项目的开发效率 。
- 缺点：需要理解记忆框架的使用规则 。（参照官网）

### 入门程序

#### 需求

在入门程序中，最终我们需要将准备的数据 message 的值，基于Vue渲染展示在页面中，最终呈现的形式如下：

![](</blogs/_assets/lakebook/5237583f2138dd2e304fc6e6.png>)

#### 步骤

#### **1 \. 准备工作**

- 准备一个html文件，并在其中引入Vue模块 （参考官方文档，复制过来即可）【注意：模块化的js，引入时，需要设置 `type="module"`】 模块化的js \. 添加类型 model ;
- 创建Vue程序的应用实例，控制视图的元素
- 准备元素（div），交给Vue控制
- 用 creatAPP\( 其本身世界上就是一个方法 \) \(\)中实现\{ \} 实现的是对象的构建 , 数值 \+ 方法; , 实现调用 vue应用实例 , 后面接\.mount\( CSS选择器, 实现接管 \)

![](</blogs/_assets/lakebook/9266a9ed5f8b8dbc7c4036c3.png>)

#### **2 \. 数据驱动视图：**

- 准备数据。 在创建Vue应用实例的时候，传入了一个js对象，在这个js对象中，我们要定义一个data方法，这个data方法的返回值设置为Json类型的数据。
- 通过插值表达式渲染页面。 插值表达式的写法：\{\{\.\.\.\}\} , 嵌套的\{\} ;
- 只能在其中写入一个表达式;

![](</blogs/_assets/lakebook/e5778572bdf91dbf3ec302f4.png>)

#### **3 \. 实现**

```text
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue-快速入门</title>
</head>
<body>
  <div id="app">
    {{message}}
  </div>
  
  <script type="module">
    import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
    createApp({
      data(){
        return {
          message: 'Hello Vue'
        }
      }
    }).mount('#app')
  </script>
</body>
</html>
```

在上述入门程序编写时，需要注意这么几点：

- Vue中定义数据，必须通过data方法来定义，data方法返回值是一个对象，在这个对象中定义数据。
- 插值表达式中编写的变量，一定是Vue中定义的数据，如果插值表达式中编写了一个变量，但是在Vue中未定义，将会报错 。
- Vue应用实例接管的区域是 '\#app'，超出这个范围，就不受Vue控制了，所以vue的插值表达式，一定写在 `<div id="app">...</div>` 的里面 。

## Vue指令

### 概述

**指令：**指的是HTML 标签上带有 v\- 前缀的特殊属性，不同指令具有不同含义，可以实现不同的功能 。例如：v\-if，v\-for…

**形式：**

```text
<p v-xxx="....">.....</p>
```

**常见指令：**

<table class="ne-table" id="jDkEJ"><tbody><tr><td width="188"><p class="ne-p" id="uafe40613"><span class="ne-text">指令</span></p></td><td width="889"><p class="ne-p" id="u142993e1"><span class="ne-text">作用</span></p></td></tr><tr><td width="188"><p class="ne-p" id="u6504522f"><span class="ne-text">v-for</span></p></td><td width="889"><p class="ne-p" id="udb271ab1"><span class="ne-text">列表渲染，遍历容器的元素或者对象的属性</span></p></td></tr><tr><td width="188"><p class="ne-p" id="u2512ca29"><span class="ne-text">v-bind</span></p></td><td width="889"><p class="ne-p" id="u04a548c8"><span class="ne-text">为HTML标签绑定属性值，如设置 href , css样式等</span></p></td></tr><tr><td width="188"><p class="ne-p" id="u5e2cc758"><span class="ne-text">v-if/v-else-if/v-else</span></p></td><td width="889"><p class="ne-p" id="ue8628805"><span class="ne-text">条件性的渲染某元素，判定为true时渲染,否则不渲染</span></p></td></tr><tr><td width="188"><p class="ne-p" id="uc6b2ff87"><span class="ne-text">v-show</span></p></td><td width="889"><p class="ne-p" id="u8f46f982"><span class="ne-text">根据条件展示某元素，区别在于切换的是display属性的值</span></p></td></tr><tr><td width="188"><p class="ne-p" id="u35e3732b"><span class="ne-text">v-model</span></p></td><td width="889"><p class="ne-p" id="ub1ab85b6"><span class="ne-text">在表单元素上创建双向数据绑定</span></p></td></tr><tr><td width="188"><p class="ne-p" id="u0539dcd1"><span class="ne-text">v-on</span></p></td><td width="889"><p class="ne-p" id="u370a1979"><span class="ne-text">为HTML标签绑定事件</span></p></td></tr></tbody></table>

### 案例

#### 基本实现

需求：员工列表数据渲染展示 。（备注：基础代码在资料中，已经提供，导入VsCode即可）

emplist数组元素;

![](</blogs/_assets/lakebook/872bfd795255526a1ff4f47e.png>)

AI提示词（prompt）：

基于Vue3中提供的指令，渲染展示employees中的数据，并展示在页面上；

- 性别gender为1展示为男，性别为2展示为女；
- 职位job为1展示为班主任，职位为2展示为讲师，职位为3展示为学工主管，职位为4展示为教研主管，职位为5展示为咨询师；
- 其他的属性直接展示；

页面的内容如下：

\.\.\.\.\.

生成后的代码如下：

```text
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tlias智能学习辅助系统</title>
    <style>
      body {
        margin: 0;
      }

      /* 顶栏样式 */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #c2c0c0;
        padding: 20px 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      
      /* 加大加粗标题 */
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      }

      /* 文本链接样式 */
      .header a {
        text-decoration: none;
        color: #333;
        font-size: 16px;
      }

      /* 搜索表单区域 */
      .search-form {
        display: flex;
        align-items: center;
        padding: 20px;
        background-color: #f9f9f9;
      }

      /* 表单控件样式 */
      .search-form input[type="text"], .search-form select {
        margin-right: 10px;
        padding: 10px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        width: 26%;
      }

      /* 按钮样式 */
      .search-form button {
        padding: 10px 15px;
        margin-left: 10px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      /* 清空按钮样式 */
      .search-form button.clear {
        background-color: #6c757d;
      }

      .table {
         min-width: 100%; 
         border-collapse: collapse;
      }

      /* 设置表格单元格边框 */
      .table td, .table th { 
        border: 1px solid #ddd; 
        padding: 8px; 
        text-align: center;
      }
      
      .avatar { 
        width: 30px; 
        height: 30px; 
        object-fit: cover; 
        border-radius: 50%; 
      }

      /* 页脚版权区域 */
    .footer {
        background-color: #c2c0c0;
        color: white;
        text-align: center;
        padding: 10px 0;
        margin-top: 30px;
    }

    .footer .company-name {
        font-size: 1.1em;
        font-weight: bold;
    }

    .footer .copyright {
        font-size: 0.9em;
    }

    #container {
      width: 80%;
      margin: 0 auto;
    }
    </style>
</head>
<body>
    
  <div id="container">
    <!-- 顶栏 -->
    <div class="header">
      <h1>Tlias智能学习辅助系统</h1>
      <a href="#">退出登录</a>
    </div>

    <!-- 搜索表单区域 -->
    <form class="search-form" action="#" method="post">
      <input type="text" name="name" placeholder="姓名" />
      <select name="gender">
          <option value="">性别</option>
          <option value="1">男</option>
          <option value="2">女</option>
      </select>
      <select name="job">
          <option value="">职位</option>
          <option value="1">班主任</option>
          <option value="2">讲师</option>
          <option value="3">学工主管</option>
          <option value="4">教研主管</option>
          <option value="5">咨询师</option>
      </select>
      <button type="submit">查询</button>
      <button type="reset" class="clear">清空</button>
    </form>

    <table class="table table-striped table-bordered">
      <thead>
          <tr>
              <th>姓名</th>
              <th>性别</th>
              <th>头像</th>
              <th>职位</th>
              <th>入职日期</th>
              <th>最后操作时间</th>
              <th>操作</th>
          </tr>
      </thead>
      <tbody>
        <tr v-for="(emp, index) in empList" :key="index">
          <td>{{ emp.name }}</td>
          <td>{{ emp.gender === 1 ? '男' : '女' }}</td>
          <td><img :src="emp.image" alt="{{ emp.name }}" class="avatar"></td>
          <td>{{ emp.job === '1' ? '班主任' : (emp.job === '2' ? '讲师' : (emp.job === '3' ? '学工主管' : (emp.job === '4' ? '教研主管' : (emp.job === '5' ? '咨询师' : '未知')))) }}</td>
          <td>{{ emp.entrydate }}</td>
          <td>{{ emp.updatetime }}</td>
          <td class="btn-group">
            <button class="edit">编辑</button>
            <button class="delete">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 页脚版权区域 -->
    <footer class="footer">
      <p class="company-name">江苏传智播客教育科技股份有限公司</p>
      <p class="copyright">版权所有 Copyright 2006-2024 All Rights Reserved</p>
    </footer>

    <script type="module">
      import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
      createApp({
        data() {
          return {
            empList: [
              { "id": 1,
                "name": "谢逊",
                "image": "https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/4.jpg",
                "gender": 1,
                "job": "1",
                "entrydate": "2023-06-09",
                "updatetime": "2024-07-30T14:59:38"
              },
              {
                "id": 2,
                "name": "韦一笑",
                "image": "https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/1.jpg",
                "gender": 1,
                "job": "1",
                "entrydate": "2020-05-09",
                "updatetime": "2023-07-01T00:00:00"
              },
              {
                "id": 3,
                "name": "黛绮丝",
                "image": "https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/2.jpg",
                "gender": 2,
                "job": "2",
                "entrydate": "2021-06-01",
                "updatetime": "2023-07-01T00:00:00"
              }
            ]
          }
        }
      }).mount('#container')
    </script>

  </div>

</body>
</html>
```

最终页面展示效果：

![](</blogs/_assets/lakebook/3395bd95671a72ca5c6bb89e.png>)

#### 指令详解

##### v\-for

**作用：**列表渲染，遍历容器的元素或者对象的属性\( 主要针对于数组 \)

**语法：**`<tr v-for="(item,index) in items" :key="item.id">{{item}}</tr>`

**&lt;其中使用 index 的下标元素是从0开始创建的 &gt; 需要使用时候记得要 \+ 1 ;**

**参数：**

- items 为遍历的数组
- item 为遍历出来的元素
- index 为索引/下标，从0开始 ；可以省略，省略index语法：
- `v-for = "item in items"` , 或者 \(item , pos \) 携带下标 实现定位 , 数据变化不建议使用 ;

**key：**

- 作用：给元素添加的唯一标识，便于vue进行列表项的正确排序复用，提升渲染性能
- 推荐使用id作为 key（唯一），不推荐使用 index 作为 key（下标在插入数据或删除数据的时候会变化，不对应）

**注意：遍历的数组，必须在data中定义； 要想让哪个标签遍历展示多次，就在哪个标签上使用 v\-for 指令。**

**哪个部分需要重复显示 , 就 在哪个地方使用 v\-for即可 ;**

**例如此处就是多次从empList 中不断获取到个体元素进行多次展示 , 此处就可以让 &lt;tr&gt; 多次展示 ;**

**一般用于表单主体展示中 减少多次的&lt;td&gt;设计 ;**

```html
<tbody>
        <tr v-for="(emp, index) in empList" :key="index">
          <td>{{ emp.name }}</td>
          <td>{{ emp.gender === 1 ? '男' : '女' }}</td>
          <td><img :src="emp.image" alt="{{ emp.name }}" class="avatar"></td>
          <td>{{ emp.job === '1' ? '班主任' : (emp.job === '2' ? '讲师' : (emp.job === '3' ? '学工主管' : (emp.job === '4' ? '教研主管' : (emp.job === '5' ? '咨询师' : '未知')))) }}</td>
          <td>{{ emp.entrydate }}</td>
          <td>{{ emp.updatetime }}</td>
          <td class="btn-group">
            <button class="edit">编辑</button>
            <button class="delete">删除</button>
          </td>
        </tr>
      </tbody>
```

##### v\-bind

作用：动态为HTML标签绑定属性值，如设置href，src，style样式等。

语法：`v-bind:属性名="属性值"``<img` `v-bind:src="item.image"` `width="30px">`

简化：`:属性名="属性值"``<img` `:``src="item.image" width="30px">`

**注意：v\-bind 所绑定的数据，必须在data中定义/或基于data中定义的数据而来。**

##### v\-if &amp; v\-show

两者使用的场景区别 : 主要看标签的显示和隐藏操作的使用频率如何 ;

**作用：**这两类指令，都是用来控制元素的显示与隐藏的 , 但是渲染的控制完全不一样 ;

**v\-if：**

- **语法：****只要满足条件的时候才会启用渲染显示 , 注 : 内部并未全部实现渲染 , 无法切换数据来实现显示 ;**
- **v\-if\="表达式"，表达式值为 true，显示；false，隐藏**
- **原理：基于条件判断，来控制创建或移除元素节点（条件渲染）**
- **场景：要么显示，要么不显示，不频繁切换的场景**
- **其它：可以配合 v\-else\-if / v\-else 进行链式调用条件判断**

**示例：**

```text
<!-- 基于v-if/v-else-if/v-else指令来展示职位这一列 -->
  <td>
    <span v-if="emp.job === '1'">班主任</span>
    <span v-else-if="emp.job === '2'">讲师</span>
    <span v-else-if="emp.job === '3'">学工主管</span>
    <span v-else-if="emp.job === '4'">教研主管</span>
    <span v-else-if="emp.job === '5'">咨询师</span>
    <span v-else>其他</span>
  </td>
```

**注意：v\-else\-if必须出现在v\-if之后，可以出现多个； v\-else 必须出现在v\-if/v\-else\-if之后 。**

**通过浏览器的开发者工具，我们可以看到如果使用** `v-if` **指令来渲染展示，确实是根据条件判断，是否渲染这个元素节点，条件成立才会渲染。查看结果如下：**

![](</blogs/_assets/lakebook/0212e5bcc1c4ebc0c629e72b.png>)

**v\-show：**

- **语法：v\-show\="表达式"，表达式值为 true，显示；false，隐藏**
- **原理：****不管是啥都会实现渲染 , 可以实现快速切换元素显示不显示**
- **但显示是基于CSS样式display来控制显示与隐藏**
- **场景：频繁切换显示隐藏的场景 : \(*****多见于JS鼠标交互显示可选项*** **\) ;**

**示例：**

```text
<!-- 基于v-show指令来展示职位这一列 -->
<td>
    <span v-show="emp.job === '1'">班主任</span>
    <span v-show="emp.job === '2'">讲师</span>
    <span v-show="emp.job === '3'">学工主管</span>
    <span v-show="emp.job === '4'">教研主管</span>
    <span v-show="emp.job === '5'">咨询师</span>
</td>
```

**通过浏览器的开发者工具，我们可以看到如果使用** `v-show` **指令来渲染展示，所有元素都会渲染，只不过是通过控制display这个css样式，来决定元素是展示还是隐藏。查看结果如下：**

![](</blogs/_assets/lakebook/1f216c4ea1b90c2d5628e6b9.png>)

##### v\-model

实现数据的双向绑定 ;

- **作用：在表单元素上使用，****双向数据绑定****。可以方便的** **获取** **或** **设置** **表单项数据**
- **语法：**`v-model="变量名"`
- **这里的双向数据绑定，是指 Vue中的数据变化，会影响视图中的数据展示 。 视图中的输入的数据变化，也会影响Vue的数据模型 。**

![](</blogs/_assets/lakebook/409f5ef7c3b1e54effe3de7d.png>)

**注意：v\-model 中绑定的变量，必须在data中定义。**

- **为员工列表案例的搜索栏的表单项，绑定数据：**

```text
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tlias智能学习辅助系统</title>
    <style>
      body {
        margin: 0;
      }

      /* 顶栏样式 */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #c2c0c0;
        padding: 20px 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      
      /* 加大加粗标题 */
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      }

      /* 文本链接样式 */
      .header a {
        text-decoration: none;
        color: #333;
        font-size: 16px;
      }

      /* 搜索表单区域 */
      .search-form {
        display: flex;
        align-items: center;
        padding: 20px;
        background-color: #f9f9f9;
      }

      /* 表单控件样式 */
      .search-form input[type="text"], .search-form select {
        margin-right: 10px;
        padding: 10px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        width: 26%;
      }

      /* 按钮样式 */
      .search-form button {
        padding: 10px 15px;
        margin-left: 10px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      /* 清空按钮样式 */
      .search-form button.clear {
        background-color: #6c757d;
      }

      .table {
         min-width: 100%; 
         border-collapse: collapse;
      }

      /* 设置表格单元格边框 */
      .table td, .table th { 
        border: 1px solid #ddd; 
        padding: 8px; 
        text-align: center;
      }
      
      .avatar { 
        width: 30px; 
        height: 30px; 
        object-fit: cover; 
        border-radius: 50%; 
      }

      /* 页脚版权区域 */
    .footer {
        background-color: #c2c0c0;
        color: white;
        text-align: center;
        padding: 10px 0;
        margin-top: 30px;
    }

    .footer .company-name {
        font-size: 1.1em;
        font-weight: bold;
    }

    .footer .copyright {
        font-size: 0.9em;
    }

    #container {
      width: 80%;
      margin: 0 auto;
    }
    </style>
</head>
<body>
    
  <div id="container">
    <!-- 顶栏 -->
    <div class="header">
      <h1>Tlias智能学习辅助系统</h1>
      <a href="#">退出登录</a>
    </div>

    <!-- 搜索表单区域 -->
    <form class="search-form" action="#" method="post">
      <input type="text" name="name" placeholder="姓名" v-model="searchEmp.name" />
      <select name="gender" v-model="searchEmp.gender">
          <option value="">性别</option>
          <option value="1">男</option>
          <option value="2">女</option>
      </select>
      <select name="job" v-model="searchEmp.job">
          <option value="">职位</option>
          <option value="1">班主任</option>
          <option value="2">讲师</option>
          <option value="3">学工主管</option>
          <option value="4">教研主管</option>
          <option value="5">咨询师</option>
      </select>
      <button type="submit">查询</button>
      <button type="reset" class="clear">清空</button>
    </form>

    <table class="table table-striped table-bordered">
      <thead>
          <tr>
              <th>姓名</th>
              <th>性别</th>
              <th>头像</th>
              <th>职位</th>
              <th>入职日期</th>
              <th>最后操作时间</th>
              <th>操作</th>
          </tr>
      </thead>
      <tbody>
        <tr v-for="(emp, index) in empList" :key="index">
          <td>{{ emp.name }}</td>
          <td>{{ emp.gender === 1 ? '男' : '女' }}</td>
          <td><img :src="emp.image" class="avatar"></td>
          <td>
            <span v-if="emp.job === '1'">班主任</span>
            <span v-else-if="emp.job === '2'">讲师</span>
            <span v-else-if="emp.job === '3'">学工主管</span>
            <span v-else-if="emp.job === '4'">教研主管</span>
            <span v-else-if="emp.job === '5'">咨询师</span>
          </td>
          <td>{{ emp.entrydate }}</td>
          <td>{{ emp.updatetime }}</td>
          <td class="btn-group">
            <button class="edit">编辑</button>
            <button class="delete">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 页脚版权区域 -->
    <footer class="footer">
      <p class="company-name">江苏传智播客教育科技股份有限公司</p>
      <p class="copyright">版权所有 Copyright 2006-2024 All Rights Reserved</p>
    </footer>

    <script type="module">
      import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
      createApp({
        data() {
          return {
            searchEmp: {
              name: '',
              gender: '',
              job: ''
            },
            empList: [
              { "id": 1,
                "name": "谢逊",
                "image": "https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/4.jpg",
                "gender": 1,
                "job": "1",
                "entrydate": "2023-06-09",
                "updatetime": "2024-07-30T14:59:38"
              },
              {
                "id": 2,
                "name": "韦一笑",
                "image": "https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/1.jpg",
                "gender": 1,
                "job": "1",
                "entrydate": "2020-05-09",
                "updatetime": "2023-07-01T00:00:00"
              },
              {
                "id": 3,
                "name": "黛绮丝",
                "image": "https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/2.jpg",
                "gender": 2,
                "job": "2",
                "entrydate": "2021-06-01",
                "updatetime": "2023-07-01T00:00:00"
              }
            ]
          }
        }
      }).mount('#container')
    </script>

  </div>

</body>
</html>
```

##### **v\-on 直接使用 @替代掉就行 ;**

作用：为html标签绑定事件（添加时间监听）

语法：

- `v-on:事件名="方法名"` : v\-on:click\="\.\.\." / @click\="\.\.\."
- 简写为 `@事件名="…"`
- `<input type="button" value="点我一下试试" v-on:click="handle">`
- `<input type="button" value="点我一下试试" @click="handle">`

这里的handle函数，就需要在Vue应用实例创建的时候创建出来，在methods定义。

![](</blogs/_assets/lakebook/db381baf1ebbeb9dd9ab2d59.png>)

- 为员工列表案例的搜索栏中的查询 和 清空按钮绑定事件：

```text
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tlias智能学习辅助系统</title>
    <style>
      body {
        margin: 0;
      }

      /* 顶栏样式 */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #c2c0c0;
        padding: 20px 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      
      /* 加大加粗标题 */
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      }

      /* 文本链接样式 */
      .header a {
        text-decoration: none;
        color: #333;
        font-size: 16px;
      }

      /* 搜索表单区域 */
      .search-form {
        display: flex;
        align-items: center;
        padding: 20px;
        background-color: #f9f9f9;
      }

      /* 表单控件样式 */
      .search-form input[type="text"], .search-form select {
        margin-right: 10px;
        padding: 10px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        width: 26%;
      }

      /* 按钮样式 */
      .search-form button {
        padding: 10px 15px;
        margin-left: 10px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      /* 清空按钮样式 */
      .search-form button.clear {
        background-color: #6c757d;
      }

      .table {
         min-width: 100%; 
         border-collapse: collapse;
      }

      /* 设置表格单元格边框 */
      .table td, .table th { 
        border: 1px solid #ddd; 
        padding: 8px; 
        text-align: center;
      }
      
      .avatar { 
        width: 30px; 
        height: 30px; 
        object-fit: cover; 
        border-radius: 50%; 
      }

      /* 页脚版权区域 */
    .footer {
        background-color: #c2c0c0;
        color: white;
        text-align: center;
        padding: 10px 0;
        margin-top: 30px;
    }

    .footer .company-name {
        font-size: 1.1em;
        font-weight: bold;
    }

    .footer .copyright {
        font-size: 0.9em;
    }

    #container {
      width: 80%;
      margin: 0 auto;
    }
    </style>
</head>
<body>
    
  <div id="container">
    <!-- 顶栏 -->
    <div class="header">
      <h1>Tlias智能学习辅助系统</h1>
      <a href="#">退出登录</a>
    </div>
    
    <!-- 搜索表单区域 -->
    <form class="search-form">
      <input type="text" name="name" placeholder="姓名" v-model="searchEmp.name" />
      <select name="gender" v-model="searchEmp.gender">
          <option value="">性别</option>
          <option value="1">男</option>
          <option value="2">女</option>
      </select>
      <select name="job" v-model="searchEmp.job">
          <option value="">职位</option>
          <option value="1">班主任</option>
          <option value="2">讲师</option>
          <option value="3">学工主管</option>
          <option value="4">教研主管</option>
          <option value="5">咨询师</option>
      </select>
      <button type="button" @click="search">查询</button>
      <button type="button" @click="clear">清空</button>
    </form>

    <table class="table table-striped table-bordered">
      <thead>
          <tr>
              <th>姓名</th>
              <th>性别</th>
              <th>头像</th>
              <th>职位</th>
              <th>入职日期</th>
              <th>最后操作时间</th>
              <th>操作</th>
          </tr>
      </thead>
      <tbody>
        <tr v-for="(emp, index) in empList" :key="index">
          <td>{{ emp.name }}</td>
          <td>{{ emp.gender === 1 ? '男' : '女' }}</td>
          <td><img :src="emp.image" alt="{{ emp.name }}" class="avatar"></td>
          <td>
            <span v-if="emp.job === '1'">班主任</span>
            <span v-else-if="emp.job === '2'">讲师</span>
            <span v-else-if="emp.job === '3'">学工主管</span>
            <span v-else-if="emp.job === '4'">教研主管</span>
            <span v-else-if="emp.job === '5'">咨询师</span>
          </td>
          <td>{{ emp.entrydate }}</td>
          <td>{{ emp.updatetime }}</td>
          <td class="btn-group">
            <button class="edit">编辑</button>
            <button class="delete">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 页脚版权区域 -->
    <footer class="footer">
      <p class="company-name">江苏传智播客教育科技股份有限公司</p>
      <p class="copyright">版权所有 Copyright 2006-2024 All Rights Reserved</p>
    </footer>

    <script type="module">
      import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
      createApp({
        data() {
          return {
            searchEmp: {
              name: '',
              gender: '',
              job: ''
            },
            empList: [
              { "id": 1,
                "name": "谢逊",
                "image": "https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/4.jpg",
                "gender": 1,
                "job": "1",
                "entrydate": "2023-06-09",
                "updatetime": "2024-07-30T14:59:38"
              },
              {
                "id": 2,
                "name": "韦一笑",
                "image": "https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/1.jpg",
                "gender": 1,
                "job": "1",
                "entrydate": "2020-05-09",
                "updatetime": "2023-07-01T00:00:00"
              },
              {
                "id": 3,
                "name": "黛绮丝",
                "image": "https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/2.jpg",
                "gender": 2,
                "job": "2",
                "entrydate": "2021-06-01",
                "updatetime": "2023-07-01T00:00:00"
              }
            ]
          }
        },
        methods: {
          search() {
            console.log(this.searchEmp)
          },
          clear() {
            this.searchEmp = {
              name: '',
              gender: '',
              job: ''
            }
          }
        }
      }).mount('#container')
    </script>

  </div>

</body>
</html>
```

**注意： methods函数中的this指向Vue实例，可以通过this获取到data中定义的数据。**

## vue的生命周期：指的是vue对象从创建到销毁的过程。

有8 个 生命周期的钩子方法 ;

vue的生命周期包含8个阶段：每触发一个生命周期事件，会自动执行一个生命周期方法，这些生命周期方法也被称为钩子方法。其完整的生命周期如下图所示：

只需要也必修掌握的一个生命周期钩子方法 : 此生命钩子方法 \=&gt; 实现的是挂载完, vue实例创建完成 ;

```text
 , mounted(){
控制台输出; 
} 
```

\}\} \. mount\(挂载的 CSS 选择器 \) ;

<table class="ne-table" id="oSBDD"><tbody><tr><td width="205"><p class="ne-p" id="u916eb65e"><strong><span class="ne-text">状态</span></strong></p></td><td width="796"><p class="ne-p" id="u3a4d39ba"><strong><span class="ne-text">阶段周期</span></strong></p></td></tr><tr><td width="205"><p class="ne-p" id="u2672c27b"><span class="ne-text">beforeCreate</span></p></td><td width="796"><p class="ne-p" id="u8531dc21"><span class="ne-text">创建前</span></p></td></tr><tr><td width="205"><p class="ne-p" id="u4ad5db50"><span class="ne-text">created</span></p></td><td width="796"><p class="ne-p" id="u291159bc"><span class="ne-text">创建后</span></p></td></tr><tr><td width="205"><p class="ne-p" id="u04458bbf"><span class="ne-text">beforeMount</span></p></td><td width="796"><p class="ne-p" id="u4b41b7c2"><span class="ne-text">挂载前</span></p></td></tr><tr><td width="205"><p class="ne-p" id="uc3f21056"><span class="ne-text">mounted</span></p></td><td width="796"><p class="ne-p" id="uf1bf3fdd"><span class="ne-text">挂载完成</span></p></td></tr><tr><td width="205"><p class="ne-p" id="ubeaa389d"><span class="ne-text">beforeUpdate</span></p></td><td width="796"><p class="ne-p" id="u6d1a43e2"><span class="ne-text">更新前</span></p></td></tr><tr><td width="205"><p class="ne-p" id="u752ba7e2"><span class="ne-text">updated</span></p></td><td width="796"><p class="ne-p" id="u6abd3674"><span class="ne-text">更新后</span></p></td></tr><tr><td width="205"><p class="ne-p" id="uc5141a2c"><span class="ne-text">beforeDestroy</span></p></td><td width="796"><p class="ne-p" id="ua4eee37d"><span class="ne-text">销毁前</span></p></td></tr><tr><td width="205"><p class="ne-p" id="ucd5e2005"><span class="ne-text">destroyed</span></p></td><td width="796"><p class="ne-p" id="u5ffeb2ec"><span class="ne-text">销毁后</span></p></td></tr></tbody></table>

下图是 Vue 官网提供的从创建 Vue 到效果 Vue 对象的整个过程及各个阶段对应的钩子函数：

![](</blogs/_assets/lakebook/4a975b038beda5145bf634ca.png>)

其中我们需要重点关注的是mounted，其他的我们了解即可。

mounted：挂载完成，Vue初始化成功，HTML页面渲染成功。**以后我们一般用于页面初始化自动的ajax请求后台数据**

## **Vue 框架引入**

#### 实现对之前 的 JS 操作实现简化框架 ;

#### 先实现一个createAPP 导入 , 创建一个createAPP\{\} 实例对象 ;

#### 后缀使用\.mounted\(CSS选择器\) , 实现 挂载到DOM树上 , **Vue 就接管并操控那个标签内部的所有内容**

### **Vue的使用教程 :**

**创建一个**

**内部的data 方法 , 内部放入**

**内部的empList 元素 要求 : 必须要实现以 JSON 格式的字符串 \{内部是键值对\} ;**

**empList: \[ \{单个元素\} , \{\} \] ;**

```text
data() {
  return {
    // ✅ 正确：empList 是数组，内部是 JSON 对象（键值对）
    empList: [
      { "id": 1, "name": "谢逊", "gender": 1, "job": "1" },
      { "id": 2, "name": "韦一笑", "gender": 1, "job": "1" }
    ]
  }
}
```

**其他的方法 : 可以直接放置在一个块级创建方法组 :**

**methods\{**

**内部实现其他方法 ;**

**\}**

```text
methods: {
  search() {
    console.log(this.searchEmp)  // ✅ 通过 this 访问 data 中的数据
  },
  clear() {
    this.searchEmp = { name: '', gender: '', job: '' }  // ✅ 修改数据
  }
}
```

**使用\.mounted\(\) 后缀链接到了HTML 标签之后 开始对应的操作 ;****createApp\(\{ \.\.\. \}\)\.mount\('\#container'\) // 挂载后，Vue 接管 \#container 内部**

**对原 HTML 元素实现数据操作 和 相关的方法调用 ;**

**使用 v\-for 实现元素的放置 , 按照元素的格式 ;**

```text
<div id="container">
  <table>
    <tr v-for="emp in empList" :key="emp.id">
      <td>{{ emp.name }}</td>           <!-- ✅ 调取内部数据 -->
      <td>{{ emp.gender === 1 ? '男' : '女' }}</td>  <!-- ✅ 放表达式 -->
    </tr>
  </table>
</div>
```

**对于 v\-for 的单个元素 :**

**调用内部数据时 : \{\{ 调取内部的各种数据和方法 \}\} ; 可以放入表达式 ;**

**v\-model : 实现双向绑定 ;**

```text
<!-- 输入框变化 → data 变化 → 其他地方自动更新 -->
<input v-model="searchEmp.name" placeholder="姓名">
<p>你输入的是：{{ searchEmp.name }}</p>  <!-- 实时同步 -->
```

```text
data() {
  return {
    searchEmp: { name: '', gender: '', job: '' }  // 绑定的模板
  }
}
```

**链接到data 中的模板后 实现数据同步 , 一般都是对两个板子内部的元素一一对应实现链接:**

**对于 creatApp 对象中的 methods 中方法 实现都是正对 data 中的模板进行操作 ;**

**Vue 挂载的标签内部，任何元素都可以直接使用** `@事件类型` **来添加事件监听**

```text
<button @click="search">搜索</button>   <!-- ✅ 调用 methods 中的方法 -->
<button @click="clear">清空</button>
```

**格式 &lt;\.\.\. @click \= "对象中实现的方法"&gt; ;**
