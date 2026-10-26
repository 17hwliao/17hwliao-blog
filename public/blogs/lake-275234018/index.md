![](</blogs/_assets/lakebook/3580f21d62e384b2c868dc67.png>)

## 普通rpc

一问一答式

Protocol Buffers复制代码

```text
syntax = "proto3";
option go_package = "/proto";

service Simple {
  rpc Fun(Request)returns(Response){}
}
message Request {
  string name = 1;
}
message Response {
  string Text = 1;
}
```

服务端，客户端，代码同上期

## 服务端流式

### 服务端

Go复制代码

```text
package main

import (
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/stream_proto/proto"
  "log"
  "net"
)

type ServiceStream struct{}

func (ServiceStream) Fun(request *proto.Request, stream proto.ServiceStream_FunServer) error {
  fmt.Println(request)
  for i := 0; i < 10; i++ {
    stream.Send(&proto.Response{
      Text: fmt.Sprintf("第%d轮数据", i),
    })
  }
  return nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  server := grpc.NewServer()
  proto.RegisterServiceStreamServer(server, &ServiceStream{})

  server.Serve(listen)
}
```

### 客户端

Go复制代码

```text
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/stream_proto/proto"
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
  client := proto.NewServiceStreamClient(conn)

  stream, err := client.Fun(context.Background(), &proto.Request{
    Name: "张三",
  })
  for i := 0; i < 10; i++ {
    response, err := stream.Recv()
    fmt.Println(response, err)
  }

}
```

### 客户端不知道服务端什么时候结束

Go复制代码

```text
stream, err := client.Fun(context.Background(), &proto.Request{
  Name: "张三",
})
for {
  response, err := stream.Recv()
  if err == io.EOF {
    break
  }
  fmt.Println(response)
}
```

### 下载文件

proto文件

Protocol Buffers复制代码

```text
syntax = "proto3";
option go_package = "/proto";


message Request {
  string name = 1;
}

message FileResponse{
  string file_name = 1;
  bytes content = 2;
}
service ServiceStream{
  rpc DownLoadFile(Request)returns(stream FileResponse){}
}


// protoc -I . --go_out=plugins=grpc:./stream_proto .\stream_proto\stream.proto
```

服务端

Go复制代码

```text
package main

import (
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/stream_proto/proto"
  "io"
  "log"
  "net"
  "os"
)

type ServiceStream struct{}


func (ServiceStream) DownLoadFile(request *proto.Request, stream proto.ServiceStream_DownLoadFileServer) error {
  fmt.Println(request)
  file, err := os.Open("static/1.gvb_web项目搭建.mp4")
  if err != nil {
    return err
  }
  defer file.Close()

  for {
    buf := make([]byte, 2048)
    _, err = file.Read(buf)
    if err == io.EOF {
      break
    }
    if err != nil {
      break
    }
    stream.Send(&proto.FileResponse{
      Content: buf,
    })
  }
  return nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  server := grpc.NewServer()
  proto.RegisterServiceStreamServer(server, &ServiceStream{})

  server.Serve(listen)
}
```

客户端

Go复制代码

```text
package main

import (
  "bufio"
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/stream_proto/proto"
  "io"
  "log"
  "os"
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
  client := proto.NewServiceStreamClient(conn)
  
  stream, err := client.DownLoadFile(context.Background(), &proto.Request{
    Name: "张三",
  })

  file, err := os.OpenFile("static/1.gvb_web项目搭建1.mp4", os.O_CREATE|os.O_WRONLY, 0600)
  if err != nil {
    log.Fatalln(err)
  }
  defer file.Close()

  writer := bufio.NewWriter(file)
  var index int
  for {
    index++
    response, err := stream.Recv()
    if err == io.EOF {
      break
    }
    fmt.Printf("第%d 次， 写入 %d 数据\n", index, len(response.Content))
    writer.Write(response.Content)
  }
  writer.Flush()
}
```

## 客户端流式

proto

Protocol Buffers复制代码

```text
syntax = "proto3";
option go_package = "/proto";
message Response {
  string Text = 1;
}
message FileRequest{
  string file_name = 1;
  bytes content = 2;
}
service ClientStream{
  rpc UploadFile(stream FileRequest)returns(Response){}
}
```

### 服务端

Go复制代码

```text
package main

import (
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/stream_proto/proto"
  "log"
  "net"
)

type ClientStream struct{}

func (ClientStream) UploadFile(stream proto.ClientStream_UploadFileServer) error {
  for i := 0; i < 10; i++ {
    response, err := stream.Recv()
    fmt.Println(response, err)
  }
  stream.SendAndClose(&proto.Response{Text: "完毕了"})
  return nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  server := grpc.NewServer()
  proto.RegisterClientStreamServer(server, &ClientStream{})

  server.Serve(listen)
}
```

### 客户端

Go复制代码

```text
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/stream_proto/proto"
  "log"
)

func main() {
  addr := ":8080"
  conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
  if err != nil {
    log.Fatalf(fmt.Sprintf("grpc connect addr [%s] 连接失败 %s", addr, err))
  }
  defer conn.Close()
  // 初始化客户端
  client := proto.NewClientStreamClient(conn)
  stream, err := client.UploadFile(context.Background())
  for i := 0; i < 10; i++ {
    stream.Send(&proto.FileRequest{FileName: fmt.Sprintf("第%d次", i)})
  }
  response, err := stream.CloseAndRecv()
  fmt.Println(response, err)
}
```

### 上传文件

服务端

Go复制代码

```text
package main

import (
  "bufio"
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/stream_proto/proto"
  "io"
  "log"
  "net"
  "os"
)

type ClientStream struct{}

func (ClientStream) UploadFile(stream proto.ClientStream_UploadFileServer) error {

  file, err := os.OpenFile("static/x.png", os.O_CREATE|os.O_WRONLY, 0600)
  if err != nil {
    log.Fatalln(err)
  }
  defer file.Close()

  writer := bufio.NewWriter(file)
  var index int
  for {
    index++
    response, err := stream.Recv()
    if err == io.EOF {
      break
    }
    writer.Write(response.Content)
    fmt.Printf("第%d次", index)
  }
  writer.Flush()
  stream.SendAndClose(&proto.Response{Text: "完毕了"})
  return nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  server := grpc.NewServer()
  proto.RegisterClientStreamServer(server, &ClientStream{})

  server.Serve(listen)
}
```

客户端

Go复制代码

```text
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/stream_proto/proto"
  "io"
  "log"
  "os"
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
  client := proto.NewClientStreamClient(conn)
  stream, err := client.UploadFile(context.Background())

  file, err := os.Open("static/21.png")
  if err != nil {
    log.Fatalln(err)
  }
  defer file.Close()

  for {
    buf := make([]byte, 2048)
    _, err = file.Read(buf)
    if err == io.EOF {
      break
    }
    if err != nil {
      break
    }
    stream.Send(&proto.FileRequest{
      FileName: "x.png",
      Content:  buf,
    })
  }
  response, err := stream.CloseAndRecv()
  fmt.Println(response, err)
}
```

## 双向流

proto

Protocol Buffers复制代码

```text
syntax = "proto3";
option go_package = "/proto";

message Request {
  string name = 1;
}
message Response {
  string Text = 1;
}

service BothStream{
  rpc Chat(stream Request)returns(stream Response){}
}
```

### 服务端

Go复制代码

```text
package main

import (
  "fmt"
  "google.golang.org/grpc"
  "grpc_study/stream_proto/proto"
  "log"
  "net"
)

type BothStream struct{}

func (BothStream) Chat(stream proto.BothStream_ChatServer) error {
  for i := 0; i < 10; i++ {
    request, _ := stream.Recv()
    fmt.Println(request)
    stream.Send(&proto.Response{
      Text: "你好",
    })
  }
  return nil
}

func main() {
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    log.Fatal(err)
  }
  server := grpc.NewServer()
  proto.RegisterBothStreamServer(server, &BothStream{})

  server.Serve(listen)
}
```

### 客户端

Go复制代码

```text
package main

import (
  "context"
  "fmt"
  "google.golang.org/grpc"
  "google.golang.org/grpc/credentials/insecure"
  "grpc_study/stream_proto/proto"
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
  client := proto.NewBothStreamClient(conn)
  stream, err := client.Chat(context.Background())

  for i := 0; i < 10; i++ {
    stream.Send(&proto.Request{
      Name: fmt.Sprintf("第%d次", i),
    })
    response, err := stream.Recv()
    fmt.Println(response, err)
  }
}
```

Protocol Buffers复制代码
