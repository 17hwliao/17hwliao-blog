现代改动很大 :

在现在创建 服务端 server 的时候 :

创造的 结构体 中必须要加上 :

- 结构体名字随便起（VideoServer / MyServer / 都行）
- rpc 方法名必须和 proto 一致（Say）
- 新版 gRPC 接口强制带一个私有方法，包外写不了
- **唯一办法：嵌入 UnimplementedXXXServer，自动继承私有方法**
- **不是不让你自定义结构体，是接口里有个你写不出的私有方法**

`RPC`是`Remote Procedure Call`的简称，中文叫远程过程调用

简单的说，就是调用远程方法和调用本地方法一样

那么grpc就是由 `google`开发的一个高性能、通用的开源`RPC`框架

# 环境准备

只需要在windows上安装protoc转换工具

[https://github\.com/protocolbuffers/protobuf/releases/tag/v3\.9\.0](https://github.com/protocolbuffers/protobuf/releases/tag/v3.9.0)

Go复制代码

```text
https://github.com/protocolbuffers/protobuf/releases/download/v29.3/protoc-29.3-win64.zip
// 都需要安装的依赖
生成 Protobuf 消息代码（替代旧版 protoc-gen-go 的核心功能）
bash运行go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.36.5
生成 gRPC 服务代码（新版 gRPC 必须，旧版插件无法生成）
bash运行go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.5.1
go get github.com/golang/protobuf/proto
go get google.golang.org/grpc

```

安装好之后，需要将protoc的bin目录添加到环境变量中

还需要将protoc\-gen\-go\.exe的目录添加到环境变量中

刚刚添加之后，可能需要重启电脑或者重启goland，才能在goland的terminal中使用

## 编写protobuf文件

现在还没有学过怎么编写，不用担心，先复制粘贴就行了

主要是用于测试环境是否正常

Protocol Buffers复制代码

```text
syntax = "proto3";
package hello_grpc;

// 这里改成正确的 go_package
// 方式1：完整模块路径（推荐）
option go_package = "hello-demo/hello_grpc";
// 方式2：相对路径（配合 paths=source_relative）
// option go_package = "./hello_grpc";

service HelloService {
  rpc SayHello (HelloRequest) returns (HelloResponse) {}
}

message HelloRequest {
  string name = 1;
  string message = 2;
}

message HelloResponse {
  string name = 1;
  string message = 2;
}
```

注意看我的路径

在grpc路径下执行

通过protobuf生成go文件

Go复制代码

```text
protoc -I . --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative hello.proto
```

如果生成了这个文件，那么恭喜你，难倒50%人的环境问题已经搞定了
