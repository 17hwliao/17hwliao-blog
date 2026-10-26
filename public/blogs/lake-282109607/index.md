## 简介

**Eino ADK \(Agent Development Kit\) 参考 Google\-ADK 的设计，**

**提供了 Go 语言的 Agents 开发灵活组合框架，即 Agent、Multi\-Agent 开发框架，并为多 Agent 交互场景沉淀了通用的上下文传递、事件流分发和转换、任务控制权转让、中断与恢复、通用切面等能力。**

### ADK 的核心特性

```text
   ✅ 灵活的 Agent 抽象：支持 ChatModel Agent、Workflow Agent 等多种 Agent 类型
   ✅ 多 Agent 协作：支持 Sequential、Loop、Parallel 等多种工作流模式
   ✅ 任务控制权转让：Agent 之间可以动态转移任务
   ✅ 中断与恢复：支持 CheckPoint 机制，实现任务中断和恢复
   ✅ 事件流处理：提供异步事件流，支持流式输出
   ✅ 通用切面能力：支持 Callback、监控等切面功能
```

### ADK 的应用场景

```text
*   🤖 智能助手：构建能够调用工具的智能助手
*   🔄 复杂工作流：实现多步骤、多 Agent 协作的复杂任务
*   🎯 任务规划与执行：Plan-Execute-Replan 模式的任务处理
*   👥 多 Agent 系统：Supervisor Agent 管理多个子 Agent
*   🔁 迭代优化：Loop Agent 实现迭代反思和优化
```

## 安装

Eino 自 0\.5\.0 版本正式提供 ADK 功能。确保你的项目使用最新版本：

```text
# 升级到最新版本 (>= v0.5.0)
go get github.com/cloudwego/eino@latest
```

### Agent 的基础概念

### 简介

```text
Agent 是 Eino ADK 中的核心抽象，代表一个能够：
• 接收输入（用户消息）
• 处理任务（调用工具、调用其他 Agent）
• 生成输出（返回结果）
的智能体。
```

### Agent 接口

```text
type Agent interface {
    Name(ctx context.Context) string
    Description(ctx context.Context) string
    Run(ctx context.Context, input *AgentInput, opts ...AgentRunOption) *AsyncIterator[*AgentEvent]
    Resume(ctx context.Context, info *ResumeInfo, opts ...AgentRunOption) *AsyncIterator[*AgentEvent]
}
```

### Agent类型

Eino ADK 提供了多种 Agent 类型

```text
1. ChatModelAgent: 基于 ChatModel 的 Agent，支持工具调用
2. SequentialAgent: 顺序执行多个子 Agent
3. LoopAgent: 循环执行多个子 Agent，支持迭代优化
4. ParallelAgent: 并行执行多个子 Agent
5. Plan-Execute Agent: 预构建的规划-执行 Agent
```

## ChatModelAgent 的基础使用

### 创建简单的 ChatModelAgent

```text
func main(){
  ctx := context.Background()

// 1. 创建 ChatModel
chatModel, err := deepseek.NewChatModel(ctx, &deepseek.ChatModelConfig{
    APIKey:  os.Getenv("DEEPSEEK_API_KEY"),
    Model:   "deepseek-chat",
    BaseURL: "https://api.deepseek.com",
})
if err != nil {
    log.Fatalf("创建 ChatModel 失败: %v", err)
}

// 2. 创建 ChatModelAgent
agent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
    Name:        "SimpleAssistant",
    Description: "一个简单的助手 Agent，能够回答用户问题",
    Instruction: "你是一个友好的助手，请用简洁明了的方式回答用户问题。",
    Model:       chatModel,
    ToolsConfig: adk.ToolsConfig{}, // 不使用工具
})
if err != nil {
    log.Fatalf("创建 Agent 失败: %v", err)
}
// 3. 创建 Runner
runner := adk.NewRunner(ctx, adk.RunnerConfig{
    Agent:          agent,
    EnableStreaming: false,
})

// 4. 运行 Agent
query := "什么是java?"
fmt.Printf("用户: %s\n\n", query)
iter := runner.Query(ctx, query)
for {
    event, ok := iter.Next()
    if !ok {
        // 迭代器已关闭，退出循环
        break
    }

    if event.Err != nil {
         log.Fatalf("Agent 执行错误: %v", event.Err)
    }

    if event.Output != nil && event.Output.MessageOutput != nil {
        msg := event.Output.MessageOutput.Message
        if msg != nil {
            fmt.Printf("助手: %s\n", msg.Content)
        }
    }
}

}
```

### 创建一个带工具的 ChatModelAgent

```text
ctx := context.Background()

// 1. 创建 ChatModel
chatModel, err := deepseek.NewChatModel(ctx, &deepseek.ChatModelConfig{
    APIKey:  os.Getenv("DEEPSEEK_API_KEY"),
    Model:   "deepseek-chat",
    BaseURL: "https://api.deepseek.com",
})
if err != nil {
    log.Fatalf("创建 ChatModel 失败: %v", err)
}

// 2. 创建工具
// 获取当前时间的工具
timeTool := utils.NewTool(
    &schema.ToolInfo{
        Name:        "get_current_time",
        Desc:        "获取当前时间",
        ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{}),
    },
    func(ctx context.Context, params map[string]any) (string, error) {
        return time.Now().Format("2006-01-02 15:04:05"), nil
    },
)

// 计算器工具
calculatorTool := utils.NewTool(
    &schema.ToolInfo{
        Name: "calculator",
        Desc: "执行数学计算，支持加减乘除",
        ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
            "expression": {
                Desc:      "数学表达式，例如：2 + 3 * 4",
                Required:  true,
                Type:      schema.String,
            },
        }),
    },
    func(ctx context.Context, params map[string]any) (string, error) {
        _, ok := params["expression"].(string)
        if !ok {
            return "", fmt.Errorf("expression 必须是字符串")
        }
        // 简单的计算器实现（实际应用中应使用更安全的计算方式）
        result := eval
        return fmt.Sprintf("%.2f", result), nil
    },
)

// 3. 创建 ChatModelAgent (带工具)
agent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
    Name:        "ToolAssistant",
    Description: "一个能够使用工具的助手 Agent",
    Instruction: `你是一个智能助手，可以使用以下工具：
- get_current_time: 获取当前时间
- calculator: 执行数学计算

当用户需要获取时间或进行计算时，请调用相应的工具。`,
    Model: chatModel,
    ToolsConfig: adk.ToolsConfig{
        ToolsNodeConfig: compose.ToolsNodeConfig{
            Tools: []tool.BaseTool{timeTool, calculatorTool},
        },
    },
    MaxIterations: 10, // 最多执行 10 次工具调用
})
if err != nil {
    log.Fatalf("创建 Agent 失败: %v", err)
}

// 4. 创建 Runner
runner := adk.NewRunner(ctx, adk.RunnerConfig{
    Agent:          agent,
    EnableStreaming: false,
})

// 5. 测试 Agent
queries := []string{
    "现在几点了？",
    "帮我计算 123 + 456 * 789",
}

for _, query := range queries {
    fmt.Printf("\n=== 用户: %s ===\n", query)
    iter := runner.Query(ctx, query)
    for {
        event, ok := iter.Next()
        if !ok {
            // 迭代器已关闭，退出循环
            break
        }

        if event.Err != nil {
            log.Fatalf("Agent 执行错误: %v", event.Err)
        }

        if event.Output != nil && event.Output.MessageOutput != nil {
            msg := event.Output.MessageOutput.Message
            if msg != nil {
                // 检查是否有工具调用
                if len(msg.ToolCalls) > 0 {
                    for _, tc := range msg.ToolCalls {
                        fmt.Printf("调用工具: %s\n", tc.Function.Name)
                    }
                } else if msg.Content != "" {
                    fmt.Printf("助手: %s\n", msg.Content)
                }
            }
        }
    }
}
```

## Workflow Agent

**用于组合多个子agent , 实现复杂的工作流**

### SequentialAgent\(顺序执行\)

SequentialAgent 按顺序执行多个子Agent,前一个 Agent 的输出作为了后一个 Agent 的输入 ;

```text
ctx := context.Background()

// 1. 创建 ChatModel
chatModel, err := deepseek.NewChatModel(ctx, &deepseek.ChatModelConfig{
    APIKey:  os.Getenv("DEEPSEEK_API_KEY"),
    Model:   "deepseek-chat",
    BaseURL: "https://api.deepseek.com",
})
if err != nil {
    log.Fatalf("创建 ChatModel 失败: %v", err)
}

// 2. 创建多个子 Agent
// Agent 1: 分析用户需求
analyzerAgent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
    Name:        "Analyzer",
    Description: "分析用户需求，提取关键信息",
    Instruction: "你是一个需求分析师，请分析用户的需求，提取关键信息。",
    Model:       chatModel,
    OutputKey:   "analysis", // 将输出存储到 session 的 "analysis" 键
})
if err != nil {
    log.Fatalf("创建 Analyzer Agent 失败: %v", err)
}

// Agent 2: 生成解决方案
solutionAgent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
    Name:        "SolutionGenerator",
    Description: "根据分析结果生成解决方案",
    Instruction: `你是一个解决方案生成器。请根据需求分析结果生成详细的解决方案。
可以使用 {analysis} 获取需求分析结果。`,
    Model: chatModel,
})
if err != nil {
    log.Fatalf("创建 SolutionGenerator Agent 失败: %v", err)
}

// 3. 创建 SequentialAgent
sequentialAgent, err := adk.NewSequentialAgent(ctx, &adk.SequentialAgentConfig{
    Name:       "AnalysisWorkflow",
    Description: "需求分析和解决方案生成工作流",
    SubAgents:  []adk.Agent{analyzerAgent, solutionAgent},
})
if err != nil {
    log.Fatalf("创建 SequentialAgent 失败: %v", err)
}

// 4. 创建 Runner
runner := adk.NewRunner(ctx, adk.RunnerConfig{
    Agent:          sequentialAgent,
    EnableStreaming: false,
})

// 5. 运行工作流
query := "我想开发一个智能客服系统，需要支持多轮对话和知识库检索"
fmt.Printf("用户: %s\n\n", query)

iter := runner.Query(ctx, query)
for {
    event, ok := iter.Next()
    if !ok {
        // 迭代器已关闭，退出循环
        break
    }

    if event.Err != nil {
        log.Fatalf("工作流执行错误: %v", event.Err)
    }

    if event.Output != nil && event.Output.MessageOutput != nil {
        msg := event.Output.MessageOutput.Message
        if msg != nil {
            fmt.Printf("[%s]: %s\n", event.AgentName, msg.Content)
        }
    }
}
```

### LoopAgent \(循环执行\)

循环执行多个子Agent , 直到满足退出的要求 或 达到最大的迭代次数 ;

```text
// 1. 创建 ChatModel
chatModel, err := deepseek.NewChatModel(ctx, &deepseek.ChatModelConfig{
    APIKey:  os.Getenv("DEEPSEEK_API_KEY"),
    Model:   "deepseek-chat",
    BaseURL: "https://api.deepseek.com",
})
if err != nil {
    log.Fatalf("创建 ChatModel 失败: %v", err)
}

// 2. 创建两个子 Agent
// Agent 1: 主任务解决 Agent
mainAgent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
    Name:        "MainAgent",
    Description: "负责生成初步解决方案",
    Instruction: `你是一个问题解决专家。请根据用户问题生成详细的解决方案。
如果解决方案需要改进，请说明需要改进的地方。`,
    Model:     chatModel,
    OutputKey: "solution",
})
if err != nil {
    log.Fatalf("创建 MainAgent 失败: %v", err)
}

// Agent 2: 批判反馈 Agent
critiqueAgent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
    Name:        "CritiqueAgent",
    Description: "对解决方案进行批判和反馈",
    Instruction: `你是一个质量审查专家。请审查解决方案的质量，提供改进建议。
如果解决方案已经足够好，请明确说明"解决方案已完善，无需进一步改进"。
可以使用 {solution} 获取当前的解决方案。`,
    Model:     chatModel,
    OutputKey: "critique",
})
if err != nil {
    log.Fatalf("创建 CritiqueAgent 失败: %v", err)
}

// 3. 创建 LoopAgent
loopAgent, err := adk.NewLoopAgent(ctx, &adk.LoopAgentConfig{
    Name:        "ReflectionAgent",
    Description: "迭代反思型智能体，通过多轮迭代优化解决方案",
    SubAgents:   []adk.Agent{mainAgent, critiqueAgent},
    MaxIterations: 5, // 最多迭代 5 次
})
if err != nil {
    log.Fatalf("创建 LoopAgent 失败: %v", err)
}

// 4. 创建 Runner
runner := adk.NewRunner(ctx, adk.RunnerConfig{
    Agent:          loopAgent,
    EnableStreaming: false,
})

// 5. 运行迭代优化流程
query := "如何设计一个高性能的分布式缓存系统？"
fmt.Printf("用户: %s\n\n", query)

iter := runner.Query(ctx, query)
iteration := 0

for {
    event, ok := iter.Next()
    if !ok {
        // 迭代器已关闭，退出循环
        break
    }

    if event.Err != nil {
        log.Fatalf("迭代流程执行错误: %v", event.Err)
    }

    if event.Output != nil && event.Output.MessageOutput != nil {
        msg := event.Output.MessageOutput.Message
        if msg != nil {
            if event.AgentName == "MainAgent" {
                iteration++
                fmt.Printf("\n=== 迭代 %d: 生成解决方案 ===\n", iteration)
            } else if event.AgentName == "CritiqueAgent" {
                fmt.Printf("\n=== 迭代 %d: 批判反馈 ===\n", iteration)
            }
            fmt.Printf("[%s]: %s\n", event.AgentName, msg.Content)
        }
    }
}
```

### ParallelAgent \(并行执行\)

ParallelAgent 并行执行多个子Agent , 实现独立的任务处理;

```text
ctx := context.Background()

// 1. 创建 ChatModel
chatModel, err := deepseek.NewChatModel(ctx, &deepseek.ChatModelConfig{
    APIKey:  os.Getenv("DEEPSEEK_API_KEY"),
    Model:   "deepseek-chat",
    BaseURL: "https://api.deepseek.com",
})
if err != nil {
    log.Fatalf("创建 ChatModel 失败: %v", err)
}

// 2. 创建多个并行执行的 Agent
// Agent 1: 技术调研
techAgent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
    Name:        "TechResearcher",
    Description: "负责技术调研",
    Instruction: "你是一个技术研究员，请调研相关技术方案。",
    Model:       chatModel,
    OutputKey:   "tech_research",
})
if err != nil {
    log.Fatalf("创建 TechResearcher Agent 失败: %v", err)
}

// Agent 2: 市场分析
marketAgent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
    Name:        "MarketAnalyst",
    Description: "负责市场分析",
    Instruction: "你是一个市场分析师，请分析市场趋势和竞争对手。",
    Model:       chatModel,
    OutputKey:   "market_analysis",
})
if err != nil {
    log.Fatalf("创建 MarketAnalyst Agent 失败: %v", err)
}

// Agent 3: 风险评估
riskAgent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
    Name:        "RiskAssessor",
    Description: "负责风险评估",
    Instruction: "你是一个风险评估专家，请评估项目的潜在风险。",
    Model:       chatModel,
    OutputKey:   "risk_assessment",
})
if err != nil {
    log.Fatalf("创建 RiskAssessor Agent 失败: %v", err)
}

// 3. 创建 ParallelAgent
parallelAgent, err := adk.NewParallelAgent(ctx, &adk.ParallelAgentConfig{
    Name:        "DataCollectionAgent",
    Description: "并发信息收集 Agent，同时进行技术调研、市场分析和风险评估",
    SubAgents:   []adk.Agent{techAgent, marketAgent, riskAgent},
})
if err != nil {
    log.Fatalf("创建 ParallelAgent 失败: %v", err)
}

// 4. 创建 Runner
runner := adk.NewRunner(ctx, adk.RunnerConfig{
    Agent:          parallelAgent,
    EnableStreaming: false,
})

// 5. 运行并行任务
query := "请帮我分析一下开发一个 AI 代码助手项目的可行性"
fmt.Printf("用户: %s\n\n", query)

iter := runner.Query(ctx, query)
for {
    event, ok := iter.Next()
    if !ok {
        // 迭代器已关闭，退出循环
        break
    }

    if event.Err != nil {
        log.Fatalf("并行任务执行错误: %v", event.Err)
    }

    if event.Output != nil && event.Output.MessageOutput != nil {
        msg := event.Output.MessageOutput.Message
        if msg != nil {
            fmt.Printf("[%s]: %s\n\n", event.AgentName, msg.Content)
        }
    }
}
```

### 中断和恢复 \(CheckPoint\)

ADK 支持任务的 终端 和 恢复 , 对于长时间运行的任务非常有效 ;

#### 使用 CheckPoint Store

```text
var _ compose.CheckPointStore = (*memoryCheckPointStore)(nil)

// 简单的内存 CheckPoint Store 实现
type memoryCheckPointStore struct {
    mu   sync.RWMutex
    data map[string][]byte
}

func newMemoryCheckPointStore() *memoryCheckPointStore {
    return &memoryCheckPointStore{
        data: make(map[string][]byte),
    }
}

func (s *memoryCheckPointStore) Get(ctx context.Context, checkPointID string) ([]byte, bool, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    data, ok := s.data[checkPointID]
    return data, ok, nil
}

func (s *memoryCheckPointStore) Set(ctx context.Context, checkPointID string, data []byte) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.data[checkPointID] = data
    return nil
}

func main() {
    ctx := context.Background()

    // 1. 创建 ChatModel
    chatModel, err := deepseek.NewChatModel(ctx, &deepseek.ChatModelConfig{
        APIKey:  os.Getenv("DEEPSEEK_API_KEY"),
        Model:   "deepseek-chat",
        BaseURL: "https://api.deepseek.com",
    })
    if err != nil {
        log.Fatalf("创建 ChatModel 失败: %v", err)
    }

    // 2. 创建 Agent
    agent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
        Name:        "BookRecommender",
        Description: "书籍推荐 Agent",
        Instruction: "你是一个书籍推荐专家，请根据用户需求推荐合适的书籍。",
        Model:       chatModel,
    })
    if err != nil {
        log.Fatalf("创建 Agent 失败: %v", err)
    }

    // 3. 创建 CheckPoint Store
    store := newMemoryCheckPointStore()

    // 4. 创建 Runner (带 CheckPoint Store)
    runner := adk.NewRunner(ctx, adk.RunnerConfig{
        Agent:          agent,
        EnableStreaming: false,
        CheckPointStore: store,
    })

    // 5. 运行 Agent (带 CheckPoint ID)
    checkPointID := "session_001"
    query := "我想学习 Go 语言，请推荐一些书籍"
    fmt.Printf("用户: %s\n\n", query)

    iter := runner.Run(ctx, []adk.Message{
        schema.UserMessage(query),
    }, adk.WithCheckPointID(checkPointID))

    // 处理事件...
    for {
        event, ok := iter.Next()
        if !ok {
            // 迭代器已关闭，退出循环
            break
        }

        if event.Err != nil {
            log.Fatalf("Agent 执行错误: %v", event.Err)
        }

        if event.Output != nil && event.Output.MessageOutput != nil {
            msg := event.Output.MessageOutput.Message
            if msg != nil {
                fmt.Printf("助手: %s\n", msg.Content)
            }
        }
    }

    // 6. 恢复任务（如果需要）
    // resumeIter, err := runner.Resume(ctx, checkPointID)
    // if err != nil {
    //     log.Fatalf("恢复任务失败: %v", err)
    // }
    // ... 处理恢复的事件
}
```

### 流式输出

```text
runner := adk.NewRunner(ctx,adk.RunnerConfig{
    Agent : agent , 
    EnableStreaming : true , //启用流式输出
})
```

### 任务转移 \(Transfer to Agent\) \[generalAgentWithSubs关联Agent\]

Agent 之间可以实现动态的任务转移; 实现更灵活的协作 ;

```text
func main() {
    ctx := context.Background()

    // 1. 创建 ChatModel
    chatModel, err := deepseek.NewChatModel(ctx, &deepseek.ChatModelConfig{
        APIKey:  os.Getenv("DEEPSEEK_API_KEY"),
        Model:   "deepseek-chat",
        BaseURL: "https://api.deepseek.com",
    })
    if err != nil {
        log.Fatalf("创建 ChatModel 失败: %v", err)
    }

    // 2. 创建多个专业 Agent
    // Agent 1: 通用助手
    generalAgent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
        Name:        "GeneralAssistant",
        Description: "通用助手，可以处理各种问题，也可以将任务转移给专业 Agent",
        Instruction: `你是一个通用助手。你可以：
1. 直接回答简单问题
2. 将复杂的技术问题转移给 TechExpert
3. 将数学问题转移给 MathExpert`,
        Model: chatModel,
    })
    if err != nil {
        log.Fatalf("创建 GeneralAssistant Agent 失败: %v", err)
    }

    // Agent 2: 技术专家
    techAgent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
        Name:        "TechExpert",
        Description: "技术专家，专门处理编程和技术问题",
        Instruction: "你是一个技术专家，请详细解答编程和技术相关的问题。",
        Model:       chatModel,
    })
    if err != nil {
        log.Fatalf("创建 TechExpert Agent 失败: %v", err)
    }

    // Agent 3: 数学专家
    mathAgent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
        Name:        "MathExpert",
        Description: "数学专家，专门处理数学问题",
        Instruction: "你是一个数学专家，请详细解答数学相关的问题。",
        Model:       chatModel,
    })
    if err != nil {
        log.Fatalf("创建 MathExpert Agent 失败: %v", err)
    }

    // 3. 设置 Agent 关系 (让 generalAgent 知道其他 Agent)
    generalAgentWithSubs, err := adk.SetSubAgents(ctx, generalAgent, []adk.Agent{techAgent, mathAgent})
    if err != nil {
        log.Fatalf("设置子 Agent 失败: %v", err)
    }

    // 4. 创建 Runner
    runner := adk.NewRunner(ctx, adk.RunnerConfig{
        Agent:          generalAgentWithSubs,
        EnableStreaming: false,
    })

    // 5. 测试任务转移
    queries := []string{
        "你好，今天天气怎么样？",      // 通用问题
        "Go 语言中如何实现并发？",    // 技术问题 (应转移给 TechExpert)
        "如何计算圆的面积？",        // 数学问题 (应转移给 MathExpert)
    }

    for _, query := range queries {
        fmt.Printf("\n=== 用户: %s ===\n", query)
        iter := runner.Query(ctx, query)
        for {
            event, ok := iter.Next()
            if !ok {
                // 迭代器已关闭，退出循环
                break
            }

            if event.Err != nil {
                log.Fatalf("Agent 执行错误: %v", event.Err)
            }

            if event.Output != nil && event.Output.MessageOutput != nil {
                msg := event.Output.MessageOutput.Message
                if msg != nil {
                    // 检查是否有工具调用 (任务转移)
                    if len(msg.ToolCalls) > 0 {
                        for _, tc := range msg.ToolCalls {
                            if tc.Function.Name == "transfer_to_agent" {
                                // 解析参数获取目标 Agent 名称
                                // 注意：这里需要解析 JSON 参数
                                fmt.Printf("任务转移: %s -> %s\n", event.AgentName, tc.Function.Arguments)
                            }
                        }
                    } else if msg.Content != "" {
                        fmt.Printf("[%s]: %s\n", event.AgentName, msg.Content)
                    }
                }
            }
        }
    }
}
```

# 完整的开发实例

```text

var _ compose.CheckPointStore = (*memoryStore)(nil)

// 内存 CheckPoint Store
type memoryStore struct {
	mu   sync.RWMutex
	data map[string][]byte
}

func newMemoryStore() *memoryStore {
	return &memoryStore{data: make(map[string][]byte)}
}

func (s *memoryStore) Get(ctx context.Context, checkPointID string) ([]byte, bool, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	data, ok := s.data[checkPointID]
	return data, ok, nil
}

func (s *memoryStore) Set(ctx context.Context, checkPointID string, data []byte) error {
	s.mu.Lock()
	defer s.mu.RUnlock()
	s.data[checkPointID] = data
	return nil
}

func main() {
	ctx := context.Background()
	// 1.创建 chatModel
	chatModel, err := ollama.NewChatModel(ctx, &ollama.ChatModelConfig{
		Model:   "sunjiajia",
		BaseURL: "http://127.0.0.1:11434",
	})
	if err != nil {
		log.Fatalf("创建 ChatModel 失败 %v", err)
	}
	// 2. 创建工具 : 搜索书籍
	bookSearchTool := utils.NewTool(
		&schema.ToolInfo{
			Name: "search_books",
			Desc: "搜索书籍信息",
			ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
				"keyword": {
					Desc:     "搜索关键词",
					Required: true,
					Type:     schema.String,
				},
			}),
		},
		func(ctx context.Context, params map[string]any) (string, error) {
			keyword := params["keyword"].(string)
			//模拟书籍搜索
			books := map[string][]string{
				"go":     {"<<Go并发编程>>"},
				"python": {"<<Python编程 : 入门到入土>>"},
			}
			if results, ok := books[keyword]; ok {
				return fmt.Sprint("找到以下的书籍 : %v", results), nil
			}
			return fmt.Sprintf("未找到关键词'%s' 相关的书籍", keyword), nil
		},
	)
	//3.创建工具 : 询问澄清
	asktool := utils.NewTool(
		&schema.ToolInfo{
			Name: "ask_for_clarification",
			Desc: "询问用户以获取更多的信息",
			ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
				"question": {
					Desc:     "要询问用户的问题",
					Required: true,
					Type:     schema.String,
				},
			}),
		},
		func(ctx context.Context, params map[string]any) (string, error) {
			question := params["question"].(string)
			return fmt.Sprintf("用户需要澄清:%s", question), nil
		},
	)
	// 4. 创建 Agent
	agent, err := adk.NewChatModelAgent(ctx, &adk.ChatModelAgentConfig{
		Name:        "BookRecommender",
		Description: "书籍推荐agent,能够搜索书籍并询问用户爱好",
		Instruction: `你是一个书籍推荐专家。你可以：
1. 使用 search_books 工具搜索书籍
2. 使用 ask_for_clarification 工具询问用户的偏好
3. 根据搜索结果和用户偏好推荐合适的书籍`,
		Model: chatModel,
		ToolsConfig: adk.ToolsConfig{
			ToolsNodeConfig: compose.ToolsNodeConfig{
				Tools: []tool.BaseTool{bookSearchTool, asktool},
			},
		},
		Exit:          adk.ExitTool{}, //使用Exit工具
		MaxIterations: 10,
	})
	if err != nil {
		log.Fatalf("创建 Agent 失败 : %w", err)
	}
	//5.创建 CheckPoint Store
	store := newMemoryStore()

	//6.创建 Runner
	runner := adk.NewRunner(ctx, adk.RunnerConfig{
		Agent:           agent,
		EnableStreaming: true,
		CheckPointStore: store,
	})

	//7.运行 Agent
	checkPointID := "book_recommendation_001"
	query := "我想学习Go语言"
	fmt.Printf("用户 : %s\n", query)

	iter := runner.Run(ctx, []adk.Message{
		schema.UserMessage(query),
	}, adk.WithCheckPointID(checkPointID))

	for {
		event, ok := iter.Next()
		if !ok {
			break
		}
		if event.Err != nil {
			log.Fatalf("Agent 执行错误 : %w", event.Err)
		}
		if event.Output != nil && event.Output.MessageOutput != nil {
			msg := event.Output.MessageOutput.Message
			if msg != nil {
				if len(msg.ToolCalls) > 0 {
					for _, tc := range msg.ToolCalls {
						fmt.Printf("%s", tc.Function.Name)
					}
				} else if msg.Content != "" {
					fmt.Printf("%s", msg.Content)
				}
			}
		}
	}

}
```
