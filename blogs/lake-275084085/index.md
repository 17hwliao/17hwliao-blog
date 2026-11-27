```text
syntax = "proto3"; // 指定proto版本
package hello_grpc;     // 指定默认包名

// 指定golang包名
option go_package = "/hello_grpc";

//定义rpc服务
service HelloService {
  // 定义函数
  rpc SayHello (HelloRequest) returns (HelloResponse) {}
}

// HelloRequest 请求内容
message HelloRequest {
  string name = 1;  // 消息号
  string message = 2;
}

// HelloResponse 响应内容
message HelloResponse{
  string name = 1;
  string message = 2;
}
```

## 生成go文件

- **xxx\.pb\.go** 由 `protoc-gen-go` 生成 只干一件事：**生成请求、响应结构体、序列化代码** 对应 proto 里的 `message`
- **xxx\_grpc\.pb\.go** 由 `protoc-gen-go-grpc` 生成 只干一件事：**生成 gRPC 服务接口、服务端注册、客户端调用代码** 对应 proto 里的 `service + rpc`

```text
C:\Users\17hwliao\GolandProjects\awesomeProject6>cd grpc_proto
```

//每次使用的时候只需要修改一下下列命令的最后文件名参数 ;

```text
protoc -I . --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative hello.proto
```

Go复制代码

```text
option go_package = ".;xxx";
```

go\_package 表示在当前目录生成go文件，文件的包名是xxx

Go复制代码

```text
protoc -I . --go_out=plugins=grpc:./grpc_proto .\grpc_proto\hello.proto
```

proto文件只是定义接口方法

## proto语法

service 对应的就是go里面的接口，可以作为服务端，客户端

rpc 对应的就是结构体中的方法

message对应的也是结构体

## 数据类型

### 基本数据类型

Protocol Buffers复制代码

```text
message Request {
  double a1 = 1;
  float a2 = 2;
  int32 a3 = 3;
  uint32 a4 = 4;
  uint64 a5 = 5;
  sint32 a6 = 6;
  sint64 a7 = 7;
  fixed32 a8 = 8;
  fixed64 a9 = 9;
  sfixed32 a10 = 10;
  sfixed64 a11 = 11;
  bool a12 = 12;
  string a13 = 13;
  bytes a14 = 14;
}
```

对应go类型

Go复制代码

```text
type Request struct {
  state         protoimpl.MessageState
  sizeCache     protoimpl.SizeCache
  unknownFields protoimpl.UnknownFields

  A1  float64 `protobuf:"fixed64,1,opt,name=a1,proto3" json:"a1,omitempty"`
  A2  float32 `protobuf:"fixed32,2,opt,name=a2,proto3" json:"a2,omitempty"`
  A3  int32   `protobuf:"varint,3,opt,name=a3,proto3" json:"a3,omitempty"`
  A4  uint32  `protobuf:"varint,4,opt,name=a4,proto3" json:"a4,omitempty"`
  A5  uint64  `protobuf:"varint,5,opt,name=a5,proto3" json:"a5,omitempty"`
  A6  int32   `protobuf:"zigzag32,6,opt,name=a6,proto3" json:"a6,omitempty"`
  A7  int64   `protobuf:"zigzag64,7,opt,name=a7,proto3" json:"a7,omitempty"`
  A8  uint32  `protobuf:"fixed32,8,opt,name=a8,proto3" json:"a8,omitempty"`
  A9  uint64  `protobuf:"fixed64,9,opt,name=a9,proto3" json:"a9,omitempty"`
  A10 int32   `protobuf:"fixed32,10,opt,name=a10,proto3" json:"a10,omitempty"`
  A11 int64   `protobuf:"fixed64,11,opt,name=a11,proto3" json:"a11,omitempty"`
  A12 bool    `protobuf:"varint,12,opt,name=a12,proto3" json:"a12,omitempty"`
  A13 string  `protobuf:"bytes,13,opt,name=a13,proto3" json:"a13,omitempty"`
  A14 []byte  `protobuf:"bytes,14,opt,name=a14,proto3" json:"a14,omitempty"`
}
```

标量类型

<table class="ne-table" id="VBReQ"><tbody><tr><td width="250"><p class="ne-p" id="u7f1ed623"><span class="ne-text">.proto Type</span></p></td><td width="250"><p class="ne-p" id="uae9a0e29"><span class="ne-text">解释</span></p></td><td width="250"><p class="ne-p" id="u2bab05d6"><span class="ne-text">Go Type</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u34b242aa"><span class="ne-text">double</span></p></td><td width="250"></td><td width="250"><p class="ne-p" id="u39188ba7"><span class="ne-text">float64</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ufc3934af"><span class="ne-text">float</span></p></td><td width="250"></td><td width="250"><p class="ne-p" id="u2e8b7530"><span class="ne-text">float32</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ua9539a81"><span class="ne-text">int32</span></p></td><td width="250"><p class="ne-p" id="uffe6f472"><span class="ne-text">使用变长编码，对于负值的效率很低，如果你的域有可能有负值，请使用sint64替代</span></p></td><td width="250"><p class="ne-p" id="ubc3dd919"><span class="ne-text">int32</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ue1328b5d"><span class="ne-text">uint32</span></p></td><td width="250"><p class="ne-p" id="u2fc4b31f"><span class="ne-text">使用变长编码</span></p></td><td width="250"><p class="ne-p" id="uf8816e75"><span class="ne-text">uint32</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u201b19ac"><span class="ne-text">uint64</span></p></td><td width="250"><p class="ne-p" id="u0695b883"><span class="ne-text">使用变长编码</span></p></td><td width="250"><p class="ne-p" id="u8c37f7ef"><span class="ne-text">uint64</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ub27a920e"><span class="ne-text">sint32</span></p></td><td width="250"><p class="ne-p" id="uf47a6c36"><span class="ne-text">使用变长编码，这些编码在负值时比int32高效的多</span></p></td><td width="250"><p class="ne-p" id="uf602f82c"><span class="ne-text">int32</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u4f5e50da"><span class="ne-text">sint64</span></p></td><td width="250"><p class="ne-p" id="u1b2a797a"><span class="ne-text">使用变长编码，有符号的整型值。编码时比通常的int64高效</span></p></td><td width="250"><p class="ne-p" id="u578147f9"><span class="ne-text">int64</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uc03a6cb6"><span class="ne-text">fixed32</span></p></td><td width="250"><p class="ne-p" id="u2efa0c08"><span class="ne-text">总是4个字节，如果数值总是比总是比228大的话，这个类型会比uint32高效。</span></p></td><td width="250"><p class="ne-p" id="ud09a5b31"><span class="ne-text">uint32</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ua3abda03"><span class="ne-text">fixed64</span></p></td><td width="250"><p class="ne-p" id="ud77707f0"><span class="ne-text">总是8个字节，如果数值总是比总是比256大的话，这个类型会比uint64高效。</span></p></td><td width="250"><p class="ne-p" id="ud9062551"><span class="ne-text">uint64</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ud49dacfa"><span class="ne-text">sfixed32</span></p></td><td width="250"><p class="ne-p" id="u1680fbff"><span class="ne-text">总是4个字节</span></p></td><td width="250"><p class="ne-p" id="u6433662c"><span class="ne-text">int32</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u52fe9689"><span class="ne-text">sfixed64</span></p></td><td width="250"><p class="ne-p" id="u7c7f620a"><span class="ne-text">总是8个字节</span></p></td><td width="250"><p class="ne-p" id="u28c6083e"><span class="ne-text">int64</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ua492a1a9"><span class="ne-text">bool</span></p></td><td width="250"></td><td width="250"><p class="ne-p" id="ue6399bd6"><span class="ne-text">bool</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uff64415e"><span class="ne-text">string</span></p></td><td width="250"><p class="ne-p" id="u5aaf52de"><span class="ne-text">一个字符串必须是UTF-8编码或者7-bit ASCII编码的文本</span></p></td><td width="250"><p class="ne-p" id="ufdc8847d"><span class="ne-text">string</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ud3241b76"><span class="ne-text">bytes</span></p></td><td width="250"><p class="ne-p" id="u73198adc"><span class="ne-text">可能包含任意顺序的字节数据</span></p></td><td width="250"><p class="ne-p" id="uac1b3cd4"><span class="ne-text">[]byte</span></p></td></tr></tbody></table>

**标量类型如果没有被赋值，则不会被序列化，解析时，会赋予默认值**

- strings：空字符串
- bytes：空序列
- bools：false
- 数值类型：0

### 数组类型

Go复制代码

```text
message ArrayRequest {
  repeated int64 a1 = 1;
  repeated string a2 = 2;
  repeated Request request_list = 3;
}
```

go类型

Go复制代码

```text
type ArrayRequest struct {
  A1          []int64 
  A2          []string   
  RequestList []*Request
}
```

### map类型

键只能是基本类型

Go复制代码

```text
message MapRequest {
  map<int64, string> m_i_s = 1;
  map<string, bool> m_i_b = 2;
  map<string, ArrayRequest> m_i_arr = 3;
}
```

go类型

Go复制代码

```text
type MapRequest struct {

  MIS   map[int64]string
  MIB   map[string]bool
  MIArr map[string]*ArrayRequest
}
```

### 嵌套类型

Go复制代码

```text
message Q1 {
  message Q2{
    string name2 = 2;
  }
  string name1 = 1;
  Q2 q2 = 2;
}
```

Go复制代码

```text
type Q1 struct {
  state         protoimpl.MessageState
  sizeCache     protoimpl.SizeCache
  unknownFields protoimpl.UnknownFields

  Name1 string `protobuf:"bytes,1,opt,name=name1,proto3" json:"name1,omitempty"`
  Q2    *Q1_Q2 `protobuf:"bytes,2,opt,name=q2,proto3" json:"q2,omitempty"`
}
```

## 编写风格

1. 文件名建议下划线，例如：my\_student\.proto
2. 包名和目录名对应
3. 服务名、方法名、消息名均为大驼峰
4. 字段名为下划线

## 多服务

Go复制代码

```text
syntax = "proto3" ;
option go_package = "./duo_proto" ;

service TypeService {
  rpc Say(Request) returns (Response) {}
}

message Request{
  string name = 1 ;
}

message Response{
  string name = 1 ;
}

service OrderService {
  rpc Buy(Request) returns (Response) {}
}
```

### 服务端

Go复制代码

```text
package main

import (
	duo_proto "awesomeProject6/grpc_proto"
	"context"
	"fmt"
	"log"
	"net"

	"google.golang.org/grpc"
)

type VideoServer struct {
	duo_proto.UnimplementedTypeServiceServer
}

func (VideoServer) Say(ctx context.Context, request *duo_proto.Request) (res *duo_proto.Response, err error) {
	fmt.Println("Look VideoServer", request.Name)
	return &duo_proto.Response{
		Name: "VideoServer",
	}, nil
}

type OrderServer struct {
	duo_proto.UnimplementedOrderServiceServer
}

func (OrderServer) Buy(ctx context.Context, request *duo_proto.Request) (res *duo_proto.Response, err error) {
	fmt.Println("Look OrderServer", request.Name)
	return &duo_proto.Response{
		Name: "OrderServer",
	}, nil
}

func main() {
	listen, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatal(err)
	}
	server := grpc.NewServer()
	duo_proto.RegisterTypeServiceServer(server, &VideoServer{})
	duo_proto.RegisterOrderServiceServer(server, &OrderServer{})

	fmt.Println("server listening at localhost:50051")

	err = server.Serve(listen)
	if err != nil {
		log.Fatal(err)
	}
}

```

### 客户端

Go复制代码

```text
package main

import (
	duo_proto "awesomeProject6/grpc_proto"
	"context"
	"fmt"
	"log"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	addr := ":50051"
	connect, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal(fmt.Sprintf("grpc.NewClient failed: %v", err))
	}
	defer connect.Close()

	OrderServiceClient := duo_proto.NewOrderServiceClient(connect)
	res, err := OrderServiceClient.Buy(context.Background(), &duo_proto.Request{
		Name: "11",
	})
	fmt.Println(res, err)

	TypeServiceClient := duo_proto.NewTypeServiceClient(connect)
	res1, err1 := TypeServiceClient.Say(context.Background(), &duo_proto.Request{
		Name: "11",
	})
	fmt.Println(res1, err1)

}

```

## 多个proto文件

当项目大起来之后，会有很多个service，rpc，message

我们会将不同服务放在不同的proto文件中

还可以放一些公共的proto文件

对于这方面的资料，可以说全网的正确资料真的相当少

其实本质就是生成go文件，需要在一个包内

video\.proto

Protocol Buffers复制代码

```text
syntax = "proto3";
package proto1;
option go_package = "/proto";
import "common.proto";

service VideoService {
  rpc Look(Request)returns(Response){}
}
```

order\.proto

Protocol Buffers复制代码

```text
syntax = "proto3";
package proto;
option go_package = "/proto";
import "common.proto";

service OrderService {
  rpc Look(Request)returns(Response){}
}
```

common\.proto

Protocol Buffers复制代码

```text
syntax = "proto3";
package proto;
option go_package = "/proto";


message Request{
  string name = 1;
}
message Response{
  string name = 1;
}
```

生成命令

Protocol Buffers复制代码

```text
protoc -I .\service_proto --go_out=plugins=grpc:./service_proto .\service_proto\order.proto
protoc -I .\service_proto --go_out=plugins=grpc:./service_proto .\service_proto\video.proto
protoc -I .\service_proto --go_out=plugins=grpc:./service_proto .\service_proto\common.proto
```

有几个点需要注意

如果有import的话，必须得加上package

并且要和import的package相同
