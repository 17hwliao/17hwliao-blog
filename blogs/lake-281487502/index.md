## 简介

React Agent 是一种能够推理（Reasoning）和行动（Acting）循环的智能代理。它能够：

```text
1. 🟢 理解用户的意图  
2. 🔍 规划需要使用哪些工具  
3. ⚙️ 执行工具调用  
4. 📊 分析工具返回的结果  
5. 💡 生成最终答复
```

### React 循环流程

```text
用户输入  
↓  
[思考] AI 分析任务  
↓  
[决策] 需要调用工具吗？  
    |— 是 → [行动] 调用工具 → [观察] 获取结果 → 返回[思考]  
    |— 否 → [回答] 生成最终答复 → 结束
```

### React 对比 ChatModel

<table class="ne-table" id="SXf9U"><tbody><tr><td width="250"><p class="ne-p" id="uafe03d5e"><span class="ne-text">特性</span></p></td><td width="250"><p class="ne-p" id="uadd99654"><span class="ne-text">普通 ChatModel</span></p></td><td width="250"><p class="ne-p" id="ud2145b90"><span class="ne-text">React  Agent </span></p></td></tr><tr><td width="250"><p class="ne-p" id="ua5b1384c"><span class="ne-text">能力范围</span></p></td><td width="250"><p class="ne-p" id="udb15cd44"><span class="ne-text">仅限训练数据</span></p></td><td width="250"><p class="ne-p" id="ua7b71fa7"><span class="ne-text">可以调用外部工具</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u31860c10"><span class="ne-text">实时数据</span></p></td><td width="250"><p class="ne-p" id="u0dd4221d"><span class="ne-text">不可以</span></p></td><td width="250"><p class="ne-p" id="u46951cbd"><span class="ne-text">可以</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u9b97134a"><span class="ne-text">复杂任务</span></p></td><td width="250"><p class="ne-p" id="ud981eac0"><span class="ne-text">受限</span></p></td><td width="250"><p class="ne-p" id="uf2640d1d"><span class="ne-text">可分布执行</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uc8f7ccd3"><span class="ne-text">工具使用</span></p></td><td width="250"><p class="ne-p" id="u0eb59564"><span class="ne-text">不可以</span></p></td><td width="250"><p class="ne-p" id="u6c0e943f"><span class="ne-text">支持自主选择和调用</span></p></td></tr></tbody></table>

#### 基础的示例 : 简单的 React Agent

```text
1. - 创建 ctx + chatModel ; 
2. 创建工具
// 获取当前时间的工具
timeTool := utils.NewTool(
&schema.ToolInfo{
    Name:    "get_current_time",
    Desc:    "获取当前时间",
    ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{}),
},
func(ctx context.Context, params map[string]any) (string, error) {
    now := time.Now().Format("2006-01-02 15:04:05")
    fmt.Printf("[工具执行] get_current_time -> %s\\n", now)
    return now, nil
}, 
// 简单计算器工具
calculator := utils.NewTool(
    &schema.ToolInfo{
        Name: "calculator",
        Desc: "执行简单的数学计算（加减乘除）",
        ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
            "expression": {
                Type:    "string",
                Desc:    "数学表达式，例如：10 + 5",
                Required: true,
            },
        }),
    },
    func(ctx context.Context, params map[string]any) (string, error) {
        expr := params["expression"].(string)
        // 简化：这里只演示，实际应该用真正的表达式解析
        result := "15" // 假设结果
        fmt.Printf("[工具执行] calculator(%s) -> %s\n", expr, result)
        return result, nil
    },
)
// 3. 创建 React Agent
agent, err := react.NewAgent(ctx, &react.AgentConfig{
    ToolCallingModel: chatModel,
    ToolsConfig: compose.ToolsNodeConfig{
    Tools: []tool.BaseTool{timeTool, calculator},
    },
}) 
if err != nil {
    log.Fatal("创建 Agent 失败: %v", err)
}
// 4. 使用 Agent
messages := []*schema.Message{
    schema.UserMessage("现在几点了？"),
}

fmt.Println("=== 用户：现在几点了？ ===\n")

response, err := agent.Generate(ctx, messages)
if err != nil {
    log.Fatal("生成失败: %v", err)
}

fmt.Printf("\n=== Agent 回答 ===\n%s\n", response.Content)
```

### 流式输出

```text
1. -ctx + chatModel
2. searchTool := utils.NewTool(
    &schema.ToolInfo{
        Name: "search",
        Desc: "搜索信息",
        ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
          "query": {
            Type:    "string",
            Desc:   "搜索关键词",
            Required: true,
          },
        },
    }),
func(ctx context.Context, params map[string]any)(string, error) {
    query := params["query"].(string)
    // 模拟搜索结果
    result := fmt.Sprintf("找到关于 '%s' 的信息: Go 是 Google 开发的编程语言，以并发和简洁著称。", query)
    fmt.Printf("\n[工具执行] search(%s)\n", query)
    return result, nil
    },
)
agent, err := react.NewAgent(ctx, &react.AgentConfig{
    ToolCallingModel: chatModel,
    ToolsConfig: compose.ToolsNodeConfig{
    Tools: []tool.BaseTool{searchTool},
    },
})

if err != nil {
    log.Fatal("创建 Agent 失败: %v", err)
}

// 流式调用
messages := []*schema.Message{
    schema.UserMessage("请告诉我 Go 语言的特点"),
}

fmt.Println("=== 用户: 请告诉我 Go 语言的特点 ===\n")
fmt.Println("Agent: ")

stream, err := agent.Stream(ctx, messages)
if err != nil {
    log.Fatal("流式生成失败: %v", err)
}
defer stream.Close()

// 逐块接收并打印
 for {
    chunk, err := stream.Recv()
    if err != nil {
        if errors.Is(err, io.EOF) {
            break
        }
        log.Fatal("接收失败: %v", err)
    }
    // 打印内容（打字机效果）
    fmt.Print(chunk.Content)
    fmt.Println("\n\n=== 完成 ===")
}
```

#### 项目实战 : 餐厅点餐系统

```text
// 餐厅数据结构
type Restaurant struct {
    ID       string   `json:"id"`
    Name     string   `json:"name"`
    Location string   `json:"location"`
    Cuisine  string   `json:"cuisine"`
    Rating   float64  `json:"rating"`
    Tags     []string `json:"tags"`
}
type Dish struct {
    Name   string  `json:"name"`
    Price  float64 `json:"price"`
    Desc   string  `json:"desc"`
    Spicy  bool    `json:"spicy"`
}

var restaurantDB = []Restaurant {
  {
    ID:      "r1",
    Name:    "川香阁",
    Location: "北京",
    Cuisine:  "川菜",
    Rating:   4.8,
    Tags:     []string{"辣", "正宗", "环境好"},
  },
  {
    ID:      "r2",
    Name:    "粤味轩",
    Location: "北京",
    Cuisine:  "粤菜",
    Rating:   4.6,
    Tags:     []string{"清淡", "海鲜", "精致"},
  },
}

var dishDB = map[string][]Dish{
  "r1": {
    {Name: "水煮鱼", Price: 88, Desc: "鲜嫩鱼肉，麻辣鲜香", Spicy: true},
    {Name: "宫保鸡丁", Price: 48, Desc: "经典川菜，香辣可口", Spicy: true},
    {Name: "蒜泥白肉", Price: 38, Desc: "肥而不腻，蒜香浓郁", Spicy: false},
  },

"r2": {
    {Name: "清蒸鲈鱼", Price: 128, Desc: "鱼肉鲜嫩，原汁原味", Spicy: false},
    {Name: "白切鸡", Price: 68, Desc: "皮爽肉滑，鸡味浓郁", Spicy: false},
    {Name: "广式烧鹅", Price: 98, Desc: "皮脆肉嫩，香味四溢", Spicy: false},
  },
}
func main(){
  -1. ctx + chatModel 创建 ; 
  -2. 调用工具
   //1.餐厅查询
   restaurantTool := utils.NewTool(
    &schema.ToolInfo{
        Name: "query_restaurants",
        Desc: "根据条件查询餐厅信息（位置、菜系、是否辣）",
        ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
            "location": {
                Type:     "string",
                Desc:     "城市位置，例如：北京、上海",
                Required: false,
            },
            "cuisine": {
                Type:     "string",
                Desc:     "菜系类型，例如：川菜、粤菜",
                Required: false,
            },
            "spicy": {
                Type:     "boolean",
                Desc:     "是否要辣的",
                Required: false,
            },
        }),
    },
  func(ctx context.Context, params map[string]any) (string, error) {
    fmt.Printf("\n[工具执行] query_restaurants\n")

    var results []Restaurant
    location, _ := params["location"].(string)
    cuisine, _ := params["cuisine"].(string)
    spicy, _ := params["spicy"].(bool)

    for _, r := range restaurantDB {
        match := true
        if location != "" && r.Location != location {
            match = false
        }
        if cuisine != "" && r.Cuisine != cuisine {
            match = false
        }
        if spicy {
            hasSpicy := false
            for _, tag := range r.Tags {
                if tag == "辣" {
                    hasSpicy = true
                        break
            }
        }
        if !hasSpicy {
            match = false
        }
    }
    if match {
        results = append(results, r)
        }
    }
    resultJSON, _ := json.Marshal(results)
    return string(resultJSON), nil
  },
)
  //2.查询菜品
  dishTool := utils.NewTool(
    &schema.ToolInfo{
        Name: "query_dishes",
        Desc: "查询指定餐厅的菜品信息（需要餐厅ID）",
        ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
            "restaurant_id": {
                Type:     "string",
                Desc:     "餐厅ID",
                Required: true,
            },
        }),
    },
   func(ctx context.Context,params map[string]any)(string,error) {
        restaurantID := params["restaurant_id"].(string)
        fmt.Printf("\n[工具执行] query_dishes(restaurant_id=%s)\n", restaurantID)

        dishes, exists := dishDB[restaurantID]
        if !exists {
            return `{"error": "餐厅不存在"}`, nil
        }

        resultJSON, _ := json.Marshal(dishes)
        return string(resultJSON), nil
     } , 
  )

  // 创建 React Agent
  agent, err := react.NewAgent(ctx, &react.AgentConfig{
    ToolCallingModel: chatModel,
    ToolsConfig: compose.ToolsNodeConfig{
        Tools: []tool.BaseTool{restaurantTool, dishTool},
    },
})
if err != nil {
    log.Fatalf("创建 Agent 失败: %v", err)
}

  // 使用 Agent
  messages := []*schema.Message{
    schema.UserMessage("我在北京，想吃辣一点的，给我推荐几家餐厅和特色菜"),
}
  fmt.Println("=== 用户：我在北京，想吃辣一点的，给我推荐几家餐厅和特色菜 ===")

  response, err := agent.Generate(ctx, messages)
  if err != nil {
      log.Fatalf("生成失败: %v", err)
  }
  fmt.Printf("\n=== Agent 回答 ===\n%s\n", response.Content)
}
```

##
