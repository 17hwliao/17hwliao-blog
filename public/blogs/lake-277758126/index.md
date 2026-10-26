#### 前提必须要背诵的结构化知识 :

```text
Debug < Info < Warn < Error < DPanic < Panic < Fatal
```

zap功能强大, 配置项很多 ;

一般需要掌握的技能有以下这些 :

1\.时间的格式化 ;

2\.输出美化

3\.预设字段

4\.使用全局日志

5\.日志双写

6\.日志分片

## 安装

```text
go get go.uber.org/zap@___
```

## 基本使用

#### NewDevelopment :

```text
func dev() {
	logger, _ := zap.NewDevelopment()  --> (zap.NewDevelopmentConfig().Build())
	logger.Debug("this is dev debug log")
	logger.Info("this is dev info log")
	logger.Warn("this is dev warm log")
	logger.Error("this is dev error log")
	logger.Panic("this is dev painc log")
	logger.Fatal("this is dev fatal log")}
func main() {dev()}
```

```text
Debug / Info：当前 logger.Debug/Info 所在代码行
Warn / Error / Panic / Fatal：当前代码行 + 调用栈
Panic：日志后触发 panic
Fatal：日志后 os.Exit(1)，defer 不执行
```

```text
Debug / Info：
记录调试或正常运行信息。
配置 AddCaller 后，输出当前写日志的代码行。

Warn：
记录风险或可恢复异常。
不自动输出上层调用链，也不自动上抛错误。

Error：
记录操作失败，但程序继续运行。
配置 AddStacktrace(ErrorLevel) 后，携带调用栈。

Panic：
记录日志后执行 panic。
未被 recover 时，Go 运行时打印 panic 栈并使程序退出。

Fatal：
记录日志后调用 os.Exit(1)。
配置了调用栈时会带栈；直接退出，defer 不执行。
```

#### NewExample :

返回值只用一个 : 只需要使用一个logger实现注册就行 ; 配置项中没有时间 ;

#### NewProduction\(\) : 返回类型为JSON格式

配置项中有时间戳 ,

## 设置日志级别

```text
zap.NewDevelopmentConfig() // 返回 zap.Config：开发环境预设
默认的最低级别为 Debug ; Console型输出 ; 调用栈阈值:warn及以上;
zap.NewProductionConfig()  // 返回 zap.Config：生产环境预设
默认的最低级别为 Info() ; Json  型输出 ; 调用栈阈值:Error及以上; 
```

使用以下的两种现在已有的基础实现简短的补充可以大大减少必要配置丢失的风险 :

```text
从0开始注册一个日志器 : 
cfg := zap.Config{
	Level:            zap.NewAtomicLevelAt(zap.InfoLevel),
	Development:      false,
	Encoding:          "json",
	EncoderConfig:     zap.NewProductionEncoderConfig(),
	OutputPaths:       []string{"stdout"},
	ErrorOutputPaths:  []string{"stderr"},}
简单实现配置 ; (输出路径,编码器,调用栈,采样)
```

```text
func dev1() {
	logger_config := zap.NewDevelopmentConfig()
	logger_config.Level = zap.NewAtomicLevelAt(zap.InfoLevel) //过滤掉优先级低于Info()的全部报错;
	logger, _ := logger_config.Build()

	logger.Debug("this is  debug log")
	logger.Info("this is dev info log")
	logger.Warn("this is dev warm log")
	logger.Error("this is  error log")
	logger.Fatal("this is  fatal log")
}
```

## 时间格式化

在配置中实现补充一条即可

```text
Mon Jan 2 15:04:05 MST 2006
2006-01-02 15:04:05 Monday
"Monday, 2006-01-02 15:04:05.000000000 MST -0700"

Monday      完整英文星期，例如 Friday
Mon         星期缩写，例如 Fri

2006        四位年份
06          两位年份，例如 26

01          两位月份
1           月份数字，不补零
Jan         英文月份缩写
January     英文完整月份

02          两位日期
2           日期，不补零
_2          日期左侧空格补齐

15          24 小时制的小时
03          12 小时制的小时
PM          上午/下午

04          分钟
05          秒

.000        毫秒
.000000     微秒
.000000000  纳秒

MST         时区名称，例如 CST、UTC
-0700       数字时区，例如 +0800
-07:00      数字时区，例如 +08:00
```

```text
	logger_config.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006-01-02 15:04:05")
```

时间的格式可以实现人为的手动修改 ;

## 标准日志和sugar日志

```text
	logger, _ := zap.NewDevelopment()
	logger.Info(fmt.Sprintf("this is %s", "zjq"))
  执行的顺序: 先实现内部的Sprintf的格式化然后交给底层的Logger实现输出 ; 

	suger := logger.Sugar()
	suger.Infof("this is %s", "zjq")
```

sugarlogger日志的业务开发使用 :

```text
//带来了的是fmt的格式化输出写法和实现了键值对日志; 
先使用NewDevelopment()/NewProduction()实现注册一个logger ; 
1.直接使用sugar()记录消息 : 
sugar.Debug() / sugar.Info() /sugar.Warn() / sugar.Error() 

2.Infof:格式化消息 : 
详情见上 ; 

3.Infow：结构化日志
sugar.Infow() 
后续加上w就是with的意思 : 第一个参数是日志消息, 后续参数是按照"键,值,键,值"成对实现传递的;
Errorw 更适合线上日志系统; 

4.使用With复用公共字段
一次请求中反复记录同一批字段的时候, 不用每一行都需要重复编写 ; 
suger.With(
  "request_id", requestID , 
  "user_id" , userID . )

5.可以实现混用zap.Field
虽然使用suger常使用键值对 , 但是也是可以实现混入zap.Field的 : 
使用标准库 : 
sugar.Infow("创建用户成功",
	zap.Int64("user_id", userID),
	zap.String("name", name),
)
直观显示使用键值对 : 
sugar.Infow("创建用户成功",
	"user_id", userID,
	"name", name,
)

```

## 结构化日志

少拼字符串，多记录字段；消息描述事件，字段描述上下文。

```text
	logger.Info("this is info",
		zap.String("name", "zhaojiqi"),
		zap.Int("age", 17),
		zap.Bool("gender", true),)
对比一下输出的前后差别　: 
没有实现field结构化的代码 : 
2025-03-08T12:12:01.975+0800  INFO  zap_pro/4.标准日志和sugar日志.go:10  my name is fengfeng
2025-03-08T12:12:01.987+0800  INFO  zap_pro/4.标准日志和sugar日志.go:13  my name is fengfeng
实现了field结构化之后的代码 : 后面会追加上JSON格式的field信息; 
2025-03-08T12:13:53.362+0800  INFO  zap_pro/5.结构化日志.go:8  this is log  {"name": "fengfeng", "age": 12, "isGender": true}
```

## 日志输出美化

本地开发：彩色 console 日志，便于人眼扫读

测试环境：可选彩色，通常保留结构化字段

生产环境：无颜色 JSON 日志，输出到 stdout / stderr

日志平台：按 level、trace\_id、service、error 等字段高亮和检索

#### 实现输出控制颜色

```text
\033[31m  设置前景色为红色
\033[0m   重置颜色，避免影响后续输出
\n        换行
常见的约定 : 
DEBUG：蓝色或灰色
INFO：绿色
WARN：黄色
ERROR：红色
PANIC / FATAL：红色或紫红色
```

```text
const (
	reset  = "\033[0m"
	red    = "\033[31m"
	green  = "\033[32m"
	yellow = "\033[33m"
	blue   = "\033[34m"
)
fmt.Printf(red , "17hwliao" ,reset)   //大致的流程就是先设置输出颜色, 输出完成后修正
```

```text
func encoderlevel(level zapcore.Level, enc zapcore.PrimitiveArrayEncoder) {
	switch level {
	case zapcore.DebugLevel:
		enc.AppendString(Blue + "DEBUG" + Reset)
	case zapcore.InfoLevel:
		enc.AppendString(Green + "INFO" + Reset)
	case zapcore.WarnLevel:
		enc.AppendString(Yellow + "WARN" + Reset)
	case zapcore.ErrorLevel, zapcore.DPanicLevel, zapcore.PanicLevel, zapcore.FatalLevel:
		enc.AppendString(Red + level.CapitalString() + Reset)
	default:
		enc.AppendString(level.CapitalString())
	}
}
```

```text
简单讲解一下这两个参数 : 
level : 当前日志的等级值 ; 
传入的就是level == zapcore.InfoLevel ; 
enc   : 写入日志的编码器 ;  PrimitiveArrayEncoder看起来复杂,但是实际上使用加String的功能
把等级内容写回 Zap 日志系统的工具
```

## 日志前缀

```text
core := zapcore.Newcore()
logger := zap.New(core)
```

```text
1.enab LevelEnabler : 日志等级
2.ws   WriteSyncer  : 挑选输出的io对象
3.enc  Encoder      : 调整输出之后的日志版式 
```

```text
logger.Info(...)
    ↓
Zap 生成原始日志文本
    ↓
你的 MyEmcoding.EncodeEntry 拦截日志文本
    ↓
清空原内容，并在前面拼接 "[Program] "
    ↓
输出到 os.Stdout
```

```text
type MyEmcoding struct {zapcore.Encoder}
```

```text
func (m MyEmcoding) EncodeEntry(
	entry zapcore.Entry,
	fields []zapcore.Field,
) (*buffer.Buffer, error) {}
entry : 日志固定信息; 包含时间,日志等级,调用位置,消息等; 
field : logger.Info 中实现传入的日志的结构化的字段 ; 
*buffer.Buffer：编码完成后的日志内容,创建缓存区防止日志的相关信息
error：编码过程是否出错
```

```text
buff, err := m.Encoder.EncodeEntry(entry, fields) --> 使用原始的编码器-->普通的日志内容
使用buff.String() ; 实现获取原先的文本赋值给一个变量data ; 
使用Reset实现清空内容, 不会释放Buffer内存; 
然后再使用 buff.AppendString("[program]" + data) ; 实现重新编写内容顺序; 

主函数中还要实现组装日志的输出核心 : 
core := zapcore.NewCore(
	MyEmcoding{
		Encoder: zapcore.NewConsoleEncoder(
			zap.NewDevelopmentEncoderConfig(),
		),
	},
	os.Stdout,
	zapcore.InfoLevel,)
```

```text
type PrefixEncoder struct {
	zapcore.Encoder
	Prefix string
}

func (e PrefixEncoder) Clone() zapcore.Encoder {
	return PrefixEncoder{
		Encoder: e.Encoder.Clone(),
		Prefix:  e.Prefix,
	}
}

func (e PrefixEncoder) EncodeEntry(
	entry zapcore.Entry,
	fields []zapcore.Field,
) (*buffer.Buffer, error) {
	buf, err := e.Encoder.EncodeEntry(entry, fields)
	if err != nil {
		return buf, err
	}

	data := buf.String()
	buf.Reset()
	buf.AppendString(e.Prefix + data)

	return buf, nil
}
```

## 全局日志

zap原创的日志还是支持 利用 对象的方法使用日志 :

```text
zap.L().Info("设置全局日志")  --> 返回全局的Logger
zap.S().Infof("配置全局日志") --> 返回全局SugaredLogger,适合Infof , Infow 等简写 ; 
```

```text
func InitLogger() {
	cfg := zap.NewDevelopmentConfig()
	cfg.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2001-02-22")
	logger, _ := cfg.Build()

	zap.ReplaceGlobals(logger)
}

func main() {
	InitLogger()
	zap.L().Info("设置全局日志")
	zap.S().Infof("配置全局日志")
}
```

## 日志双写

常见的 : 控制台 和 日志文件 双写 ;

使用 zapcore\.NewTee 可以组合实现多个core的实例 :

#### 方法一 :

***日志流向 :***

```text
logger.Info("xxx")
        ↓
zapcore.NewTee(...)
   ├── consoleCore → os.Stdout（控制台）
   └── fileCore    → app.log（文件）
```

***然后创建core :***

```text
控制台Console : 
consoleCore := zapcore.NewCore(
	zapcore.NewConsoleEncoder(cfg.EncoderConfig),
	os.Stdout,
	zapcore.InfoLevel,
)
```

***将日志写入文件 :***

```text
file, _ := os.OpenFile(
	"app.log",
	os.O_CREATE|os.O_WRONLY|os.O_APPEND,
	0666,
)
内部参数含义 :
app.log：文件名，位于程序当前工作目录
os.O_CREATE：文件不存在时创建
os.O_WRONLY：只写
os.O_APPEND：每次从文件末尾追加，不覆盖旧日志
0666：文件权限，实际还会受系统 umask 影响
```

***文件实现的core :***

```text
fileCore := zapcore.NewCore(
	zapcore.NewConsoleEncoder(cfg.EncoderConfig),
	file,
	zapcore.InfoLevel,
)
```

两个实现的core 完全一致 , 只有输出目标不一致 ;

最后使用 NewTee 实现一个日志分流器, 将日志交给两个core ;

```text
logger := zap.New(core, zap.AddCaller())
logger.Info("xxx")
```

安全的设计 :

`logger.Sync()` 会尝试把尚未刷出的日志同步到底层输出；\(建议加到logger\.Info\(\) 之前的一行\)

`file.Close()` 则关闭日志文件。注意 defer 的声明顺序：

上面会先 `Sync()`，再 `Close()`，顺序正确。

#### 方法二 :

实现起来相对会简单一些 :

zapcore中的第二个参数 ws WriteSyncer 可以实现决定输出的位置 ;

```text
config := zap.NewDevelopmentConfig()
config.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006-01-02 15:04:05")

file, _ := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
fileCore := zapcore.NewCore(
    zapcore.NewConsoleEncoder(config.EncoderConfig),
    zapcore.NewMultiWriteSyncer(os.Stdout, file),
    zapcore.InfoLevel,
)

logger := zap.New(fileCore, zap.AddCaller())
logger.Info("xxx")
```

## 日志切片

#### 让日志按时间实现分片 ;

主要实现按照时间来划分天数来实现写入 :

```text
logger.Info(...)
    ↓
Zap 编码成 []byte
    ↓
NewMultiWriteSyncer
    ├── 写入 os.Stdout
    └── 调用 myWriter.Write([]byte)
             ↓
       判断今天日期
             ↓
       需要时切换日志文件
             ↓
       写入当前日期对应的文件
```

```text
设置结构体 : 
type myWriter struct {
	mutex       sync.Mutex
	file        *os.File
	currentDate string}
具体含义 : 
mutex：保证并发写日志时不会同时切文件
file：当前正在写的日志文件
currentDate：当前文件对应的日期，例如 2026-07-18
```

```text
func (m *myWriter) Write(b []byte) (n int, err error)
go标准库中实现的io.Writer内部接口实现的方法 : 
type Writer interface {
	Write(p []byte) (n int, err error)
}
实现将编码好的日志转化成为字节数组 ; 
```

```text
实现的方法 : 也是利用内部实现的参数NewCore.NewMultiWriteSyncer实现的 : 
core := zapcore.NewCore(
		zapcore.NewConsoleEncoder(cfg.EncoderConfig),
		zapcore.NewMultiWriteSyncer(os.Stdout, zapcore.AddSync(&myWritter{})),
		zapcore.InfoLevel,
	)
实现的方法 , 就是按照时间为文件名写入不同的文件中去, 实现分页
func (m *myWritter) Write(b []byte) (n int, err error) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	now := time.Now().Format("2006-01-02")
	if m.currentData == now {
		return m.file.Write(b)
	}
	if m.file != nil {
		m.file.Close()
	}

	name := fmt.Sprintf("log/%s.log", now)
	file, _ := os.OpenFile(name, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	m.file = file
	m.currentData = now
	return file.Write(b)}
```

#### 日志按照Level实现分片

```text
先展示代码
// 自定义 Encoder
type levelEncoder struct {
	zapcore.Encoder  --> 实现创建的时候嵌入的原始的Encoder
	errFile *os.File
}

//一下是自定义Encoder的核心方法 : 
func (e *levelEncoder) EncodeEntry(entry zapcore.Entry,fields []zapcore.Field,) 
(*buffer.Buffer, error) {
	// 先调用原始的 EncodeEntry 方法生成日志行
	buf, err := e.Encoder.EncodeEntry(entry, fields)  // 嵌入原始的Encoder
	if err != nil {
		return nil, err
	}
  //开始按照日志等级做出额外的划分 : 
	switch entry.Level {
	case zapcore.ErrorLevel:
		if e.errFile == nil {
			file, _ := os.OpenFile("err.log",os.O_CREATE|os.O_APPEND|os.O_WRONLY,0666,)
			//实现写入第一条错误日志
      e.errFile = file
		}

		e.errFile.WriteString(buf.String())  //实现将错误信息复制到文件中去
	}

	return buf, nil
}

func main() {
	// 使用 zap 的 NewDevelopmentConfig 快速配置
	cfg := zap.NewDevelopmentConfig()

	cfg.EncoderConfig.EncodeTime =
		zapcore.TimeEncoderOfLayout("2006-01-02 15:04:05")   //设置时间展示项

	// 创建自定义 Encoder
	encoder := &levelEncoder{
		Encoder: zapcore.NewConsoleEncoder(cfg.EncoderConfig),
	}    本身就是转化一下日志编码, 但是重写过EncodeEntry(...)之后 , 
  可以在“日志编码完成、正式输出之前”插入自己的逻辑。

	// 创建 Core
	core := zapcore.NewCore(
		encoder,
		zapcore.AddSync(os.Stdout),
		zapcore.DebugLevel,
	)

	// 创建 Logger
	logger := zap.New(core, zap.AddCaller())

	logger.Info("this is info")
	logger.Warn("this is warn")
	logger.Error("this is error1")
	logger.Error("this is error2")
}

//执行逻辑
logger.Error("this is error1")
        ↓
Zap 创建 zapcore.Entry
Entry 中包含：
时间、等级、消息、调用位置等
        ↓
调用 levelEncoder.EncodeEntry(...)
        ↓
e.Encoder.EncodeEntry(...)
先使用原始 ConsoleEncoder 编码
        ↓
生成 buf：
"2026-07-18 10:00:00 ERROR main.go:50 this is error1\n"
        ↓
检查 entry.Level
        ↓
是 ErrorLevel：
写一份 buf.String() 到 err.log
        ↓
return buf, nil
        ↓
Core 将同一个 buf 写到 os.Stdout
```

## zap 功能整合

以上功能全部整合之后使用的日志操作系统 :

1. 可设置级别
2. 时间格式化
3. 输出美化
4. 日志前缀
5. 日志双写
6. 实现按照level实现分片

```text
Core 可以理解为日志的执行引擎或“日志处理管道”。
Encoder：
日志格式，例如时间、等级、调用位置、JSON / console

WriteSyncer：
日志写到哪里，例如 os.Stdout、log.log、err.log

LevelEnabler：
哪些日志等级允许通过; 
```

```text
package main

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

const (
	reset  = "\033[0m"
	red    = "\033[31m"
	green  = "\033[32m"
	yellow = "\033[33m"
	blue   = "\033[34m"
)

// 仅供控制台使用：为不同日志等级添加 ANSI 颜色。
func myEncoderLevel(level zapcore.Level, enc zapcore.PrimitiveArrayEncoder) {
	switch level {
	case zapcore.DebugLevel:
		enc.AppendString(blue + "DEBUG" + reset)
	case zapcore.InfoLevel:
		enc.AppendString(green + "INFO" + reset)
	case zapcore.WarnLevel:
		enc.AppendString(yellow + "WARN" + reset)
	case zapcore.ErrorLevel, zapcore.DPanicLevel,
		zapcore.PanicLevel, zapcore.FatalLevel:
		enc.AppendString(red + level.CapitalString() + reset)
	default:
		enc.AppendString(level.CapitalString())
	}
}

func main() {
	// 统一最低日志等级：运行时可通过 minLevel.SetLevel(...) 修改。
	minLevel := zap.NewAtomicLevelAt(zapcore.InfoLevel)

	// 控制台编码器：带颜色，便于人阅读。
	consoleCfg := zap.NewDevelopmentEncoderConfig()
	consoleCfg.EncodeTime = zapcore.TimeEncoderOfLayout(
		"2006-01-02 15:04:05",
	)
	consoleCfg.EncodeLevel = myEncoderLevel

	// 文件编码器：不写 ANSI 颜色控制字符。
	fileCfg := zap.NewDevelopmentEncoderConfig()
	fileCfg.EncodeTime = zapcore.TimeEncoderOfLayout(
		"2006-01-02 15:04:05",
	)
	fileCfg.EncodeLevel = zapcore.CapitalLevelEncoder //全大写编辑器

	normalFile, err := os.OpenFile("log.log", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)

	if err != nil {
		panic(err)
	}
	defer normalFile.Close()

	errFile, err := os.OpenFile("err.log", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)

	if err != nil {
		panic(err)
	}
	defer errFile.Close()

	// Debug / Info / Warn -> log.log
	normalLevel := zap.LevelEnablerFunc(func(level zapcore.Level) bool {
		return minLevel.Enabled(level)  --> 可以实现判断当前使用的level 是否不低于minLevel &&
			level >= zapcore.DebugLevel &&
			level < zapcore.ErrorLevel
	})

	// Error 及以上 -> err.log
	errorLevel := zap.LevelEnablerFunc(func(level zapcore.Level) bool {
		return minLevel.Enabled(level) &&
			level >= zapcore.ErrorLevel
	})

	consoleCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(consoleCfg),
		zapcore.AddSync(os.Stdout),
		minLevel,
	)

	normalCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(fileCfg),
		zapcore.AddSync(normalFile),
		normalLevel,
	)

	errorCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(fileCfg),
		zapcore.AddSync(errFile),
		errorLevel,
	)

	logger := zap.New(
		zapcore.NewTee(consoleCore, normalCore, errorCore),
		zap.AddCaller(),
		zap.AddStacktrace(zapcore.ErrorLevel),
	).Named("myProject") // 日志前缀

	defer func() {
		_ = logger.Sync()
	}()

	logger.Debug("debug 日志")
	logger.Info("info 日志")
	logger.Warn("warn 日志")
	logger.Error("error 日志")
}

```

```text
配置全局的日志框架 : logger/logger.go
package logger

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

const (
	reset  = "\033[0m"
	red    = "\033[31m"
	green  = "\033[32m"
	yellow = "\033[33m"
	blue   = "\033[34m"
)

// 控制台日志等级颜色。
func myEncoderLevel(level zapcore.Level, enc zapcore.PrimitiveArrayEncoder) {
	switch level {
	case zapcore.DebugLevel:
		enc.AppendString(blue + "DEBUG" + reset)
	case zapcore.InfoLevel:
		enc.AppendString(green + "INFO" + reset)
	case zapcore.WarnLevel:
		enc.AppendString(yellow + "WARN" + reset)
	case zapcore.ErrorLevel, zapcore.DPanicLevel,
		zapcore.PanicLevel, zapcore.FatalLevel:
		enc.AppendString(red + level.CapitalString() + reset)
	default:
		enc.AppendString(level.CapitalString())
	}
}

// Init 创建并注册项目的全局日志器。
// projectName 会显示为日志前缀。
// 返回的 cleanup 必须在 main 中 defer 调用。
func Init(projectName string) (cleanup func(), err error) {
	minLevel := zap.NewAtomicLevelAt(zapcore.InfoLevel)

	// 控制台：有颜色。
	consoleCfg := zap.NewDevelopmentEncoderConfig()
	consoleCfg.EncodeTime = zapcore.TimeEncoderOfLayout(
		"2006-01-02 15:04:05",
	)
	consoleCfg.EncodeLevel = myEncoderLevel

	// 文件：无颜色、等级大写。
	fileCfg := zap.NewDevelopmentEncoderConfig()
	fileCfg.EncodeTime = zapcore.TimeEncoderOfLayout(
		"2006-01-02 15:04:05",
	)
	fileCfg.EncodeLevel = zapcore.CapitalLevelEncoder

	normalFile, err := os.OpenFile(
		"log.log",
		os.O_CREATE|os.O_APPEND|os.O_WRONLY,
		0644,
	)
	if err != nil {
		return nil, err
	}

	errFile, err := os.OpenFile(
		"err.log",
		os.O_CREATE|os.O_APPEND|os.O_WRONLY,
		0644,
	)
	if err != nil {
		_ = normalFile.Close()
		return nil, err
	}

	// Info、Warn -> log.log
	normalLevel := zap.LevelEnablerFunc(func(level zapcore.Level) bool {
		return minLevel.Enabled(level) &&
			level >= zapcore.DebugLevel &&
			level < zapcore.ErrorLevel
	})

	// Error、DPanic、Panic、Fatal -> err.log
	errorLevel := zap.LevelEnablerFunc(func(level zapcore.Level) bool {
		return minLevel.Enabled(level) &&
			level >= zapcore.ErrorLevel
	})

	consoleCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(consoleCfg),
		zapcore.AddSync(os.Stdout),
		minLevel,
	)

	normalCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(fileCfg),
		zapcore.AddSync(normalFile),
		normalLevel,
	)

	errorCore := zapcore.NewCore(
		zapcore.NewConsoleEncoder(fileCfg),
		zapcore.AddSync(errFile),
		errorLevel,
	)

	log := zap.New(
		zapcore.NewTee(consoleCore, normalCore, errorCore),
		zap.AddCaller(),
		zap.AddStacktrace(zapcore.ErrorLevel),
	).Named(projectName)

	// 此后所有 zap.L()、zap.S() 都会使用这个日志器。
	restore := zap.ReplaceGlobals(log)

	return func() {
		_ = log.Sync()
		_ = errFile.Close()
		_ = normalFile.Close()
		restore()
	}, nil
}
```

```text
package main 
func main(){
  logger.Init("your_project").var --> clean , err != nil 
  defer clean() 
}
```

之后在任何需要实现日志记录的情况 :

```text
zap.L().Info("用户登录成功",zap.String("username", "fengfeng"),)
最好输出这种字段形式的消息 ; 
```
