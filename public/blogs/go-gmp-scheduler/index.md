从单进程时代的执行方式出发，记录进程、线程和协程的演进，再梳理 Go 的 GMP 模型、调度器设计思想与典型调度场景。

## 一、早期：单进程时代

单一执行流程主要有两个弊端：

1. 计算机只能沿着一个执行流程，一个任务接着一个任务处理。
2. 进程阻塞时，如果没有其他可运行任务，CPU 就会浪费等待时间。

### 从串行执行到并发调度

通过在不同进程之间调度，可以从宏观上实现**并发效果**。时间片调度让一个进程执行一段时间后，将 CPU 交给其他可运行的进程。

不过，每次切换都有时间成本。进程、线程数量越多，频繁切换带来的开销就可能越大；后续再加上锁和共享状态，设计也会越来越复杂。

![进程与线程的演进示意](/blogs/go-gmp-scheduler/images/01.png)

![并发调度与上下文切换](/blogs/go-gmp-scheduler/images/02.png)

![用户态协程与内核线程](/blogs/go-gmp-scheduler/images/03.png)

### 协程与线程的映射关系

**N:1：多个协程对应一个线程。**

![协程与线程的 N 比 1 映射](/blogs/go-gmp-scheduler/images/04.png)

**1:1：一个协程对应一个线程。**

![协程与线程的 1 比 1 映射](/blogs/go-gmp-scheduler/images/05.png)

**M:N：多个协程由多个线程调度执行。**

![协程与线程的 M 比 N 映射](/blogs/go-gmp-scheduler/images/06.png)

### Go 中的 Goroutine

Go 把轻量的并发执行单元称为 **Goroutine**。它的初始栈占用很小，可以动态增长，由 Go runtime 负责调度，而不是每创建一个 Goroutine 就创建一个内核线程。

### 早期调度器与它的缺点

早期调度器围绕共享的全局运行队列调度 G，M 在访问共享队列时需要加锁。这里的锁用于保护调度器共享状态，并不是在整个 Goroutine 执行期间一直持锁。

![早期 Go 调度器的全局运行队列](/blogs/go-gmp-scheduler/images/07.png)

![旧调度器的主要缺点](/blogs/go-gmp-scheduler/images/08.png)

![旧调度器的执行与切换过程](/blogs/go-gmp-scheduler/images/09.png)

![早期调度器问题总结](/blogs/go-gmp-scheduler/images/10.png)

## 二、Goroutine 调度器 GMP 模型的设计思想

### G、P、M 分别是什么

| 角色 | 含义 | 作用 |
| --- | --- | --- |
| G | Goroutine | 等待执行或正在执行的 Go 并发任务 |
| P | Processor，逻辑处理器 | 保存执行 Go 代码所需的调度资源，管理本地运行队列 |
| M | Machine，操作系统线程 | 真正承载代码执行的内核线程 |

M 执行用户 Go 代码时需要持有 P，再运行一个 G。**P 是逻辑处理器，不是内核线程，也不是一颗物理 CPU。** [Go runtime 的调度器说明](https://go.dev/src/runtime/HACKING)明确区分了这三种资源。

![GMP 模型的整体结构](/blogs/go-gmp-scheduler/images/11.png)

### 全局队列、本地队列与资源列表

- **全局队列**：存放等待运行的 G，供不同 P 获取任务。
- **本地队列**：每个 P 管理自己的可运行 G 队列。经典实现中的环形队列容量为 256，另有 `runnext` 槽位；队列满时会把一批 G 转移到全局队列。
- **P 列表**：P 的数量由 `GOMAXPROCS` 控制。
- **M 列表**：记录运行时管理的操作系统线程，数量不等于 P 的数量。

### P 和 M 的数量

**P：**可以通过环境变量 `GOMAXPROCS`，或者调用 `runtime.GOMAXPROCS(n)` 设置。它控制同时执行 Go 代码的并行度，而不是整个进程最多能创建多少个线程。[API 说明](https://pkg.go.dev/runtime#GOMAXPROCS)

**M：**运行时根据需求创建或复用线程。可以通过 `runtime/debug.SetMaxThreads` 设置线程数上限；默认上限是 10000。出现阻塞时，运行时会结合空闲线程、空闲 P 等状态决定后续调度，并不是每次阻塞都无条件创建新线程。[SetMaxThreads 说明](https://pkg.go.dev/runtime/debug#SetMaxThreads)

### 复用线程

这里主要关注两种机制：

1. **Work stealing**：本地缺少任务时，从其他 P 的运行队列中窃取一批**可运行的 G**，分摊任务。
2. **Handoff**：M 因系统调用等原因不能继续执行 Go 代码时，将 P 交给其他可用的 M，让 P 上等待的 G 有机会继续运行。

![Work stealing 工作窃取机制](/blogs/go-gmp-scheduler/images/12.png)

![Handoff 处理器移交机制](/blogs/go-gmp-scheduler/images/13.png)

### 利用并行

`GOMAXPROCS` 限定 P 的数量，可以按任务和机器资源调整。例如，学习时可以尝试将它设为 CPU 核数的一半，观察运行差异；这只是实验设置，不是固定的默认公式。

### 抢占

抢占让长时间运行的 G 不至于一直占用执行机会，也给其他可运行的 G 留出调度空间。

![调度器中的抢占机制](/blogs/go-gmp-scheduler/images/14.png)

### 全局 G 队列

全局队列连接了不同 P 的任务分配，也参与本地队列溢出后的调度。

![全局 G 队列与本地队列之间的关系](/blogs/go-gmp-scheduler/images/15.png)

![全局队列的调度说明](/blogs/go-gmp-scheduler/images/16.png)

![GMP 调度中的队列流转](/blogs/go-gmp-scheduler/images/17.png)

查找任务时，可以先用下面的简化路径建立理解：

1. 查看当前 P 的本地队列。
2. 从全局队列获取任务。
3. 尝试从其他 P 的本地队列窃取任务。

实际调度还有全局队列公平性检查、网络轮询、定时器等路径，不是每一次都严格按这三步执行。具体可以对照 [runtime/proc.go](https://go.dev/src/runtime/proc.go) 中的 `findRunnable`。

![线程获取任务与调度的全过程](/blogs/go-gmp-scheduler/images/18.png)

系统调用返回后，如果 M 无法获得 P，G 可以进入全局运行队列等待，M 则进入空闲状态，等待后续复用。不同阻塞原因的处理并不相同，下面的配图用于对照具体场景。

![系统调用与 M、P 的分离和重新配对](/blogs/go-gmp-scheduler/images/19.png)

![调度完成后的线程与协程状态](/blogs/go-gmp-scheduler/images/20.png)

![GMP 调度补充笔记之一](/blogs/go-gmp-scheduler/images/21.png)

![GMP 调度补充笔记之二](/blogs/go-gmp-scheduler/images/22.png)

### 编写 trace 文件

通过运行时 trace 记录程序执行情况，再使用 trace 工具查看调度过程。

![编写运行时 trace 的示例代码](/blogs/go-gmp-scheduler/images/23.png)

![生成和查看 trace 文件的命令](/blogs/go-gmp-scheduler/images/24.png)

![trace 文件与分析入口](/blogs/go-gmp-scheduler/images/25.png)

![trace 中的调度信息](/blogs/go-gmp-scheduler/images/26.png)

## 三、Go 调度器 GMP 调度场景的全过程分析

### 通过 Debug trace 查看 GMP 信息

设置 `GODEBUG=schedtrace=1000`，每隔约 1000 ms 打印一次调度信息。环境变量赋值中不要加空格。

Linux / macOS / Bash：

```bash
GODEBUG=schedtrace=1000 ./your-program
```

Windows PowerShell：

```powershell
$env:GODEBUG = 'schedtrace=1000'
./your-program.exe
```

这是调度器的文本诊断输出，与上一节的运行时 trace 文件是两种不同的观察方式。[GODEBUG 文档](https://pkg.go.dev/runtime#hdr-Environment_Variables)

![使用 schedtrace 查看 GMP 调度信息](/blogs/go-gmp-scheduler/images/27.png)

#### 相关参数的查看和含义

![schedtrace 输出参数及其含义](/blogs/go-gmp-scheduler/images/28.png)

### 场景一：G1 创建 G3

旧调度器只围绕全局队列分配任务，G 创建的新任务后续会在哪个线程运行，不容易保持局部性。

![旧调度器中缺少局部性的任务分配](/blogs/go-gmp-scheduler/images/29.png)

新的调度器让新 G 优先进入当前 P 的调度路径，从而改善局部性。注意：这里的本地运行队列属于 **P**，不是属于 G。

![G1 创建 G3 时的本地调度过程](/blogs/go-gmp-scheduler/images/30.png)

### 场景二：G1 执行完毕

![G1 执行完毕后的任务切换](/blogs/go-gmp-scheduler/images/31.png)

### 场景三：G2 创建过多的 G

按照局部性原则，G2 创建的新 G 会优先进入当前 P 的本地调度结构；创建过多任务时，还需要考虑队列容量和全局队列分流。

![G2 连续创建多个 Goroutine](/blogs/go-gmp-scheduler/images/32.png)

### 场景四：本地队列已满，再创建 G7

本地队列满后，会将一批已有 G 连同新 G 转移到全局队列，避免所有新任务都堆积在同一个 P 上。具体批量大小和处理细节以所学习版本的运行时实现为准。

### 场景五：本地队列未满，创建 G8

本地队列还有空间时，新 G 可以进入当前 P 的本地调度结构，等待执行。

### 场景六：唤醒正在休眠的 M

创建新 G 后，调度器会根据是否存在空闲 P、自旋线程等状态，决定是否需要唤醒休眠的 M；不是每创建一个 G 都固定唤醒一个 M。

![休眠 M 被唤醒的调度场景](/blogs/go-gmp-scheduler/images/33.png)

![唤醒线程的条件说明](/blogs/go-gmp-scheduler/images/34.png)

### 场景七：被唤醒的 M2 从全局队列批量取 G

**GQ 表示全局队列当前的实时长度。** 这里保留学习配图中的批量获取公式，用于理解负载分配；不同 Go 版本的实现可能调整，不能把图里的公式当成所有版本固定不变的接口。

![从全局队列批量获取 G 的学习公式](/blogs/go-gmp-scheduler/images/35.png)

![M2 从全局队列分配任务的过程](/blogs/go-gmp-scheduler/images/36.png)

### 场景八：M2 从 M1 对应的 P 中窃取 G

更准确地说，窃取发生在 P 的可运行队列之间，取得的是等待运行的任务，而不是把另一个 M 正在执行的 G 直接拿走。

![M2 通过工作窃取取得可运行的 G](/blogs/go-gmp-scheduler/images/37.png)

### 场景九：自旋线程的数量限制

自旋线程尝试寻找可运行任务。限制自旋线程的数量，是为了平衡唤醒效率和空转消耗。

![自旋线程的数量控制](/blogs/go-gmp-scheduler/images/38.png)

![自旋线程限制的学习笔记](/blogs/go-gmp-scheduler/images/39.png)

### 场景十：G 发生阻塞的系统调用

M 因系统调用无法继续执行 Go 代码时，P 可以被移交或回收，让其他 M 有机会继续执行可运行的 G。如果暂时没有接手的工作线程，调度器会结合空闲 M、空闲 P 等状态继续处理。

![G 进入阻塞系统调用时的调度](/blogs/go-gmp-scheduler/images/40.png)

### 场景十一：系统调用返回

![系统调用返回时重新获取 P 的过程](/blogs/go-gmp-scheduler/images/41.png)

原来的 M 携带 G8 从系统调用返回时，会尝试重新获得执行 Go 代码所需的 P。如果原先配对的 P2 已被 M5 占用，就需要尝试其他可用的 P。

如果最终没有获得 P，则将可运行的 G 放入全局运行队列等待，M 自己进入空闲状态，等待新的执行机会。

## 参考资料

- [Go runtime：G、M、P 与调度器资源](https://go.dev/src/runtime/HACKING)
- [runtime.GOMAXPROCS 与 GODEBUG](https://pkg.go.dev/runtime)
- [runtime/debug.SetMaxThreads](https://pkg.go.dev/runtime/debug#SetMaxThreads)
- [Go 调度器源码 runtime/proc.go](https://go.dev/src/runtime/proc.go)
