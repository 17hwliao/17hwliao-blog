Go 测试基础：

1. 文件命名  
   logger/logger\.go → 源代码  
   logger/logger\_test\.go → 测试文件
2. 测试函数命名  
   func TestXxx\(t \*testing\.T\) \{  
    // 测试逻辑  
   \}

- 必须以 Test 开头
- 参数必须是 \*testing\.T

3. 运行测试  
   go test \./logger/\.\.\. \# 运行 logger 包的所有测试  
   go test \-run TestXxx \# 运行特定测试  
   go test \-v \# 详细输出
4. 测试结构  
   func TestInitWritesJSONLog\(t \*testing\.T\) \{  
    // 1\. 准备（Arrange）  
    dir :\= t\.TempDir\(\)  
    normalFile :\= filepath\.Join\(dir, "normal\.log"\) // 2\. 执行（Act）  
    cleanup, err :\= Init\("test", config\.LogConfig\{\.\.\.\}\) // 3\. 断言（Assert）  
    if err \!\= nil \{  
    t\.Fatalf\("init logger: %v", err\)  
    \} // 4\. 清理  
    cleanup\(\)

\}  
5\. 常用断言方法  
方法  
t\.Fatalf\(\)  
t\.Errorf\(\)  
t\.Log\(\)  
t\.TempDir\(\)  
6\. 测试流程图  
编写测试函数  
 ↓  
运行 go test  
 ↓  
检查断言是否通过  
 ↓  
 ├── 通过 → PASS  
 └── 失败 → FAIL \+ 错误信息  
7\. 实际示例  
func TestAdd\(t \*testing\.T\) \{  
 // 测试用例  
 tests :\= \[\]struct \{  
 name string  
 a, b int  
 expected int  
 \}\{  
 \{"正数相加", 1, 2, 3\},  
 \{"负数相加", \-1, \-2, \-3\},  
 \{"零", 0, 0, 0\},  
 \}

```text
for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        result := Add(tt.a, tt.b)
        if result != tt.expected {
            t.Errorf("Add(%d, %d) = %d, want %d", 
                tt.a, tt.b, result, tt.expected)
        }
    })
}
```

\}  
总结：

- 测试文件以 \_test\.go 结尾
- 测试函数以 Test 开头
- 使用 t\.Fatalf\(\) 失败断言
- 运行 go test 执行测试
