在go语言中 , Context是实现不同的goroutine 之间传递请求域的相关的数据

实现控制 goroutine 的生命周期和取消操作 ;

常见的方法;

```text
type Context interface {
	Deadline() (deadline time.Time, ok bool)
	Done() <-chan struct{}
	Err() error
	Value(key any) any
}
```

- `Deadline()` 方法用于获取 Context 的截止时间。
- `Done()` 方法用于返回一个只读的 channel，用于通知当前 Context 是否已经被取消。
- `Err()` 方法用于获取 Context 取消的原因。
- `Value()` 方法用于获取 Context 中保存的键值对数据。

## 实现数据传输 Value\(\)

```text
context.Background() ; 
context.TODO()       ; 
```

```text
context.WithValue(context,key,value).var  //返回context
内部数据使用 ctx.Value(key) //获取value
```

```text
lover(struct略)
func main() {
    ctx := context.Background()
    ctx = context.WithValue(ctx, "who", lover{
       name: "sunyuhan",
       age:  22,})
    GetUser(ctx)}
func GetUser(ctx context.Context) {
    user, ok := ctx.Value("who").(lover)
    if !ok {
       fmt.Println("没找到")
       return
    }
    fmt.Println(user.name)}
    user, err := ctx.Value(面对any类型的时候需要实现断言才能获取内部的参数).(lover)
    使用断言操作的时候最好处理一下err,实现安全断言; 
```

## 取消协程 WithCancel

使用场景 \-\-&gt; 用户主动申请取消当前请求

#### 实现终端请求

```text
ctx, cancel := context.WithCancel(context.Background())
返回两个值：
ctx：可以被取消的子 Context。
cancel：用于取消这个 Context 的函数。
控制 goroutine：保留 cancel
工作 goroutine：接收 ctx
ctx.Err() 可以输出取消的原因; 
```

```text
1. 控制函数创建 ctx 和 cancel
                ↓
2. ctx 被传给 worker
                ↓
3. worker 调用 ctx.Done()，获得 Channel
                ↓
4. worker 阻塞等待这个 Channel
                ↓
5. 一段时间后，控制函数调用 cancel()
                ↓
6. cancel() 关闭 Done Channel
                ↓
7. worker 解除阻塞
                ↓
8. worker 执行 return
                ↓
9. goroutine 结束
```

```text
ctx, cancel := context.WithCancel(context.Background())
defer cancel()

var wg sync.WaitGroup
wg.Add(1)

go func() {
	defer wg.Done()

	for {
		select {
		case <-ctx.Done():
			fmt.Println("取消原因：", ctx.Err())  --> 报错信息 : context canceled ; 
			return

		default:
			// 执行一小段任务
		}
	}
}()

// 满足某个停止条件
cancel()

// 等待 goroutine 真正退出
wg.Wait()
```

## 截至时间 WithDeadline

使用场景 : 定时任务

```text
ctx , _ := context.WithDeadline(context.Background(), time.Now().Add(2))  
AddDate(year, month , day) 
deadline := time.Date(   //直接限制传deadline也可以
	2026, 7, 15,
	18, 0, 0, 0,
	time.Local,
)
但是工作函数中也需要传入 case <- ctx.Done() :return 
```

## 超时时间 WithTimeOut

内部调用的就是截至时间函数 ;

直接一样的写法写上去就行 ;
