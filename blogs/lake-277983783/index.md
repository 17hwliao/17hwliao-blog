一个日志篇的一种过渡吧算 :

先简单入门一下日志 : logrus, 本质上就是替换掉过多使用的 fmp ;

```text
import "github.com/sirupsen/logrus"
```

```text
logrus.Debug("开发调试信息")
logrus.Info("普通运行信息")
logrus.Warn("警告，但程序可继续")
logrus.WithError(err) 不会输出错误日志,只会准备一条附带错误的日志
logrus.Error("发生错误")
WithField(...) ：把业务信息附加到日志
```
