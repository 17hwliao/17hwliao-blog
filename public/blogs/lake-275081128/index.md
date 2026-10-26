## 编写protobuf文件

- **service**：关键字，定义一个**RPC 服务类**，类比 Java 接口
- **HelloService**：自定义服务名称
- **rpc**：定义远程调用方法的固定关键字
- **SayHello**：自定义接口方法名
- **\(HelloRequest\)**：**请求入参**，必须是自定义 message
- **\(HelloResponse\)**：**响应出参**，必须是自定义 message
- 末尾空大括号：proto3 普通调用写法，无额外配置

Go复制代码

```text
syntax = "proto3"; // 指定proto版本
package hello_grpc;     // 指定默认包名

// 指定golang包名
option go_package = "./hello_grpc";

//定义rpc服务
service HelloService {
  // 定义函数
  rpc SayHello (HelloRequest) returns (HelloResponse) {}
}

// HelloRequest 请求内容
message HelloRequest {
  string name = 1;
  string message = 2;
}

// HelloResponse 响应内容
message HelloResponse{
  string name = 1;
  string message = 2;
}
```

proto文件没有高亮的话去下载一个grpc的插件

在grpc\_proto目录下执行

Go复制代码

```text
protoc -I . \
  --go_out=. \
  --go-grpc_out=. \
  .\hello.proto
```

或者在根目录下执行

Go复制代码

```text
protoc -I . --go_out=plugins=grpc:.\grpc_proto .\grpc_proto\hello.proto
```

我们可以编写一个bat文件，方便转换

set\.bat

Bash复制代码

```text
protoc -I . \
  --go_out=.\grpc_proto \
  --go_opt=paths=source_relative \
  --go-grpc_out=.\grpc_proto \
  --go-grpc_opt=paths=source_relative \
  .\grpc_proto\hello.proto
```

## 服务端

1. 编写一个结构体，名字叫什么不重要
2. 重要的是得实现protobuf中的所有方法
3. 监听端口
4. 注册服务

Go复制代码

```text
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/grpclog"
  "grpc_study/grpc_proto/hello_grpc"
  "net"
)

// HelloServer1 得有一个结构体，需要实现这个服务的全部方法,叫什么名字不重要
type HelloServer1 struct {
}

func (HelloServer1) SayHello(ctx context.Context, request *hello_grpc.HelloRequest) (pd *hello_grpc.HelloResponse, err error) {
  fmt.Println("入参：", request.Name, request.Message)
  pd = new(hello_grpc.HelloResponse)
  pd.Name = "你好"
  pd.Message = "ok"
  return
}

func main() {
  // 监听端口
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    grpclog.Fatalf("Failed to listen: %v", err)
  }
  
  // 创建一个gRPC服务器实例。
  s := grpc.NewServer()
  server := HelloServer1{}
  // 将server结构体注册为gRPC服务。
  hello_grpc.RegisterHelloServiceServer(s, &server)
  fmt.Println("grpc server running :8080")
  // 开始处理客户端请求。
  err = s.Serve(listen)
}
```

## 客户端

1. 建立连接
2. 调用方法

Go复制代码

```text
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/grpc_proto/hello_grpc"
  "log"
)

func main() {
  addr := ":8080"
  // 使用 grpc.Dial 创建一个到指定地址的 gRPC 连接。
  // 此处使用不安全的证书来实现 SSL/TLS 连接
  conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
  if err != nil {
    log.Fatalf(fmt.Sprintf("grpc connect addr [%s] 连接失败 %s", addr, err))
  }
  defer conn.Close()
  // 初始化客户端
  client := hello_grpc.NewHelloServiceClient(conn)
  result, err := client.SayHello(context.Background(), &hello_grpc.HelloRequest{
    Name:    "枫枫",
    Message: "ok",
  })
  fmt.Println(result, err)
}
```

如果需要经常操作这个连接对象，我们可以复用

Go复制代码

```text
func initClient() hello_grpc.HelloServiceClient {
  addr := ":8080"
  conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
  if err != nil {
    log.Fatalf(fmt.Sprintf("grpc connect addr [%s] 连接失败 %s", addr, err))
  }
  client := hello_grpc.NewHelloServiceClient(conn)
  return client
}

func main() {
  client := initClient()
  result, err := client.SayHello(context.Background(), &hello_grpc.HelloRequest{
    Name:    "枫枫",
    Message: "ok",
  })
  result, err = client.SayHello(context.Background(), &hello_grpc.HelloRequest{
    Name:    "哈哈哈",
    Message: "ok1",
  })
  
  fmt.Println(result, err)
}
```
