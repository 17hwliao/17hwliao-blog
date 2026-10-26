在go中写一个web服务非常发方便快速

当前最新的 go\-modole 已经默认整合到了go普通项目构建 \(内部只要有 go\.mod就行\)

远端仓库的 环境变量 要配置 国人维护的七牛云 :

[https://goproxy\.cn,direct](https://goproxy.cn,direct)

Web 开发 : 一个请求 一个响应 \-\-&gt; **w http\.ResponseWriter, r \*http\.Request ;**

`ioutil.ReadFile`**Go1\.16 \+ 废弃**，统一改用 `os.ReadFile`

```text
package main

import (
  "encoding/json"
  "fmt"
  "io"
  "net/http"
)

type Response struct {
  Code int    `json:"code"`
  Data any    `json:"data"`
  Msg  string `json:"msg"`
}

func GET(res http.ResponseWriter, req *http.Request) {
  // 获取参数
  fmt.Println(req.URL.String())

  byteData, _ := json.Marshal(Response{
    Code: 0,
    Data: map[string]any{},
    Msg:  "成功",
  })
  res.Write(byteData)

}

func POST(res http.ResponseWriter, req *http.Request) {
  // 获取参数
  byteData, _ := io.ReadAll(req.Body)
  fmt.Println(string(byteData))
  byteData, _ = json.Marshal(Response{
    Code: 0,
    Data: map[string]any{},
    Msg:  "成功",
  })
  res.Write(byteData)
}

func main() {

  http.HandleFunc("/get", GET)
  http.HandleFunc("/post", POST)

  fmt.Println("http server running: http://127.0.0.1:8080")
  http.ListenAndServe(":8080", nil)
}
```

但是在实际项目中使用原生go http库那会非常不方便。

主要体现在

1. 参数解析与验证
2. 路由不太明了
3. 响应处理比较原始
