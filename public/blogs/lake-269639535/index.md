## 文件读取

### 一次性读取

# \. 核心区别总结（超级清晰）

表格

<table class="ne-table" id="AUzgw"><tbody><tr><td width="150"><p class="ne-p" id="ubc6d1f77"><strong><span class="ne-text">方式</span></strong></p></td><td width="150"><p class="ne-p" id="ue7f8dd68"><strong><span class="ne-text">返回类型</span></strong></p></td><td width="150"><p class="ne-p" id="uf93f636c"><strong><span class="ne-text">数据</span></strong></p></td><td width="150"><p class="ne-p" id="u9d5fef92"><strong><span class="ne-text">要不要关闭</span></strong></p></td><td width="150"><p class="ne-p" id="uac17767e"><strong><span class="ne-text">适合场景</span></strong></p></td></tr><tr><td width="150"><p class="ne-p" id="ue795b0e9"><strong><span class="ne-text">os.ReadFile</span></strong></p></td><td width="150"><p class="ne-p" id="ufbd16880"><code class="ne-code"><span class="ne-text">[]byte</span></code></p></td><td width="150"><p class="ne-p" id="uc3980b75"><strong><span class="ne-text">文件全部内容</span></strong></p></td><td width="150"><p class="ne-p" id="u914110e8"><span class="ne-text">❌</span><span class="ne-text"> 不用</span></p></td><td width="150"><p class="ne-p" id="u0d52f101"><span class="ne-text">小文件、直接读</span></p></td></tr><tr><td width="150"><p class="ne-p" id="u213b42ec"><strong><span class="ne-text">os.Open</span></strong></p></td><td width="150"><p class="ne-p" id="u5400429d"><code class="ne-code"><span class="ne-text">*os.File</span></code></p></td><td width="150"><p class="ne-p" id="ua8097987"><strong><span class="ne-text">文件指针</span></strong></p></td><td width="150"><p class="ne-p" id="udc99a74b"><span class="ne-text">✅</span><span class="ne-text"> </span><strong><span class="ne-text">必须关</span></strong></p></td><td width="150"><p class="ne-p" id="uba90eb75"><span class="ne-text">大文件、逐行读、分段读</span></p></td></tr></tbody></table>

Go复制代码

```text
byteData, _ := os.ReadFile("go_study/hello.txt")
fmt.Println(string(byteData))
```

### 获取当前go文件的路径

后面实现文件上传的时候都要使用 io 分片 :

```text
var filepath string = "./ / / / /"  
//使用io分片实现全部文件的上传工作 ; 
os.Open(filepath).var (file , err)
if err != nil {
  fmp(err) 
  return err  
}
// 使用defer 后手关一下系统消耗 :
defer file.Close() 

for {
  buf := make([]byte,32) 
  _ , err = file.Read(buf)
  if err == io.EOF {
      break 
  }
  fmp ("%s" , string(buf))
}
```

**需要先创建一个 使用 bufio 类中 对象 的 代理 对象**

可以通过获取当前go文件的路径，然后用相对于当前go文件的路径去打开文件

Go复制代码

```text
// GetCurrentFilePath 获取当前文件路径
func GetCurrentFilePath() string {
  _, file, _, _ := runtime.Caller(1)
  return file
}
```

### 分片读 \-\-&gt; 使用 buf : 创建字节数组

Go复制代码

```text
file, _ := os.Open("go_study/hello.txt")
defer file.Close()
for {
  buf := make([]byte, 1)   //每次读取 1 个字节
  _, err := file.Read(buf)    // 获取到读取后的字节数组
  if err == io.EOF {
    break
  }
  fmt.Printf("%s", buf)
}
```

### 带缓冲读 \-\-&gt; 使用ReadReader : \-\-&gt; 内部实现的 ReadLine 实现按行读取

按行读

Go复制代码

```text
file, _ := os.Open("go_study/hello.txt")
buf := bufio.NewReader(file)
for {
  line, _, err := buf.ReadLine() 
  fmt.Println(string(line)) 
  if err != nil { 
    break
  }
}
```

指定分割符

Go复制代码

**使用 for 读取的时候 要获取内部 error 防止出现报错**

```text
file, _ := os.Open("go_study/hello.txt")
scanner := bufio.NewScanner(file)
scanner.Split(bufio.ScanWords) // 按照单词读
//scanner.Split(bufio.ScanLines) // 按照行读
//scanner.Split(bufio.ScanRunes) // 按照中文字符读
//scanner.Split(bufio.ScanBytes) // 按照字节读读，中文会乱码

for scanner.Scan() {
  fmt.Println(scanner.Text())    
}
```

## 文件写入

### 一次性写

Go复制代码

```text
err := os.WriteFile("go_study/file1.txt", []byte("这是内容"), os.ModePerm)
fmt.Println(err)
```

### 文件的打开方式

常见的一些打开模式

Go复制代码

```text
// 如果文件不存在就创建
os.O_CREATE|os.O_WRONLY   实现写入的时候的打开状态
// 追加写
os.O_APPEND|os.O_WRONLY    
// 可读可写
os.O_RDWR          
os.O_CREATE|os.O_RDONLY, 0777)  实现只读  -->  实现 io.ReaderAll(file) 
```

完整的模式

Go复制代码

```text
const (
  O_RDONLY int = syscall.O_RDONLY // 只读
  O_WRONLY int = syscall.O_WRONLY // 只写
  O_RDWR   int = syscall.O_RDWR   // 读写
  
  O_APPEND int = syscall.O_APPEND // 追加
  O_CREATE int = syscall.O_CREAT  // 如果不存在就创建
  O_EXCL   int = syscall.O_EXCL   // 文件必须不存在
  O_SYNC   int = syscall.O_SYNC   // 同步打开
  O_TRUNC  int = syscall.O_TRUNC  // 打开时清空文件
)
```

### 文件的权限

主要用于linux系统，在windows下这个参数会被无视，代表文件的模式和权限位，

三个占位符

第一个是文件所有者所拥有的权限

第二个是文件所在组对其拥有的权限

第三个占位符是指其他人对文件拥有的权限

根据UNIX系统的权限模型，文件或目录的权限模式由三个数字表示，分别代表 所有者（Owner） 、组（Group） 和 其他用户\(Other\) 的权限。每个数字由三个比特位组成，分别代表读、写和执行权限。因此，对于一个mode参数值，它的每一个数字都是一个八进制数字，代表三个比特位的权限组合

Go复制代码

```text
R：读，Read的缩写，八进制值为 4；
W：写，Write的缩写，八进制值为 2；
X：执行，Execute的缩写，八进制值为 1；
```

例如

Go复制代码

```text
0444 表示三者均为只读的权限；
0666 表示三者均为“读写”的权限；
0777 表示三者均为读写执行的权限；
0764 表示所有者有读写执行（7=4+2+1）的权限，组有读写（6=4+2）的权限，其他用户则为只读（4=4）；
```

## 文件复制

Go复制代码

**io \. Copy\( 目标文件 , 拷贝文件 \)**

```text
io.Copy(dst Writer, src Reader) (written int64, err error)
```

将src文件的内容复制到dst文件

Go复制代码

```text
read, _ := os.Open("go_study/file1.txt")
write, _ := os.Create("go_study/file3.txt") // 默认是 可读可写，不存在就创建，清空文件
n, err := io.Copy(write, read)
fmt.Println(n, err)
```

## 目录操作

Go复制代码

```text
dir, _ := os.ReadDir("go_study")
for _(索引), entry(value) := range dir {
  info, _ := entry.Info()
  fmt.Println(entry.IsDir(), entry.Name(), info.Size()) // 是否是文件夹 , 文件名，文件大小，单位比特
}
```

## 参考文档

文件打开模式 [https://zhuanlan\.zhihu\.com/p/602074026](https://zhuanlan.zhihu.com/p/602074026)

go文件权限 [https://blog\.csdn\.net/qq\_35844043/article/details/129380567](https://blog.csdn.net/qq_35844043/article/details/129380567)
