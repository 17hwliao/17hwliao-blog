### 核心特性

- 组件化设计：提供 ChatModel、Embedding、Retriever、Tool 等丰富的原子组件
- 灵活编排：支持 Chain（链式）和 Graph（图式）两种编排方式
- 生态集成：支持 OpenAI、ARK、Ollama、Qwen 等多种大模型
- 高性能：基于 Go 语言，天然支持高并发场景
- 易扩展：清晰的接口设计，方便自定义组件

Eino 架构 :

```text
AI Application Layer
(React Agent, RAG, Multi-Agent)

Orchestration Layer
(Chain, Graph, Workflow)

Component Layer
(ChatModel, Tool, Retriever, etc.)

Integration Layer
(OpenAI, ARK, Milvus, Redis, etc.)
```

### 环境搭建

#### 前制要求

Go , Git , API key

#### 安装 Eino

```text
- 创建项目目录
mkdir eino-tutorial
cd eino-tutorial
- 初始化 Go 模板
go mod init eino-tutorial
-安装 Eino 核心库
go get github.com/cloudwego/eino
- 安装 Eino 扩展组件库
go get github.com/cloudwego/eino-ext
```

#### Hello Eino

```text
func main() {
	ctx := context.Background()
	apiKey := "sk-mimi"
  //创建对话模型对象 Apikey , Model , BaseURL 
	ChatModel, err := deepseek.NewChatModel(ctx, &deepseek.ChatModelConfig{
		APIKey:  apiKey,
		Model:   "deepseek-chat",
		BaseURL: "https://api.deepseek.com",
	})
	if err != nil {
		log.Fatalf("创建Model失败 : %v", err)
	}
  //使用schema.Message 拼凑 System 和 User的 message ; 
	messages := []*schema.Message{
		schema.SystemMessage("简短回复中文回答的小Ai助手"),
		schema.UserMessage("你好,简介一下Eino框架"),
	}
	//使用 Generate产出回答; 
  response, err := ChatModel.Generate(ctx, messages)
	if err != nil {
		log.Fatalf("消息未成功转发 : %v", err)
	}

	fmt.Printf("AI响应 : %s", response.Content)
//最后只用 response.ResponseMeta 中的信息查看本次请求实现后携带的模型终端的信息
	if response.ResponseMeta != nil && response.ResponseMeta.Usage != nil {
		fmt.Printf("\nToken 使用统计 : \n")
		fmt.Printf("输入token : %d\n", response.ResponseMeta.Usage.PromptTokens)
		fmt.Printf("输出token : %d\n", response.ResponseMeta.Usage.CompletionTokensDetails)
		fmt.Printf("总计token : %d\n", response.ResponseMeta.Usage.TotalTokens)
	}
}
```
