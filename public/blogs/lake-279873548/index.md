### 日志轮询

![](</blogs/_assets/lakebook/02e41d7b1c14276befc5c5ab.png>)

```text
// getWriter 创建带轮转能力的日志写入器 writer
//(go get gopkg.in/natefinish/lumberjack.v2)
func getWriter(filename string) *lumberjack.Logger {
	return &lumberjack.Logger{
		Filename:   filename,
		MaxSize:    100, // MB
		MaxBackups: 3,   // 保留 3 个备份
		MaxAge:     7,   // 保留 7 天
		Compress:   true,
	}
}

Init()函数中 : 
不用使用os.OpenFile() 实现文件写入 ; 
// 使用 lumberjack 管理日志文件 
直接使用函数实现创建日志文件 : 
  normalWriter := getWriter("log.log")
	errWriter := getWriter("err.log") 

最后在 返回的cleanup函数中全部实现 Close() 即可实现返回; 

```

实现 JSON格式转化 \+ 配置文件支持 :

```text
创建编码器环境 : 通过监测
func newEncoder(logConfig config.LogConfig, colorLevel bool) zapcore.Encoder {
	encoderConfig := newEncoderConfig(logConfig.Development)

	if colorLevel && logConfig.Format == "console" {
		encoderConfig.EncodeLevel = colorLevelEncoder
	}

	if logConfig.Format == "json" {
		return zapcore.NewJSONEncoder(encoderConfig)
	}
	return zapcore.NewConsoleEncoder(encoderConfig)
}
```

在配置文件中管理配置项中的 development 选项的 bool 值 ;

通过读取的内容实现 开发/生产 模式之间的转换;

```text
func newEncoderConfig(development bool) zapcore.EncoderConfig {
	var encoderConfig zapcore.EncoderConfig
	if development {
		encoderConfig = zap.NewDevelopmentEncoderConfig()
	} else {
		encoderConfig = zap.NewProductionEncoderConfig()
	}
	encoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006-01-02 15:04:05")
	return encoderConfig
}
```
