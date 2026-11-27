安装goctl

Vue复制代码

```text
go install github.com/zeromicro/go-zero/tools/goctl@latest
```

安装protoc全家桶

Vue复制代码

```text
goctl env check --install --verbose --force
```

Vue复制代码

项目中用来实现创建go\_zero

```text
go get -u github.com/zeromicro/go-zero@latest
```

goland安装goctl插件

快速创建一个api服务

Vue复制代码

```text
goctl api new api
```

然后修改一下user/api/internal/logic/apilogic\.go文件

Vue复制代码

```text
func (l *ApiLogic) Api(req *types.Request) (resp *types.Response, err error) {
  // todo: add your logic here and delete this line

  return &types.Response{Message: "枫枫"}, nil
}
```

快速创建一个rpc服务

Vue复制代码

```text
goctl rpc new rpc
```

然后在user的api目录运行

Vue复制代码

```text
go run api.go
```

访问 127\.0\.0\.1:8888/from/me 能看到数据就说明环境安装好了

## 参考文档

环境搭建 [https://blog\.csdn\.net/xwh3165037789/article/details/131577365](https://blog.csdn.net/xwh3165037789/article/details/131577365)

官方文档 [https://go\-zero\.dev/docs/tasks/installation/goctl](https://go-zero.dev/docs/tasks/installation/goctl)
