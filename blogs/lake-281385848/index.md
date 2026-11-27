## 简介

```text
- 查询数据库或 API
- 读写文件
- 执行计算
- 访问网络资源
- 生成图表
- ...任何你能用代码实现的功能
```

### Tool 的工作流程

```text
用户输入 → AI 理解意图 → 选择 Tool1 → 执行 Tool1 → 获取结果 → AI 生成回复  
    ↓    ↓    ↓  
    "查天气"    "weather_tool"    "晴天 25°C"
```

## Tool接口定义

Eino 中的 Tool 需要实现以下接口 :

```text
type InvokableTool interface {
    // Info 返回工具的元信息（名称、描述、参数定义）
    Info(ctx context.Context) (*schema.ToolInfo, error)

    // InvokableRun 执行工具逻辑
    // argumentsInJSON: JSON 格式的参数
    // 返回: JSON 格式的结果
    InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error)
}
```

### 方式一 : 实现接口创建 Tool

- 简单的计算器

```text
// CalculatorTool 计算器工具
type CalculatorTool struct{}

// Info 返回工具信息
func (t *CalculatorTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
    return &schema.ToolInfo{
      Name: "calculator",
      Desc: "执行基本的数学计算（加、减、乘、除）",
      ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
          "operation": {
                  Type:    "string",
                  Desc:    "运算类型[ add(加), subtract(减), multiply(乘), divide(除)",
                  Required: true,
    },
    "a": {
        Type:    "number",
        Desc:    "第一个数字",
        Required: true,
    },
    "b": {
        Type:    "number",
        Desc:    "第二个数字",
        Required: true,
            },
        }),
      }, nil
  }

  // 参数结构
type CalculatorParams struct {
    Operation string `json:"operation"`
    A float64 `json:"a"`
    B float64 `json:"b"`
}

// 结果结构
type CalculatorResult struct {
    Result float64 `json:"result"`
    Error string `json:"error,omitempty"`
}

// InvokableRun 执行计算
func (t *CalculatorTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option)(string, error){
    // 1. 解析参数
    var params CalculatorParams
    if err := json.Unmarshal([]byte(argumentsInJSON), &params); err != nil {
        return "", fmt.Errorf("解析参数失败: %w", err)
    }

    // 2. 执行计算
    var result float64
    switch params.Operation {
    case "add":
        result = params.A + params.B
    case "subtract":
        result = params.A - params.B
    case "multiply":
         result = params.A * params.B
    case "divide":
        if params.B == 0 {
            resultJSON, _ := json.Marshal(CalculatorResult{
                Error: "除数不能为0",
              })
              return string(resultJSON), nil
    }
            result = params.A / params.B
    }
    default:
      resultJSON, _ := json.Marshal(CalculatorResult{
          Error: "不支持的运算类型",
    })
    return string(resultJSON), nil
  }
  // 3. 返回结果
  resultJSON, err := json.Marshal(CalculatorResult{
         Result: result,
  })

  if err != nil {
    return "", err
  }

  return string(resultJSON), nil
}
func main() {
    ctx := context.Background()
    calculator := &CalculatorTool{}

    // 测试工具
    testCases := []struct {
        operation string
        a, b float64
    }{
        {"add", 10, 5},
        {"subtract", 10, 5},
        {"multiply", 10, 5},
        {"divide", 10, 5},
        {"divide", 10, 0}, // 测试除零
    }

    for _, tc := range testCases {
        params := CalculatorParams{
            Operation: tc.operation,
            A:    tc.a,
            B:    tc.b,
        }

        paramsJSON, _ := json.Marshal(params)
        result, err := calculator.InvokeRun(ctx, string(paramsJSON))
        if err != nil {
            log.Println("执行失败: %v", err)
            continue
        }

        fmt.Println("%s(%g, %g) = %s\n", tc.operation, tc.a, tc.b, result)
    }
}

```

### 方式二 : 使用 NewTool快速创建

辅助函数 , 方便快速创建 ;

```text
type TimeParams struct {
    Format string `json:"format"`
}
type TimeResult struct {
    CurrentTime string `json:"current_time"`
}
func GetCurrentTime(ctx context.Context, params *TimeParams) (*TimeResult, error) {
    now := time.Now()
    var result string
    switch params.Format {
    case "date":
        result = now.Format("2006-01-02")
    case "time":
        result = now.Format("15:04:05")
    default:
        result = now.Format("2006-01-02 15:04:05")
    }
    return &TimeResult{CurrentTime: result}, nil
}

func main() {
    ctx := context.Background()

    // 使用 utils.NewTool 将函数封装为工具
    timeTool := utils.NewTool(
        &schema.ToolInfo{
            Name: "get_current_time",
            Desc: "获取当前时间",
            ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
                "format": {
                    Type:     schema.String,
                    Desc:     "时间格式：date(日期), time(时间), datetime(日期时间)",
                    Required: false,
                },
            }),
        },
        GetCurrentTime, // 传递函数本身
    )

    testFormats := []string{"date", "time", "datetime", ""}
    for _, format := range testFormats {
        params := TimeParams{Format: format}
        b, _ := json.Marshal(params)
        // 工具执行
        outputJSON, err := timeTool.InvokableRun(ctx, string(b)) // 修正方法名
        if err != nil {
            log.Printf("执行失败: %v", err)
            continue
        }
        fmt.Printf("%s\n", outputJSON) // 修正变量名
    }
}

```

## 实用 Tool 实例

### 1\.天气查询的tool

```text
// WeatherTool 天气查询工具（模拟）
type WeatherTool struct {
    // 模拟的天气数据
    weatherData map[string]map[string]string
}

func NewWeatherTool() *WeatherTool {
    return &WeatherTool{
        weatherData: map[string]map[string]string{
            "北京": {
                "temperature": "25℃",
                "condition":   "晴天",
                "humidity":    "45%",
                "wind":        "北风3级",
            },
            "上海": {
                "temperature": "28℃",
                "condition":   "多云",
                "humidity":    "65%",
                "wind":        "东南风2级",
            },
            "深圳": {
                "temperature": "30℃",
                "condition":   "阴天",
                "humidity":    "75%",
                "wind":        "南风4级",
            },
        },
    }
}

func (t *WeatherTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
    return &schema.ToolInfo{
        Name: "get_weather",
        Desc: "查询指定城市的天气信息",
        ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
            "city": {
                Type:     "string",
                Desc:     "城市名称，例如：北京、上海、深圳",
                Required: true,
            },
        },
        nil
    }
}

type WeatherParams struct {
    City string `json:"city"`
}

func (t *WeatherTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (*string, error) {
    var params WeatherParams
    if err := json.Unmarshal([]byte(argumentsInJSON), &params); err != nil {
        return "", err
    }

    weather, exists := t.weatherData[params.City]
    if !exists {
        result := map[string]string{
            "error": fmt.Sprintf("%s 的天气数据", params.City),
        }
        resultJSON, _ := json.Marshal(result)
        return string(resultJSON), nil
    }
    //返回天气信息
    resultJSON, err := json.Marshal(weather)
    if err != nil {
      return "" , err 
    }
    return string(resultJSON) , nil 
}		

func main() {
    ctx := context.Background()
    weatherTool := NewWeatherTool()

    cities := []string{"北京", "上海", "广州"}

    for _, city := range cities {
        params := WeatherParams{City: city}
        paramsJSON, _ := json.Marshal(params)

        result, err := weatherTool.InvokableRun(ctx, string(paramsJSON))
        if err != nil {
            log.Println("查询失败: %v", err)
            continue
        }

        fmt.Println("%s 天气: %s\n", city, result)
    }
}
```

### 2\.文件操作 tool

```text
// FileReaderTool 文件读取工具
type FileReaderTool struct{}

// Info 返回工具元信息
func (t *FileReaderTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
    return &schema.ToolInfo{
        Name: "read_file",
        Desc: "读取指定路径的文件内容（仅支持文本文件，最大 1MB）",
        ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
            "filepath": {
                Type:     "string",
                Desc:     "文件路径（绝对路径或相对路径）",
                Required: true,
            },
        }),
    }, nil
}

// 输入参数
type FileReaderParams struct {
    FilePath string `json:"filepath"`
}
// 输出结果
type FileReaderResult struct {
    Content string `json:"content,omitempty"`
    Error   string `json:"error,omitempty"`
}

func (t *FileReaderTool) InvokibleRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
    var params FileReaderParams
    if err := json.Unmarshal([]byte(argumentsInJSON), &params); err != nil {
        return "", err
    }

    // 读取文件
    content, err := os.ReadFile(params.FilePath)
    if err != nil {
        result := FileReaderResult{
            Error: fmt.Sprintf("读取文件失败: %v", err),
        }
        resultJSON, _ := json.Marshal(result)
        return string(resultJSON), nil
    }

    result := FileReaderResult{
        Content: string(content),
    }
    resultJSON, err := json.Marshal(result)
    if err != nil {
        return "", err
    }

    return string(resultJSON), nil
}

// FileWriterTool 文件写入工具
type FileWriterTool struct{}

// Info 返回工具元信息
func (t *FileWriterTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
    return &schema.ToolInfo{
        Name: "write_file",
        Desc: "将内容写入指定文件（若文件已存在则覆盖，仅支持当前目录下文件）",
        ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
            "filepath": {
                Type:     "string",
                Desc:     "文件路径（相对路径，不允许包含 '..'）",
                Required: true,
            },
            "content": {
                Type:     "string",
                Desc:     "要写入的文本内容",
                Required: true,
            },
        }),
    }, nil
}

type FileWriterParams struct {
    FilePath string `json:"filepath"`
    Content  string `json:"content"`
}

type FileWriterResult struct {
    Success bool   `json:"success"`
    Message string `json:"message"`
}

func (t *FileWriterTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
    var params FileWriterParams
    if err := json.Unmarshal([]byte(argumentsInJSON), &params); err != nil {
        return "", err
    }

    // 写入文件
    err := os.WriteFile(params.FilePath, []byte(params.Conten t), 0644)

    var result FileWriterResult
    if err != nil {
        result = FileWriterResult{
            Success: false,
            Message: fmt.Sprintf("写入失败: %v", err),
        }
    } else {
        result = FileWriterResult{
            Success: true,
            Message: "写入成功",
        }
    }

    resultJSON, _ := json.Marshal(result)
    return string(resultJSON), nil
}

  func main() {
    ctx := context.Background()

    // 测试文件写入
    writer := &FileWriterTool{}
    writeParams := FileWriterParams{
        FilePath: "test_output.txt",
        Content:  "Hello from Eino Tool!\n这是测试内容。",
    }

    writeParamsJSON, err := json.Marshal(writeParams)
    if err != nil {
        log.Fatalf("序列化写入参数失败：%v", err)
    }
    writeResult, err := writer.InvokableRun(ctx, string(writeParamsJSON)) // 修正方法名
    if err != nil {
        log.Fatalf("写入失败：%v", err) // 使用 Fatalf
    }
    fmt.Printf("写入结果：%s\n", writeResult)

    // 测试文件读取
    reader := &FileReaderTool{}
    readParams := FileReaderParams{
        FilePath: "test_output.txt",
    }

    readParamsJSON, err := json.Marshal(readParams)
    if err != nil {
        log.Fatalf("序列化读取参数失败：%v", err)
    }
    readResult, err := reader.InvokableRun(ctx, string(readParamsJSON)) // 修正方法名
    if err != nil {
        log.Fatalf("读取失败：%v", err) // 使用 Fatalf
    }
    fmt.Printf("读取结果：%s\n", readResult)

    // 清理测试文件
    if err := os.Remove("test_output.txt"); err != nil {
        log.Printf("警告：清理测试文件失败：%v", err)
    }
}
```

### 3\.数据库查询工具\(简单模拟\)

```text
type DatabaseQueryTool struct {
    // 模拟的用户数据
    users []User
}

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
    Age   int    `json:"age"`
}

func NewDatabaseQueryTool() *DatabaseQueryTool {
    return &DatabaseQueryTool{
        users: []User{
            {ID: 1, Name: "张三", Email: "zhangsan@example.com", Age: 28},
            {ID: 2, Name: "李四", Email: "lisi@example.com", Age: 32},
            {ID: 3, Name: "王五", Email: "wangwu@example.com", Age: 25},
        },
    }
}

func (t *DatabaseQueryTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
    return &schema.ToolInfo{
        Name: "query_user",
        Desc: "查询用户信息",
        ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
            "user_id": {
                Type: "number",
                Desc: "用户ID",
            },
            "name": {
                Type: "string",
                Desc: "用户姓名",
            },
        }),
    } , nil
}

type QueryUserParams struct {
    UserID int    `json:"user_id,omitempty"`
    Name   string `json:"name,omitempty"`
}

func (t *DatabaseQueryTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
    var params QueryUserParams
    if err := json.Unmarshal([]byte(argumentsInJSON), &params); err != nil {
        return "", err
    }

    var results []User

    // 根据条件查询
    for _, user := range t.users {
        if params.UserID > 0 && user.ID == params.UserID {
            results = append(results, user)
            break
        }

        if params.Name != "" && user.Name == params.Name {
            results = append(results, user)
            break
        }
    }
    if len(results) == 0 {
        resultJSON, _ := json.Marshal(map[string]string {
            "message": "未找到匹配的用户",
        })
        return string(resultJSON), nil
    }

    resultJSON, err := json.Marshal(results)
    if err != nil {
        return "", err
    }

    return string(resultJSON), nil
}
    func main() {
      ctx := context.Background()
      dbTool := NewDatabaseQueryTool()

    // 测试查询
      testCases := []QueryUserParams{
          {UserId: 1},
          {Name: "李四"},
          {UserId: 999}, // 不存在的用户
      }

    for _, tc := range testCases {
        paramsJSON, _ := json.Marshal(tc)
        result, err := dbTool.InvokeRun(ctx, string(paramsJSON))
        if err != nil {
            fmt.Printf("查询失败: %v\n", err)
            continue
        }
        fmt.Printf("查询参数: %s\n结果: %s\n\n", paramsJSON, result)
    }
}
```

### ToolsNode \- Tool 的集合

实现与 ChatModel 配合使用 实现 Function Calling

#### 基础使用

```text
func main() {
    ctx := context.Background()
    - 1.创建多个工具
    // 计算器工具
    calculator := utils.NewTool(
        &schema.ToolInfo{
            Name: "calculator",
            Desc: "执行数学计算",
            ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
                "expression": {
                    Type:     "string",
                    Desc:     "数学表达式，例如：10 + 20",
                    Required: true,
                },
            }),
        },
        func(ctx context.Context, params map[string]any) (string, error) {
            // 这里可以调用您之前定义的 CalculatorTool 逻辑
            // 或者解析表达式，这里仅演示返回固定值
            return "30", nil
        },
    )

    //创建时间工具
    timeTool := utils.NewTool(
        &schema.ToolInfo{
            Name: "get_time",
            Desc: "获取当前时间",
            ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{}),
        },
        func(ctx context.Context, params map[string]any) (string, error) {
            return time.Now().Format("2006-01-02 15:04:05"), nil
        },
    )
    //2.创建chatModel(实现支持 Function Calling) 
    chatModel,err := newChatModel(.ChatModelConfig{}) [if err] ; 
    //3.创建 ToolsNode(类似创建chatModel那种)
    toolsNode, err := compose.NewToolNode(ctx, &compose.ToolsNodeConfig{
        Tools: []tool.BaseTool{calculator, timeTool},
    })
    if err != nil {
        log.Fatal("创建 ToolsNode 失败: %v", err)
    }

    // 4. 获取工具信息列表
    calcInfo, err := calculator.Info(ctx)
    if err != nil {
        log.Fatal("获取工具信息失败: %v", err)
    }

    timeInfo, err := timeTool.Info(ctx)
    if err != nil {
        log.Fatal("获取工具信息失败: %v", err)
    }

    toolInfos := []*schema.ToolInfo{calcInfo, timeInfo}

    // 测试多个场景
    testCases := []string{
      "现在几点了？",
      "帮我计算 10 + 20 等于多少",
      "你好，请介绍一下你自己",
    }

    for i, question := range testCases {
      fmt.Printf("\\n========== 测试 %d ==========\\n", i+1)
      fmt.Printf("问题: %s\\n", question)

      messages := []*schema.Message{
        schema.UserMessage(question),
      }
    // AI 决定使用工具
    response, err := chatModel.Generate(ctx, messages,
        model.WithTools(toolInfos),
    )

    if err != nil {
        log.Printf("生成失败: %v", err)
        continue
    }

    fmt.Printf("AI 的决策: \n")
    if len(response.ToolCalls) > 0 {
        for _, toolCall := range response.ToolCalls {
            fmt.Printf("%s\n", toolCall.Function.Name)
            fmt.Printf(" 参数: %s\n", toolCall.Function.Arguments)

            // 执行工具
            toolResult, err := toolsNode.Invoke(ctx, response)
            if err != nil {
                log.Printf(" 工具执行失败: %v", err)
                continue
                }

            fmt.Printf(" 结果: %+v\n", toolResult)
            }
        } else {
                fmt.Printf(" 直接回答: %s\n", response.Content)
      }
    }
  }
```

### Tool 开发最佳实践

#### 1\.参数实践

```text
func (t *MyTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option)(string, error){
    var params MyParams
    if err := json.Unmarshal([]byte(argumentsInJSON), &params); err != nil {
    return "", fmt.Errorf("参数解析失败: %w", err)
    }

    // 验证必填参数
    if params.Required == "" {
    return "", fmt.Errorf("缺少必填参数: required")
    }

    // 验证参数范围
    if params.Count < 0 || params.Count > 100 {
    return "", fmt.Errorf("参数 count 必须在 0-100 之间")
    }

    // 执行逻辑...
    return result, nil
}
```

#### 2\.错误处理

```text
func (t *MyTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
    // ...
    result, err := someOperation()
    if err != nil {
    // 返回结构化的错误信息，而不是直接返回 error
    errorResult := map[string]string{
    "error": "操作失败",
    "message": err.Error(),
    "code": "OPERATION_FAILED",
    }
    errorJSON, _ := json.Marshal(errorResult)
    return string(errorJSON), nil // 注意：返回 nil error
    }
    return result, nil
}
```

#### 3\.超时控制

```text
func (t *MyTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option)(string, error) {
    // 设置超时
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()

    // 执行可能耗时的操作
    resultChan := make(chan string, 1)
    errChan := make(chan error, 1)

    go func() {
    result, err := slowOperation()
    if err != nil {
    errChan <- err
    return
    }
    resultChan <- result
    }()

    select {
    case result := <-resultChan:
    return result, nil
    case err := <-errChan:
    return "", err
    case <-ctx.Done():
    return "", fmt.Errorf("操作超时")
    }
}
```

#### 4\.日志记录

```text
import "log"

func (t *MyTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option)(string, error) {
    // 记录工具调用
    log.Printf("[Tool:%s] 开始执行，参数: %s", t.Name(), argumentsInJSON)

    result, err := doWork()

    if err != nil {
    log.Printf("[Tool:%s] 执行失败: %v", t.Name(), err)
    return "", err
    }

    log.Printf("[Tool:%s] 执行成功，结果长度: %d", t.Name(), len(result))
    return result, nil
}
```
