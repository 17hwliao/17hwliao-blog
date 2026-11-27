## 在HTML中调用Css

着重掌握在设置class , id 钩子实现使用 CSS 选择器 就行, 具体样式实现 使用 Ai 配置即可;

#### &lt;记得编写的标签是 &lt;style&gt; &gt; ;

那在HTML的文件中，我们如何来编写CSS样式呢，此时就涉及到CSS的三种引入方式。

具体有3种引入方式，语法如下表格所示：

<table class="ne-table" id="TVlzn"><tbody><tr><td width="105"><p class="ne-p" id="u81a22991"><span class="ne-text">名称</span></p></td><td width="398"><p class="ne-p" id="u5f23b89b"><span class="ne-text">语法描述</span></p></td><td width="570"><p class="ne-p" id="ub2e761d6"><span class="ne-text">示例</span></p></td></tr><tr><td width="105"><p class="ne-p" id="uf00ea840"><span class="ne-text">行内样式</span></p></td><td width="398"><p class="ne-p" id="udfe14e01"><span class="ne-text">在标签内使用style属性，属性值是css属性键值对。</span></p></td><td width="570"><p class="ne-p" id="ud6e3b713"><span class="ne-text">&lt;h1 style="xxx:xxx;"&gt;中国新闻网&lt;/h1&gt;</span></p></td></tr><tr><td width="105"><p class="ne-p" id="u66493c38"><span class="ne-text">内部样式</span></p></td><td width="398"><p class="ne-p" id="u67a9a70d"><span class="ne-text">定义&lt;style&gt;标签，在标签内部定义css样式。</span></p></td><td width="570"><p class="ne-p" id="ub837337a"><span class="ne-text">&lt;style&gt; h1 {...} &lt;/style&gt;</span></p></td></tr><tr><td width="105"><p class="ne-p" id="u71c0e903"><span class="ne-text">外部样式</span></p></td><td width="398"><p class="ne-p" id="ubb1e1323"><span class="ne-text">定义&lt;link&gt;标签，通过href属性引入外部css文件</span></p></td><td width="570"><p class="ne-p" id="u0903f9a6"><span class="ne-text">&lt;link rel="stylesheet" href="css/news.css"&gt;</span></p></td></tr></tbody></table>

对于上述3种引入方式，企业开发的使用情况如下：

- **行内样式：**会出现大量的代码冗余，不方便后期的维护，所以不常用（常配合JS使用）。
- **内部样式****：**通过定义css选择器，让样式作用于当前页面的指定的标签上。（可以写在页面任何位置，但通常约定写在head标签中）
- **外部样式：**html和css实现了完全的分离，企业开发常用方式。

采用内部样式, 选定需要修改的标签类型, 该种标签全部样式都会被修改 , 想更精进的化, 设置别名直接选择特定的转化格式 即可;

采用外部引入 :

&lt;link rel\="stylesheet" href\="style\.css"&gt;

stylesheet 样式表 : 表示要引入的是css\( 层叠样式表 \) ;

##### 颜色表示方式

在前端程序开发中，颜色的表示方式常见的有如下三种：

<table class="ne-table" id="PxdvA"><tbody><tr><td width="140"><p class="ne-p" id="ufcc6a6c9"><span class="ne-text">表示方式</span></p></td><td width="152"><p class="ne-p" id="u6c6392c7"><span class="ne-text">属性值</span></p></td><td width="334"><p class="ne-p" id="u1ee4828f"><span class="ne-text">说明</span></p></td><td width="492"><p class="ne-p" id="u00b9b87b"><span class="ne-text">取值</span></p></td></tr><tr><td width="140"><p class="ne-p" id="ub5227f80"><span class="ne-text">关键字</span></p></td><td width="152"><p class="ne-p" id="ud0a0b416"><span class="ne-text">color : 颜色英文单词</span></p></td><td width="334"><p class="ne-p" id="u225cb2cd"><span class="ne-text">red、green、blue</span></p></td><td width="492"><p class="ne-p" id="u74fb8df6"><span class="ne-text">red、green、blue...</span></p></td></tr><tr><td width="140"><p class="ne-p" id="u3b2282b4"><span class="ne-text">rgb表示法</span></p></td><td width="152"><p class="ne-p" id="uea07617e"><span class="ne-text">color : rgb(r, g, b)</span></p></td><td width="334"><p class="ne-p" id="udb13785e"><span class="ne-text">红绿蓝三原色，每项取值范围：0-255</span></p></td><td width="492"><p class="ne-p" id="uf71d4551"><span class="ne-text">rgb(0,0,0)、rgb(255,255,255)、rgb(255,0,0)</span></p></td></tr><tr><td width="140"><p class="ne-p" id="u140d3819"><span class="ne-text">rgba表示法</span></p></td><td width="152"><p class="ne-p" id="u32a36e50"><span class="ne-text">color : rgba(r, g, b, a)</span></p></td><td width="334"><p class="ne-p" id="ud1724f40"><span class="ne-text">红绿蓝三原色，a表示透明度，取值：0-1</span></p></td><td width="492"><p class="ne-p" id="u2887cbcd"><span class="ne-text">rgb(0,0,0,0.3)、rgb(255,255,255,0.5)</span></p></td></tr><tr><td width="140"><p class="ne-p" id="ue5cb18f9"><span class="ne-text">十六进制表示法</span></p></td><td width="152"><p class="ne-p" id="uacf33e3e"><span class="ne-text">color : #rrggbb</span></p></td><td width="334"><p class="ne-p" id="u667947a1"><span class="ne-text">#开头，将数字转换成十六进制表示</span></p></td><td width="492"><p class="ne-p" id="u419ba775"><span class="ne-text">#000000、#ff0000、#cccccc，简写：#000、#ccc</span></p></td></tr></tbody></table>

rgba : 单纯在rgb 基础上添加了一项透明度 : color : rgba\( \)

```text
color: #FFFFFF;  /* 白色 */
color: #000000;  /* 黑色 */
```

使用截图Snipaste 可以使用shift 直接转化 rgb 模式和十六进制下 模式 ; 使用 c 键快捷获取到颜色 ;

##### CSS选择器

当代一般使用后代选择器 :

选取 id 号下的元素标签 ;

使用CSS 层叠样式表 : 实现规范标签内容的格式　：

1\.采用类选择器 : 在标签后面加上 class \= " " ;

2\.采用ID 选择器 ; 在标签后面加上 id \= " " ;

3\.对于 id , class 内部编写的标签 ; 使用 \.id号 标签名 / \#class类名 标签名;

```text
<style>
        //实现类选择器 ; 
        /* 第一个div的样式 */
        .div1 h1 {
            color: red;
            font-family: '微软雅黑';
            font-size: 20px;
            background-color: #ffeeee;
            padding: 10px;
            margin: 10px;
        }
        
        /* 第二个div的样式 */
        .div2 {
            color: blue;
            font-family: '微软雅黑';
            font-size: 16px;
            background-color: #eeeeff;
            padding: 10px;
            margin: 10px;
            border: 2px solid blue;
          //实现ID选择器 ;
            #time{
            color : 控制颜色类型
            }
        }
    </style>
</head>
<body>
    <div class="div1">
        <h1> shis <h1>
        ws is gay<br>
        is that true<br>
        of course
    </div>
    
    <div class="div2">
        这是第二个div<br>
        有不同的样式<br>
        蓝色文字，蓝色边框
    </div>
```

顾名思义：选择器是选取需设置样式的元素（标签），但是我们根据业务场景不同，选择的标签的需求也是多种多样的，所以选择器有很多种。

**选择器通用语法如下**：

```text
选择器名   {
    css样式名：css样式值;
    css样式名：css样式值;
}
```

而我们是做后台开发的，所以对于css选择器，我们只学习常见的这几种：

<table class="ne-table" id="h5Jvs"><tbody><tr><td width="105"><p class="ne-p" id="u9894b3b7"><span class="ne-text">选择器</span></p></td><td width="226"><p class="ne-p" id="u6049bd78"><span class="ne-text">写法</span></p></td><td width="177"><p class="ne-p" id="ue64c33ce"><span class="ne-text">示例</span></p></td><td width="557"><p class="ne-p" id="u1d2b9fde"><span class="ne-text">示例说明</span></p></td></tr><tr><td width="105"><p class="ne-p" id="u61e690d7"><span class="ne-text">元素选择器</span></p></td><td width="226"><p class="ne-p" id="u384a8f7f"><span class="ne-text">元素名称 {...}</span></p></td><td width="177"><p class="ne-p" id="u427d9178"><span class="ne-text">h1 {...}</span></p></td><td width="557"><p class="ne-p" id="ua66fc30b"><span class="ne-text">选择页面上所有的&lt;h1&gt;标签</span></p></td></tr><tr><td width="105"><p class="ne-p" id="u37db5d61"><span class="ne-text">类选择器</span></p></td><td width="226"><p class="ne-p" id="u77487604"><span class="ne-text">.class属性值 {...}</span></p></td><td width="177"><p class="ne-p" id="udbcfefa5"><span class="ne-text">.cls {...}</span></p></td><td width="557"><p class="ne-p" id="u6e9c9315"><span class="ne-text">选择页面上所有class属性为cls的标签</span></p></td></tr><tr><td width="105"><p class="ne-p" id="u49e3db4f"><span class="ne-text">id选择器</span></p></td><td width="226"><p class="ne-p" id="uf3861ee9"><span class="ne-text">#id属性值 {...}</span></p></td><td width="177"><p class="ne-p" id="u0536a2cd"><span class="ne-text">#hid {...}</span></p></td><td width="557"><p class="ne-p" id="uf6881096"><span class="ne-text">选择页面上id属性为hid的标签</span></p></td></tr><tr><td width="105"><p class="ne-p" id="uc6a6d682"><span class="ne-text">前三个重点了解  ; </span></p></td><td width="226"><p class="ne-p" id="uc0301e8c"><span class="ne-text"></span></p></td><td width="177"><p class="ne-p" id="u6f32aceb"><span class="ne-text"></span></p></td><td width="557"><p class="ne-p" id="ucfeefe94"><span class="ne-text"></span></p></td></tr><tr><td width="105"><p class="ne-p" id="u14ccda0c"><span class="ne-text">分组选择器</span></p></td><td width="226"><p class="ne-p" id="udf26a400"><span class="ne-text">选择器1,选择器2{...}</span></p></td><td width="177"><p class="ne-p" id="u996cd529"><span class="ne-text">h1,h2 {...}</span></p></td><td width="557"><p class="ne-p" id="ue91ea388"><span class="ne-text">选择页面上所有的&lt;h1&gt;和&lt;h2&gt;标签</span></p></td></tr><tr><td rowspan="2" width="105"><p class="ne-p" id="u2d437876"><span class="ne-text">属性选择器</span></p></td><td width="226"><p class="ne-p" id="u1e260fc4"><span class="ne-text">元素名称[属性] {...}</span></p></td><td width="177"><p class="ne-p" id="u7c331801"><span class="ne-text">input[type] {...}</span></p></td><td width="557"><p class="ne-p" id="udd9dff23"><span class="ne-text">选择页面上有type属性的&lt;input&gt;标签</span></p></td></tr><tr><td width="226"><p class="ne-p" id="u59aed2a7"><span class="ne-text">元素名称[属性名="值"] {...}</span></p></td><td width="177"><p class="ne-p" id="u163a49ac"><span class="ne-text">input[type="text"] {...}</span></p></td><td width="557"><p class="ne-p" id="u92f47170"><span class="ne-text">选择页面上type属性为text的&lt;input&gt;标签</span></p></td></tr><tr><td width="105"><p class="ne-p" id="ua7b281ab"><span class="ne-text">后代选择器</span></p></td><td width="226"><p class="ne-p" id="u0bd196d8"><span class="ne-text">元素1元素2{...}</span></p></td><td width="177"><p class="ne-p" id="ufc89a22f"><span class="ne-text">form input {...}</span></p></td><td width="557"><p class="ne-p" id="u46af913d"><span class="ne-text">选择&lt;form&gt;标签内的所有&lt;input&gt;标签</span></p></td></tr></tbody></table>

那接下来，我们需要将页面上所有的超链接中，默认的下划线效果去除掉。具体的代码实现如下：

```text
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>【新思想引领新征程】推进长江十年禁渔 谱写长江大保护新篇章</title>
  <!-- 2. 内部样式 -->
  <style>
    .publish-date {
      color: #b2b2b2;
    }
    
    /* 设置超链接取消下划线效果 */
    a {
      text-decoration: none;
    }
  </style>
  <!-- 3. 外部样式 -->
  <!-- <link rel="stylesheet" href="css/news.css"> -->
</head>
<body>

  <!-- 定义网页标题, 标题内容： 【新思想引领新征程】推进长江十年禁渔 谱写长江大保护新篇章 -->
  <h1 id="title">【新思想引领新征程】推进长江十年禁渔 谱写长江大保护新篇章</h1>
  
  <!-- 定义一个超链接, 链接地址：https://news.cctv.com/, 链接内容：央视网 -->
  <a href="https://news.cctv.com/" target="_blank">央视网</a>

  <!-- 1. 行内样式 -->
  <!-- <span style="color: #b2b2b2;">2024年05月15日 20:07</span> -->

  <span class="publish-date">2024年05月15日 20:07</span>

</body>
</html>
```

```html
     <style>
        /* 控制超链接的下划线 */
        a {
            /* 去除默认下划线 */
            text-decoration: none;
            color: blue;
        }
        /* 鼠标悬停时显示下划线 */
        a:hover {
            text-decoration: underline;
            text-decoration-color: red;
            text-decoration-style: wavy;
        }
        
        //直接自定义下划线类型;  
        .custom-underline {
            text-decoration: underline;
            text-decoration-color: red;
            text-decoration-style: dotted;
            text-decoration-thickness: 2px;
        }
        
        /* 多种下划线颜色设计示例 */
        .solid-red {
            text-decoration: underline solid red;
        }
        
        .dotted-blue {
            text-decoration: underline dotted blue;
        }
        
        .wavy-green {
            text-decoration: underline wavy green;
        }
        
        .double-purple {
            text-decoration: underline double purple;
        }
        
        .dashed-orange {
            text-decoration: underline dashed orange;
        }
    </style>
```

#### 正文排版

##### 基本实现

创建视频 , 图片标签时 , 设置大小参数 : 直接设置宽度即可 : 另外的边框大小设计会自己适配 ;

父类的判断 : 块级的标签 ;

创建的视频标签是使用 controls 利用父标签直接百分比继承大小 ;

自动播放的实际都在controls 中自己实现就行;

&lt;video src \= "\./background\.mp4" controls width \= "10%";"&gt;&lt;/video&gt;

&lt;audio src\="\./Psycho, Pt\. 2\.mp3" controls&gt;&lt;/audio&gt;

属性参数 :

**创建image的img : 一定要注意不要使用绝地路径设计文件地址 ;**

绝对路径 : 磁盘不推荐 \./ 当前目\( 可以直接省略 \) , \.\./ 上一级目录 ;

网络可以配置单开一页直接配置 ;

那在上述的正文排版中，用到了如下标签，接下来详解介绍一下：

<table class="ne-table" id="DM9Me"><tbody><tr><td width="157"><p class="ne-p" id="u8e6146c4"><strong><span class="ne-text">标签</span></strong></p></td><td width="160"><p class="ne-p" id="u9d2cd07a"><strong><span class="ne-text">作用</span></strong></p></td><td width="696"><p class="ne-p" id="u723c71c6"><strong><span class="ne-text">属性/说明</span></strong></p></td></tr><tr><td rowspan="4" width="157"><p class="ne-p" id="u0301c79b"><span class="ne-text">&lt;video&gt;</span></p></td><td rowspan="4" width="160"><p class="ne-p" id="u2d48c2bd"><span class="ne-text">视频标签</span></p></td><td width="696"><p class="ne-p" id="u8db2181f"><span class="ne-text">src：指定视频的url（绝对路径/相对路径）</span></p></td></tr><tr><td width="696"><p class="ne-p" id="ud0dc3b18"><span class="ne-text">controls：是否显示播放控件</span></p></td></tr><tr><td width="696"><p class="ne-p" id="ufa18a098"><span class="ne-text">width：宽度（像素/相对于父元素百分比）；备注: 一般width 和 height 我们只会指定一个，另外一个会自动的等比例缩放。</span></p></td></tr><tr><td width="696"><p class="ne-p" id="ub687c4de"><span class="ne-text">height：高度（像素/相对于父元素百分比）；备注: 一般width 和 height 我们只会指定一个，另外一个会自动的等比例缩放。</span></p></td></tr><tr><td width="157"><p class="ne-p" id="uc095b39f"><span class="ne-text">&lt;img&gt;</span></p></td><td width="160"><p class="ne-p" id="u55a1e9db"><span class="ne-text">图片标签</span></p></td><td width="696"><p class="ne-p" id="uc74223d8"><span class="ne-text">src, width，height</span></p></td></tr><tr><td width="157"><p class="ne-p" id="u69bf5a4a"><span class="ne-text">&lt;p&gt;</span></p></td><td width="160"><p class="ne-p" id="u717ea0ce"><span class="ne-text">段落标签</span></p></td><td width="696"></td></tr><tr><td width="157"><p class="ne-p" id="ud52d2df0"><span class="ne-text">&lt;br&gt;</span></p></td><td width="160"><p class="ne-p" id="u1993bea5"><span class="ne-text">换行标签</span></p></td><td width="696"></td></tr><tr><td width="157"><p class="ne-p" id="u005358c8"><span class="ne-text">&lt;b&gt; / </span><strong><span class="ne-text">&lt;strong&gt;</span></strong><span class="ne-text"> (两者选一就行</span></p><p class="ne-p" id="u11ceb390"><span class="ne-text">下面的相同 )</span></p><p class="ne-p" id="u21e3000b"><span class="ne-text">{建议使用加粗的 , 有强调作用(语义，对 SEO、无障碍访问、可维护性都更好) }</span></p></td><td width="160"><p class="ne-p" id="u0db0415a"><strong><span class="ne-text">加粗</span></strong></p></td><td width="696"><p class="ne-p" id="ue19cfef5"><span class="ne-text">&lt;strong&gt; 具有强调语义</span></p></td></tr><tr><td width="157"><p class="ne-p" id="u89c0e127"><span class="ne-text">&lt;u&gt; /</span><strong><span class="ne-text"> &lt;ins&gt;</span></strong></p></td><td width="160"><p class="ne-p" id="ua5fdea05"><span class="ne-text">下划线</span></p></td><td width="696"><p class="ne-p" id="u587d7826"><span class="ne-text">&lt;ins&gt; 具有强调语义</span></p></td></tr><tr><td width="157"><p class="ne-p" id="u73ed6e24"><span class="ne-text">&lt;i&gt; / </span><strong><span class="ne-text">&lt;em&gt;</span></strong></p></td><td width="160"><p class="ne-p" id="u2150da60"><em><span class="ne-text">倾斜</span></em></p></td><td width="696"><p class="ne-p" id="ua557c3cb"><span class="ne-text">&lt;em&gt; 具有强调语义</span></p></td></tr><tr><td width="157"><p class="ne-p" id="u5f742962"><span class="ne-text">&lt;s&gt; / </span><strong><span class="ne-text">&lt;del&gt;</span></strong></p></td><td width="160"><p class="ne-p" id="u0f4a7d7d"><span class="ne-text">删除线</span></p></td><td width="696"><p class="ne-p" id="uab217b83"><span class="ne-text">&lt;del&gt; 具有强调语义</span></p></td></tr></tbody></table>

在HTML页面中，我们在代码中录入空格、&lt;、&gt; 这些符号的时候，是没有对应的效果的，因为浏览器并不能准确的识别，此时，我们就需要通过字符实体来表示空格，&lt;, &gt; 。常见符号的字符实体如下：

<table class="ne-table" id="Bnn9h"><tbody><tr><td width="190"><p class="ne-p" id="u4e8c3fed"><span class="ne-text">字符实体</span></p></td><td width="880"><p class="ne-p" id="ue0dc135d"><span class="ne-text">属性/说明</span></p></td></tr><tr><td width="190"><p class="ne-p" id="ucf6680a1"><span class="ne-text">&amp;nbsp;</span></p></td><td width="880"><p class="ne-p" id="u96d40a32"><span class="ne-text">     空格 ( 实现几个直接堆叠就行 )</span></p></td></tr><tr><td width="190"><p class="ne-p" id="u774c1a2d"><span class="ne-text">&amp;lt;</span></p></td><td width="880"><p class="ne-p" id="ub3a0ba40"><span class="ne-text">     &lt;</span></p></td></tr><tr><td width="190"><p class="ne-p" id="u550361d3"><span class="ne-text">&amp;gt;</span></p></td><td width="880"><p class="ne-p" id="uab6f1498"><span class="ne-text">     &gt;</span></p></td></tr></tbody></table>

具体的css样式如下:

实现首行缩进 :首要选择 CSS选择器 设置 &lt;p&gt; 段落属性 ;

```text
/* 设置段落首行缩进 */
    p {
      text-indent: 2em; /* 首行缩进2em */
      line-height: 2; /* 行高2倍 */
    }
```

### 正文布局

将整个body 中的内容 都放置在一个div \*\(配置 id \)标签中去 ;

即创建一个盒子 ;

使用 \#id名字 : 设置外部样式 ;

### 盒子模型

- 盒子：页面中所有的元素（标签），都可以看做是一个 盒子，由盒子将页面中的元素包含在一个矩形区域内，通过盒子的视角更方便的进行页面布局。
- 盒子模型组成：内容区域（content）、内边距区域（padding）、边框区域（border）、外边距区域（margin）。

##### 布局标签

- 布局标签：实际开发网页中，会大量频繁的使用 div 和 span 这两个没有语义的布局标签。
- 标签：`<div>``<span>`
- 特点：
- `<div>`标签：//一般使用的布局标签 ;

- 一行只显示一个（独占一行）
- 宽度默认是父元素的宽度，高度默认由内容撑开
- 可以设置宽高（width、height）

- `<span>`标签：

- 一行可以显示多个
- 宽度和高度默认由内容撑开
- 不可以设置宽高（width、height）

```text
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>盒子模型</title>
    <style>
    如果想直观看出 : 可以直接设置选择 background-color ;
        div {
            box-sizing : 自己设置的宽高->指定区域的大小 ; 
            width: 200px;  /* 宽度 */
            height: 200px;  /* 高度 */
            box-sizing: border-box; /* 指定width height为盒子的高宽 */
            background-color: aquamarine; /* 背景色 */
            四个内部参数设置 : 上 , 右 , 下, 左 ; 
            两个: 上下 , 左右 ; 依然可以一个 ; 
            padding: 20px 20px 20px 20px; /* 内边距, 上 右 下 左 , 边距都一行, 可以简写: padding: 20px;*/ 
            边框线设置 : 
            border: 10px solid red; /* 边框, 宽度 线条类型 颜色 */
            外部边框 : 
            margin: 30px 30px 30px 30px; /* 外边距, 上 右 下 左 , 边距都一行, 可以简写: margin: 30px; */
        }
    </style>
</head>

<body>
        
    <div>
        A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A 
    </div>
    
</body>
</html>
```

直观解释:

### 1\. 核心尺寸与内容 \(`width` &amp; `height`\)

- `width: 200px;` **和** `height: 200px;`
- **作用：** 设定这个盒子的宽度和高度。
- **比喻：** 就像是快递箱里装的那件物品本身的大小（或者箱子原本的尺寸，具体取决于下文提到的 `box-sizing`）。

### 2\. 内边距 \(`padding`\)

- `padding: 20px;`
- **作用：** 设置内容（文字、图片等）到边框之间的内部距离。
- **比喻：** 快递箱里的**防震气泡膜**。它包裹在物品周围，保护物品不贴着纸箱内壁。气泡膜越厚，纸箱内部显得越满，但它属于纸箱内部的一部分。
- **细节：** 它可以拆分成 `padding-top` \(上\)、`padding-right` \(右\)、`padding-bottom` \(下\)、`padding-left` \(左\)。

### 3\. 边框 \(`border`\)

- `border: 10px solid red;`
- **作用：** 设置盒子的边缘线条。
- **比喻：****纸箱本身的纸板厚度**。它有厚度（10px）、样式（实线 solid）、颜色（红色 red）。这是盒子最外围的实体边界。

### 4\. 外边距 \(`margin`\)

- `margin: 30px;`
- **作用：** 设置这个盒子与其他盒子（其他标签）之间的外部距离。
- **比喻：** 快递箱和旁边其他快递箱之间的**安全距离**。它不属于纸箱本身，只负责把当前盒子和周围的元素推开，决定了盒子在网页中的摆放位置。

### 5\. 背景色 \(`background-color`\)

- `background-color: aquamarine;`
- **作用：** 设置盒子的背景颜色（这里是海蓝宝石色）。
- **注意区域：** 背景色会填满**内容区域**和**内边距 \(padding\) 区域**，直到边框的内边缘为止。外边距 \(margin\) 是透明的，不会显示背景色。

---

### 6\. 重点：盒子的计算规则 \(`box-sizing`\)

这是初学者最容易踩坑的地方，也是你代码中非常关键的一句：

- `box-sizing: border-box;`
- **作用：** 改变浏览器计算盒子总宽高的规则。

如果你**不写**这句代码，浏览器默认采用 `content-box`，这时候你会发现盒子“变胖”了：

**默认情况 \(**`content-box`**\)：** 你设置的 `width: 200px` 仅仅是里面“物品”的大小。 实际纸箱占用的宽度 \= 内容\(200\) \+ 左右防震膜\(20\+20\) \+ 左右纸板厚度\(10\+10\) \= **260px**。盒子被撑大了！

![](</blogs/_assets/lakebook/b3320cbc1c3bc03435219bb1.png>)

### [可取值](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/Properties/margin#%E5%8F%AF%E5%8F%96%E5%80%BC)

可以直接在主体中设置四个元素 :

也可以直接设置主题的不同边框的元素大小 ;

[**&lt;length&gt;**](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/Values/length)

以固定值为外边距。

[&lt;percentage&gt;](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/Values/percentage)

相对于[包含块](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Display/Containing_block)的*宽度*，以百分比值为外边距。

[auto](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/Properties/margin#auto)

让浏览器自己选择一个合适的外边距。有时，在一些特殊情况下，该值可以使元素居中。

#### [语法格式](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/Properties/margin#%E8%AF%AD%E6%B3%95%E6%A0%BC%E5%BC%8F)

```text
margin = 
  <'margin-top'>{1,4}  

<margin-top> = 
  <length-percentage>  |
  auto                 |
  <anchor-size()>      

<length-percentage> = 
  <length>      |
  <percentage>  

<anchor-size()> = 
  anchor-size( [ <anchor-name> || <anchor-size> ]? , <length-percentage>? )  

<anchor-name> = 
  <dashed-ident>  

<anchor-size> = 
  width        |
  height       |
  block        |
  inline       |
  self-block   |
  self-inline
```

此语法反映了基于 [CSS Anchor Positioning Module Level 1](https://drafts.csswg.org/css-anchor-position-1/), [CSS Box Model Module Level 4](https://drafts.csswg.org/css-box-4/), [CSS Values and Units Module Level 4](https://drafts.csswg.org/css-values-4/) 的最新标准。并非所有浏览器都已实现全部内容。有关支持信息，请参阅[浏览器兼容性](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/Properties/margin#%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E6%80%A7)。

### flex布局 \(弹性布局\)

控制空间布局 , 对齐能力;

一维布局 ;

- flex是flexible Box的缩写，意为"弹性布局"。采用flex布局的元素，称为Flex容器（container），它的所有子元素自动成为容器成员，称为Flex项目（item）。
- 通过给父容器添加flex属性,来控制子元素的位置和排列方式。

![](</blogs/_assets/lakebook/337f30812b5b697b42cfdd56.png>)

- flex布局相关的CSS样式：

<table class="ne-table" id="ninDO"><tbody><tr><td width="195"><p class="ne-p" id="u68d62dcb"><strong><span class="ne-text">属性</span></strong></p></td><td width="191"><p class="ne-p" id="u3ea32e86"><strong><span class="ne-text">说明</span></strong></p></td><td width="204"><p class="ne-p" id="ud456b38e"><strong><span class="ne-text">取值</span></strong></p></td><td width="290"><p class="ne-p" id="u2f19a388"><strong><span class="ne-text">含义</span></strong></p></td></tr><tr><td width="195"><p class="ne-p" id="u7f7c9abd"><span class="ne-text">display</span></p></td><td width="191"><p class="ne-p" id="u5edc4265"><span class="ne-text">模式</span></p></td><td width="204"><p class="ne-p" id="ub7d4b4f3"><span class="ne-text">flex</span></p></td><td width="290"><p class="ne-p" id="u1c28694a"><span class="ne-text">使用flex布局</span></p></td></tr><tr><td rowspan="2" width="195"><p class="ne-p" id="u94eb7631"><span class="ne-text">flex-direction</span></p></td><td rowspan="2" width="191"><p class="ne-p" id="ubda4e61c"><span class="ne-text">设置主轴</span></p></td><td width="204"><p class="ne-p" id="u1ba44c13"><span class="ne-text">row</span></p></td><td width="290"><p class="ne-p" id="u6f8e2cc6"><span class="ne-text">主轴方向为x轴，水平向右。（默认）</span></p></td></tr><tr><td width="204"><p class="ne-p" id="u3172dbe7"><span class="ne-text">column</span></p></td><td width="290"><p class="ne-p" id="u673842ba"><span class="ne-text">主轴方向为y轴，垂直向下。</span></p></td></tr><tr><td rowspan="5" width="195"><p class="ne-p" id="uf169ebf6"><span class="ne-text">justify-content</span></p></td><td rowspan="5" width="191"><p class="ne-p" id="u6343a9f1"><span class="ne-text">子元素在主轴上的对齐方式</span></p></td><td width="204"><p class="ne-p" id="u8934d3b7"><span class="ne-text">flex-start</span></p></td><td width="290"><p class="ne-p" id="u4b73703a"><span class="ne-text">从头开始排列</span></p></td></tr><tr><td width="204"><p class="ne-p" id="u774060c1"><span class="ne-text">flex-end</span></p></td><td width="290"><p class="ne-p" id="ua7a99df5"><span class="ne-text">从尾部开始排列</span></p></td></tr><tr><td width="204"><p class="ne-p" id="u66d79799"><span class="ne-text">center</span></p></td><td width="290"><p class="ne-p" id="u1cd744cb"><span class="ne-text">在主轴居中对齐</span></p></td></tr><tr><td width="204"><p class="ne-p" id="u0f22c70a"><span class="ne-text">space-around</span></p></td><td width="290"><p class="ne-p" id="ua6709955"><span class="ne-text">平分剩余空间</span></p></td></tr><tr><td width="204"><p class="ne-p" id="ud7e43bc4"><span class="ne-text">space-between</span></p></td><td width="290"><p class="ne-p" id="u32d32883"><span class="ne-text">先两边贴边，再平分剩余空间</span></p></td></tr></tbody></table>

如果主轴设置为row，其实就是横向布局。 主轴设置为column，其实就是纵向布局。

![](</blogs/_assets/lakebook/a26a8d755cc0ab8691c2a10c.png>)

### 表单标签

那其实，上述的整个窗口是一个表单，而表单是一项一项的，这个我们称为表单项 或 表单元素。

- 表单场景: 表单就是在网页中负责数据采集功能的，如：注册、登录的表单。
- 表单标签: `<form>`
- 表单属性:

- `action`: 规定表单提交时，向何处发送表单数据，表单提交的URL。
- `method`: 规定用于发送表单数据的方式，常见为： GET、POST。

- `GET`：表单数据是拼接在url后面的， 如 /路径 ? name\=Tom&amp;age\=12，url中能携带的表单数据大小是有限制的。
- 1\.不安全 : 敏感信息一眼就能看见;
- 2\.浏览器中get 携带的表单数据的大小有大小限制 ;
- `POST`： 表单数据是在请求体（消息体）中携带的，大小没有限制。  
  1\.安全 ;
- 2\.携带的数据大小没有限制;

- 表单项标签: 不同类型的input元素、下拉列表、文本域等。

- `input`: 定义表单项，通过type属性控制输入形式
- `select`: 定义下拉列表
- `textarea`: 定义文本域

**演示：**

1\)\. GET方式提交的表单 // 从浏览器地址栏实现的网址搜索都是get请求; 安全性较低;

```text
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML-表单</title>
</head>
<body>
    <!-- 
    form表单属性: 
        action: 表单提交的url, 往何处提交数据 . 如果不指定, 默认提交到当前页面
        method: 表单的提交方式 .
            get: 在url后面拼接表单数据, 比如: ?username=Tom&age=12 , url长度有限制 . 默认值
            post: 在消息体(请求体)中传递的, 参数大小无限制的.
    -->   
        
    <form action="" method="get">
        用户名: <input type="text" name="username">
        年龄: <input type="text" name="age">

        <input type="submit" value="提交">
    </form>
        
</body>
</html>
```

表单编写完毕之后，通过浏览器打开此表单，然后再表单项中录入值之后，点击提交，我们会看到表单的数据在url后面提交到服务端，格式为：?username\=Tom&amp;age\=12。

![](</blogs/_assets/lakebook/700c6a82582a2da9bd2cab20.png>)

2\)\. POST方式提交表单 , 地址栏不显示 , 安全性中等 ;

将上述的表单提交方式由get，改为post

```text
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML-表单</title>
</head>
<body>
    <!-- 
    form表单属性: 
        action: 表单提交的url, 往何处提交数据 . 如果不指定, 默认提交到当前页面
        method: 表单的提交方式 .
            get: 在url后面拼接表单数据, 比如: ?username=Tom&age=12 , url长度有限制 . 默认值
            post: 在消息体(请求体)中传递的, 参数大小无限制的.
    -->   
        
    <form action="" method="post">
        用户名: <input type="text" name="username">
        年龄: <input type="text" name="age">

        <input type="submit" value="提交">
    </form>
        
</body>
</html>
```

表单编写完毕之后，通过浏览器打开此表单，然后再表单项中录入值之后，点击提交，我们会看到表单的数据在url后面提交到服务端，格式为：?username\=Tom&amp;age\=12。

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1775291865231-299415fa-192e-425c-9e23-d88d9d38f002.png>)

**注意事项：**

表单中的所有表单项，要想能够正常的采集数据，在提交的时候能提交到服务端，表单项必须指定name属性。 否则，无法提交该表单项。

```text
用户名: <input type="text" name="username">
```

### 表单项标签

在一个表单中，可以存在很多的表单项，而虽然表单项的形式各式各样，但是表单项的标签其实就只有三个，分别是：

- `<input>`: 表单项 , 通过type属性控制输入形式。

<table class="ne-table" id="UnLwK"><tbody><tr><td width="219"><p class="ne-p" id="u8f15d9a4"><strong><span class="ne-text">type取值</span></strong></p></td><td width="301"><p class="ne-p" id="u08c5b575"><strong><span class="ne-text">描述</span></strong></p></td></tr><tr><td width="219"><p class="ne-p" id="u68eb0743"><span class="ne-text">text</span></p></td><td width="301"><p class="ne-p" id="u1234c6da"><span class="ne-text">默认值，定义单行的输入字段</span></p></td></tr><tr><td width="219"><p class="ne-p" id="u687b6e9a"><span class="ne-text">password</span></p></td><td width="301"><p class="ne-p" id="u6336b860"><span class="ne-text">定义密码字段</span></p></td></tr><tr><td width="219"><p class="ne-p" id="u798183df"><span class="ne-text">radio</span></p></td><td width="301"><p class="ne-p" id="ub0cfd83f"><span class="ne-text">定义单选按钮</span></p></td></tr><tr><td width="219"><p class="ne-p" id="ue3feb6a2"><span class="ne-text">checkbox</span></p></td><td width="301"><p class="ne-p" id="u45dea132"><span class="ne-text">定义复选框</span></p></td></tr><tr><td width="219"><p class="ne-p" id="u1e3fee5f"><span class="ne-text">file</span></p></td><td width="301"><p class="ne-p" id="u18a723dc"><span class="ne-text">定义文件上传按钮</span></p></td></tr><tr><td width="219"><p class="ne-p" id="uc8e9ceb6"><span class="ne-text">date/time/datetime-local</span></p></td><td width="301"><p class="ne-p" id="uc6509648"><span class="ne-text">定义日期/时间/日期时间</span></p></td></tr><tr><td width="219"><p class="ne-p" id="ubb1a538b"><span class="ne-text">number</span></p></td><td width="301"><p class="ne-p" id="uf98f6250"><span class="ne-text">定义数字输入框</span></p></td></tr><tr><td width="219"><p class="ne-p" id="u8e74659a"><span class="ne-text">email</span></p></td><td width="301"><p class="ne-p" id="uf047b6c6"><span class="ne-text">定义邮件输入框</span></p></td></tr><tr><td width="219"><p class="ne-p" id="u59fe5e38"><span class="ne-text">hidden</span></p></td><td width="301"><p class="ne-p" id="u5efb2cbb"><span class="ne-text">定义隐藏域</span></p></td></tr><tr><td width="219"><p class="ne-p" id="ucc599419"><span class="ne-text">submit / reset / button</span></p></td><td width="301"><p class="ne-p" id="ua8800705"><span class="ne-text">定义提交按钮 / 重置按钮 / 可点击按钮</span></p></td></tr></tbody></table>

- `<select>`: 定义下拉列表, `<option>` 定义列表项
- `<textarea>`: 文本域
- &lt;lable&gt; 标签 : 添加了此标签 , 可以直接打包成一个区域 , 点击选项文字也会实现选中 ;

```text
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML-表单项标签</title>
</head>
<body>

<!-- value: 表单项提交的值 -->
<form action="/save" method="post">
//控制数据返回的路径 + 方法 ; 
     姓名: <input type="text" name="name"> <br><br>

     密码: <input type="password" name="password"> <br><br> 

     性别: <input type="radio" name="gender" value="1"> 男
          <label><input type="radio" name="gender" value="2"> 女 </label> <br><br>
     
     爱好: <label><input type="checkbox" name="hobby" value="java"> java </label>
          <label><input type="checkbox" name="hobby" value="game"> game </label>
          <label><input type="checkbox" name="hobby" value="sing"> sing </label> <br><br>
     
     图像: <input type="file" name="image">  <br><br>

     生日: <input type="date" name="birthday"> <br><br>

     时间: <input type="time" name="time"> <br><br>

     日期时间: <input type="datetime-local" name="datetime"> <br><br>

     学历: <select name="degree">
               <option value="">----------- 请选择 -----------</option>
               <option value="1">大专</option>
               <option value="2">本科</option>
               <option value="3">硕士</option>
               <option value="4">博士</option>
          </select>  <br><br>

     描述: <textarea name="description" cols="30" rows="10"></textarea>  <br><br>
     
     <input type="hidden" name="id" value="1">

     <!-- 表单常见按钮 -->
     <input type="button" value="按钮">
     <input type="reset" value="重置">  // 可以实现全部数据清空
     <input type="submit" value="提交">   
     <br>
</form>

</body>
</html>
```

通过浏览器打开上述的表单项html文件，最终展示出的表单信息如下：

![](</blogs/_assets/lakebook/8c0e3cbbbc427e1d2f7912e6.png>)

而对于`<input type="hidden">`，是一个隐藏域，在表单中并不会显示出来，但是在提交表单的时候，是会提交到服务端的。 接下来，我们就点击提交按钮，来提交当前表单，看看提交的数据：

![](</blogs/_assets/lakebook/41c46cfad8b044a28d726224.png>)

那基本的表单标签和表单项标签，讲解完毕后，接下来呢，我们就来完成搜索表单的实现，同样，我们可以借助于AI帮我们完成对应的页面布局。

提示词（prompt）：

再继续帮我生成第二个部分: 2\. 搜索表单区域

组成：包括三个输入控件和两个操作按钮。输入控件具体为：姓名（文本输入框）、性别（下拉选择，选项包括 男/女， 默认为空）、职位（下拉选择，选项包括班主任、讲师、学工主管、教研主管、咨询师， 默认为空）。

按钮：“查询”与“清空”按钮，用于提交表单或重置表单项 。

布局：所有表单项及按钮需水平排列于一行 ，确保美观大气 。

代码实现如下：

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
          background-color: #f1f1f1;
          padding: 10px 20px;
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
          padding: 5px 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 200px;
      }

      /* 按钮样式 */
      .search-form button {
          padding: 5px 15px;
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
    </style>
</head>
<body>
    <!-- 顶栏 -->
    <div class="header">
        <h1>Tlias智能学习辅助系统</h1>
        <a href="#">退出登录</a>
    </div>

    <!-- 搜索表单区域 -->
    <form class="search-form">
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

</body>
</html>
```

浏览器呈现效果为：

![](</blogs/_assets/lakebook/a4802cc1827174f09b36a01f.png>)

## 表格数据展示

### 基本实现

页面效果如下：

![](</blogs/_assets/lakebook/1777d403dbc5f2aeb4625901.png>)

提示词（prompt）：

再继续帮我生成第三个部分: 3\. 表格展示区

表格结构：展示列包括姓名、性别（显示男/女）、头像（小图标展示）、职位（显示班主任/讲师/学工主管/教研主管/咨询师）、入职日期、最后操作时间、操作（里包含两个按钮 编辑 与 删除）。

数据模拟：基于《笑傲江湖》小说人物生成4条虚拟数据，每条数据应包含上述所有列的信息，以体现实际应用场景 。

样式：可适当调整表格样式，确保美观大气。

代码实现为：

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
          background-color: #f1f1f1;
          padding: 10px 20px;
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
          padding: 5px 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 200px;
      }

      /* 按钮样式 */
      .search-form button {
          padding: 5px 15px;
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
         margin: 0 20px;
      }

      /* 设置表格单元格边框 */
      .table td, .table th { 
        border: 1px solid #ddd; 
        padding: 8px; 
        text-align: center;
      }
      
      .avatar { 
        width: 50px; 
        height: 50px; 
        object-fit: cover; 
        border-radius: 50%; 
      }

    </style>
</head>
<body>
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
          <tr>
              <td>令狐冲</td>
              <td>男</td>
              <td><img src="https://via.placeholder.com/50" alt="令狐冲" class="avatar"></td>
              <td>讲师</td>
              <td>2021-03-15</td>
              <td>2023-07-30T12:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
          <tr>
              <td>任盈盈</td>
              <td>女</td>
              <td><img src="https://via.placeholder.com/50" alt="任盈盈" class="avatar"></td>
              <td>学工主管</td>
              <td>2020-04-10</td>
              <td>2023-07-29T15:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
          <tr>
              <td>岳不群</td>
              <td>男</td>
              <td><img src="https://via.placeholder.com/50" alt="岳不群" class="avatar"></td>
              <td>教研主管</td>
              <td>2019-01-01</td>
              <td>2023-07-30T10:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
          <tr>
              <td>宁中则</td>
              <td>女</td>
              <td><img src="https://via.placeholder.com/50" alt="宁中则" class="avatar"></td>
              <td>班主任</td>
              <td>2018-06-01</td>
              <td>2023-07-29T09:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
      </tbody>
  </table>

</body>
</html>
```

页面展示的效果为：

![](</blogs/_assets/lakebook/745f328797eb368c6458075b.png>)

###### 表格标签

<table class="ne-table" id="BSvsG"><tbody><tr><td width="175"><p class="ne-p" id="u0f3862ea"><span class="ne-text">标签</span></p></td><td width="894"><p class="ne-p" id="u6466271e"><span class="ne-text">描述</span></p></td></tr><tr><td width="175"><p class="ne-p" id="ue66a7ee2"><span class="ne-text">&lt;table&gt;</span></p></td><td width="894"><p class="ne-p" id="ud2f59c78"><span class="ne-text">定义表格整体</span></p></td></tr><tr><td width="175"><p class="ne-p" id="uc28eb18a"><span class="ne-text">&lt;thead&gt;</span></p></td><td width="894"><p class="ne-p" id="uc8aa4a30"><span class="ne-text">用于定义表格头部(可选)</span></p></td></tr><tr><td width="175"><p class="ne-p" id="u9b9b39ee"><span class="ne-text">&lt;tbody&gt;</span></p></td><td width="894"><p class="ne-p" id="udbd4cb7a"><span class="ne-text">定义表格中的主体部分(可选)</span></p></td></tr><tr><td width="175"><p class="ne-p" id="ua1ad390f"><span class="ne-text">&lt;tr&gt;</span></p></td><td width="894"><p class="ne-p" id="u3c6002b3"><span class="ne-text">表格的行，可以包裹多个 &lt;td&gt;</span></p></td></tr><tr><td width="175"><p class="ne-p" id="u6d51db59"><span class="ne-text">&lt;td&gt;</span></p></td><td width="894"><p class="ne-p" id="u3c34f43d"><span class="ne-text">表格单元格(普通)，可以包裹内容；如果是表头单元格，可以替换为 &lt;th&gt;</span></p></td></tr></tbody></table>

##### 底部版权区域

页面原型展示如下：

![](</blogs/_assets/lakebook/f96988b957016348dbc5b532.png>)

提示词（prompt）:

再继续帮我生成第二个部分: 4\. 页脚版权区域

内容：第一行显示公司全称“江苏传智播客教育科技股份有限公司”；第二行展示版权信息，“版权所有 Copyright 2006\-2024 All Rights Reserved”。

设计：该区域应具有灰色背景，字体颜色为白色，居中对齐，以营造专业且统一的视觉效果 。

页面代码如下：

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
          background-color: #f1f1f1;
          padding: 10px 20px;
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
          padding: 5px 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 200px;
      }

      /* 按钮样式 */
      .search-form button {
          padding: 5px 15px;
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
         margin: 0 20px;
      }

      /* 设置表格单元格边框 */
      .table td, .table th { 
        border: 1px solid #ddd; 
        padding: 8px; 
        text-align: center;
      }
      
      .avatar { 
        width: 50px; 
        height: 50px; 
        object-fit: cover; 
        border-radius: 50%; 
      }

      /* 页脚版权区域 */
    .footer {
        background-color: #8f8c8c;
        color: white;
        text-align: center;
        padding: 20px 0;
        margin-top: 30px;
    }

    .footer .company-name {
        font-size: 1.1em;
        font-weight: bold;
    }

    .footer .copyright {
        font-size: 0.9em;
    }
    </style>
</head>
<body>
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
          <tr>
              <td>令狐冲</td>
              <td>男</td>
              <td><img src="https://via.placeholder.com/50" alt="令狐冲" class="avatar"></td>
              <td>讲师</td>
              <td>2021-03-15</td>
              <td>2023-07-30T12:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
          <tr>
              <td>任盈盈</td>
              <td>女</td>
              <td><img src="https://via.placeholder.com/50" alt="任盈盈" class="avatar"></td>
              <td>学工主管</td>
              <td>2020-04-10</td>
              <td>2023-07-29T15:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
          <tr>
              <td>岳不群</td>
              <td>男</td>
              <td><img src="https://via.placeholder.com/50" alt="岳不群" class="avatar"></td>
              <td>教研主管</td>
              <td>2019-01-01</td>
              <td>2023-07-30T10:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
          <tr>
              <td>宁中则</td>
              <td>女</td>
              <td><img src="https://via.placeholder.com/50" alt="宁中则" class="avatar"></td>
              <td>班主任</td>
              <td>2018-06-01</td>
              <td>2023-07-29T09:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
      </tbody>
  </table>

  <!-- 页脚版权区域 -->
  <footer class="footer">
    <p class="company-name">江苏传智播客教育科技股份有限公司</p>
    <p class="copyright">版权所有 Copyright 2006-2024 All Rights Reserved</p>
  </footer>

</body>
</html>
```

页面展示如下：

![](</blogs/_assets/lakebook/117e8272a8189800b0a9dcf7.png>)

##### 版心居中

这个案例类似于央视新闻页面，页面中的内容，都需要居中显示，所以这里呢，我们就可以使用盒子模型来进行布局。具体代码如下：

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
          background-color:  #c2c0c0;
          padding: 10px 20px;
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
          padding: 5px 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 200px;
      }

      /* 按钮样式 */
      .search-form button {
          padding: 5px 15px;
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
          <option value="male">男</option>
          <option value="female">女</option>
      </select>
      <select name="position">
          <option value="">职位</option>
          <option value="班主任">班主任</option>
          <option value="讲师">讲师</option>
          <option value="学工主管">学工主管</option>
          <option value="教研主管">教研主管</option>
          <option value="咨询师">咨询师</option>
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
          <tr>
              <td>令狐冲</td>
              <td>男</td>
              <td><img src="https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/1.jpg" alt="令狐冲" class="avatar"></td>
              <td>讲师</td>
              <td>2021-03-15</td>
              <td>2023-07-30T12:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
          <tr>
              <td>任盈盈</td>
              <td>女</td>
              <td><img src="https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/1.jpg" alt="任盈盈" class="avatar"></td>
              <td>学工主管</td>
              <td>2020-04-10</td>
              <td>2023-07-29T15:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
          <tr>
              <td>岳不群</td>
              <td>男</td>
              <td><img src="https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/1.jpg" alt="岳不群" class="avatar"></td>
              <td>教研主管</td>
              <td>2019-01-01</td>
              <td>2023-07-30T10:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
          <tr>
              <td>宁中则</td>
              <td>女</td>
              <td><img src="https://web-framework.oss-cn-hangzhou.aliyuncs.com/2023/1.jpg" alt="宁中则" class="avatar"></td>
              <td>班主任</td>
              <td>2018-06-01</td>
              <td>2023-07-29T09:00:00Z</td>
              <td class="btn-group">
                  <button>编辑</button>
                  <button>删除</button>
              </td>
          </tr>
      </tbody>
    </table>

    <!-- 页脚版权区域 -->
    <footer class="footer">
      <p class="company-name">江苏传智播客教育科技股份有限公司</p>
      <p class="copyright">版权所有 Copyright 2006-2024 All Rights Reserved</p>
    </footer>

  </div>

</body>
</html>
```

页面效果如下:

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1775309347371-4124e1cf-1cae-481a-9927-0e0cae5cdafe.png>)

![](</blogs/_assets/lakebook/671470fa4ce159f48ecabf86.png>)

![](</blogs/_assets/lakebook/93d4c87fe9d59527dcd330d3.png>)
