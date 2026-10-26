服务端

Go复制代码

```text
package main

import (
  "fmt"
  "net"
  "net/http"
  "net/rpc"
)

type Server struct {
}
type Req struct {
  Num1 int
  Num2 int
}
type Res struct {
  Num int
}

func (s Server) Add(req Req, res *Res) error {
  res.Num = req.Num1 + req.Num2
  return nil
}

func main() {
  // 注册rpc服务
  rpc.Register(new(Server))
  rpc.HandleHTTP()
  listen, err := net.Listen("tcp", ":8080")
  if err != nil {
    fmt.Println(err)
    return
  }
  http.Serve(listen, nil)
}
```

客户端

Go复制代码

```text
package main

import (
  "fmt"
  "net/rpc"
)

type Req struct {
  Num1 int
  Num2 int
}
type Res struct {
  Num int
}

func main() {
  req := Req{1, 2}
  client, err := rpc.DialHTTP("tcp", ":8080")
  if err != nil {
    fmt.Println(err)
    return
  }
  var res Res
  client.Call("Server.Add", req, &res)
  fmt.Println(res)
}
```

原生rpc的问题：

1. 编写相对复杂，需要自己去关注实现过程
2. 没有代码提示，容易写错
