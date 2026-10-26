主要实现的服务 : 解耦 , 异步 , 削峰;

使用 docker 实现安装

```text
services:
  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    restart: unless-stopped
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  rabbitmq_data:
```

## 简单模式

```text
先获取一下依赖
go get github.com/rabbitmq/amqp091-go@v1.10.0
```

#### 生产者

1. 连接到MQ
2. 创建通道
3. 声明队列
4. 发送消息

```text
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/rabbitmq/amqp091-go"
)

const (
	// queueName 是本例的一对一队列：生产者发送到它，消费者从它接收。
	queueName = "hello.go"

	// 默认连接地址与 docker-compose.yml 中的账号、端口保持一致。
	defaultURL = "amqp://admin:admin123@localhost:5672/"
)

func main() {
	// 允许通过环境变量覆盖连接地址，避免把生产环境密码写死在代码里。
	amqpURL := os.Getenv("AMQP_URL")  //获取本地的连接地址
	if amqpURL == "" {
		amqpURL = defaultURL
	}

	// 第 1 步：连接 RabbitMQ。Dial 成功只代表 TCP/AMQP 认证连接可用。
	conn, err := amqp091.Dial(amqpURL)
	if err != nil {
		log.Fatalf("连接 RabbitMQ 失败: %v", err)
	}
	defer conn.Close()

	// 第 2 步：在连接中创建 Channel。发布、确认等 AMQP 操作都通过 Channel 完成。
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("创建 Channel 失败: %v", err)
	}
	defer ch.Close()

	// 第 3 步：声明队列。重复声明同名且参数一致的队列是安全的，
	// 所以生产者与消费者都可以先执行它，谁先启动都没关系。
  // 返回的第一个参数是 当前队列的一些状态信息
	_, err = ch.QueueDeclare(
		queueName, // 队列名称 -> "hello.go"
		true,      // durable：RabbitMQ 重启后队列仍存在 : 持久性
		false,     // autoDelete：没有消费者时不自动删除 : 自动删除
		false,     // exclusive：不限制为当前连接独占 : 排他性
		false,     // noWait：等待服务端返回声明结果，便于发现配置错误 : 非阻塞
		nil,       // arguments：本例没有额外参数 : 其他参数
	)
	if err != nil {
		log.Fatalf("声明队列失败: %v", err)
	}

	// 第 4 步：发布消息。空字符串表示使用默认交换机；默认交换机会按
	// routing key 寻找同名队列，因此 routing key 必须等于 queueName。
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	body := "你好，RabbitMQ！这是一条来自 Go 生产者的消息。"
	err = ch.PublishWithContext(ctx,  //控制请求的
		"",        // exchange：默认交换机
		queueName, // routing key：默认交换机将其路由到同名队列
		false,     // mandatory：队列不存在时不强制返回消息
		false,     // immediate：RabbitMQ 已不支持，保持 false
		amqp091.Publishing{
			DeliveryMode: amqp091.Persistent, // 消息持久化（需配合 durable 队列）
			ContentType:  "text/plain",
			Body:         []byte(body),
		},
	)
	if err != nil {
		log.Fatalf("发布消息失败: %v", err)
	}

	fmt.Printf("消息已发送到队列 %q：%s\n", queueName, body)
}

```

#### 消费者

1. 创建MQ
2. 创建通道
3. 声明队列
4. 接收消息

```text
package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/rabbitmq/amqp091-go"
)

const (
	// 必须与生产者.go 中的队列名保持一致。
	consumerQueueName = "hello.go"
	defaultConsumerURL = "amqp://admin:admin123@localhost:5672/"
)

func main() {
	// 优先使用环境变量，未设置时使用本地 Docker 的默认连接地址。
	amqpURL := os.Getenv("AMQP_URL")
	if amqpURL == "" {
		amqpURL = defaultConsumerURL
	}

	// 第 1 步：连接 RabbitMQ。
	conn, err := amqp091.Dial(amqpURL)
	if err != nil {
		log.Fatalf("连接 RabbitMQ 失败: %v", err)
	}
	defer conn.Close()

	// 第 2 步：创建 Channel。
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("创建 Channel 失败: %v", err)
	}
	defer ch.Close()

	// 第 3 步：声明队列。参数必须和生产者一致，否则 RabbitMQ 会报错。
	_, err = ch.QueueDeclare(
		consumerQueueName, --> "hello.go"
		true,  // durable
		false, // autoDelete
		false, // exclusive
		false, // noWait
		nil,
	)
	if err != nil {
		log.Fatalf("声明队列失败: %v", err)
	}

	// 每次最多预取一条未确认消息；一对一消费时更容易观察确认机制。
	if err := ch.Qos(1, 0, false); err != nil {
		log.Fatalf("设置 QoS 失败: %v", err)
	}

	// 第 4 步：开始消费。autoAck=false 表示业务处理成功后再手动确认消息。
	messages, err := ch.Consume(  --> 实际上就是一个channel
		consumerQueueName,
		"",    // consumer tag：由 RabbitMQ 自动生成
		false, // autoAck：关闭自动确认，防止消息尚未处理就丢失
		false, // exclusive
		false, // noLocal：RabbitMQ 不使用此选项
		false, // noWait
		nil,
	)
	if err != nil {
		log.Fatalf("注册消费者失败: %v", err)
	}

	// 捕获 Ctrl+C，优雅结束程序。
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	log.Printf("正在等待队列 %q 中的消息，按 Ctrl+C 退出", consumerQueueName)
	for {
		select {
		case message, ok := <-messages:
			if !ok {
				log.Println("消息通道已关闭")
				return
			}

			// 在真实项目中，把业务处理逻辑放在这里；确认成功后再 Ack。
			fmt.Printf("收到消息：%s\n", message.Body)
			if err := message.Ack(false); err != nil {
				log.Printf("确认消息失败: %v", err)
			}
		case <-stop:
			log.Println("消费者已停止")
			return
		}
	}
}

```

安全设置

依旧防止用户使用网络抓包实现获取到真实数据 ;

配置http的ssl , 浏览器会自带 ca ;

**生成一套完整的 SSL/TLS 证书链，让 RabbitMQ 服务端和 Go 客户端之间实现双向 TLS 加密通信（证书认证）**，防止消息被窃听、篡改或伪造。

下面展示的是 shell 脚本

```text
#!/bin/bash
set -e

# ======================================
# 0. 配置项（你需要修改这里的信息）
# ======================================
# 证书信息
CA_NAME="______"           # 根证书名称，例如 MyLocalCA
SERVER_NAME="______"       # 服务器主机名/服务名，例如 rabbitmq-server
CLIENT_NAME="______"       # 客户端名称，例如 rabbitmq-client
SERVER_IP="______"         # RabbitMQ 服务器的IP地址，例如 192.168.80.164
SERVER_DOMAIN="______"     # RabbitMQ 服务器的域名/主机名，例如 rabbitmq-server
DAYS_CA=3650               # CA证书有效期（天）
DAYS_SERVER=365            # 服务器证书有效期（天）
DAYS_CLIENT=365            # 客户端证书有效期（天）

# ======================================
# 1. 创建根证书颁发机构（CA）
# ======================================
echo "===== 1. 生成根CA私钥 ====="
openssl genrsa -out ca_key.pem 2048

echo "===== 2. 生成根CA自签名证书 ====="
openssl req -x509 -new -nodes -key ca_key.pem -days ${DAYS_CA} \
  -out ca_certificate.pem -subj "/CN=${CA_NAME}"

# ======================================
# 2. 创建服务端私钥与证书（RabbitMQ服务端用）
# ======================================
echo "===== 3. 生成服务端私钥 ====="
openssl genrsa -out server_key.pem 2048

echo "===== 4. 生成服务端证书配置（含SAN） ====="
cat > ssl.conf <<EOF
[req]
req_extensions = v3_req
distinguished_name = req_distinguished_name

[req_distinguished_name]

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
IP.1 = ${SERVER_IP}
DNS.1 = ${SERVER_DOMAIN}
EOF

echo "===== 5. 生成服务端证书签名请求（CSR） ====="
openssl req -new -key server_key.pem -out server.csr \
  -subj "/CN=${SERVER_NAME}" -config ssl.conf

echo "===== 6. 使用CA签发服务端证书（含SAN扩展） ====="
openssl x509 -req -in server.csr \
  -CA ca_certificate.pem \
  -CAkey ca_key.pem \
  -CAcreateserial \
  -out server_certificate.pem \
  -days ${DAYS_SERVER} \
  -extensions v3_req \
  -extfile ssl.conf

# ======================================
# 3. 创建客户端私钥与证书（Go客户端用）
# ======================================
echo "===== 7. 生成客户端私钥 ====="
openssl genrsa -out client_key.pem 2048

echo "===== 8. 生成客户端证书签名请求（CSR） ====="
openssl req -new -key client_key.pem -out client.csr \
  -subj "/CN=${CLIENT_NAME}"

echo "===== 9. 使用CA签发客户端证书 ====="
openssl x509 -req -in client.csr \
  -CA ca_certificate.pem \
  -CAkey ca_key.pem \
  -CAcreateserial \
  -out client_certificate.pem \
  -days ${DAYS_CLIENT}

echo "===== 证书生成完成！ ====="
echo "生成的文件："
echo "- CA证书：ca_certificate.pem / ca_key.pem"
echo "- 服务端证书：server_certificate.pem / server_key.pem"
echo "- 客户端证书：client_certificate.pem / client_key.pem"

```

使用\(TSL, SSL实现双向认证之后\) \. 生产者和消费者都需要实现增加TLS 配置, 加载证书链 , 使用amqps://协议实现连接 ;

```text
// 生成TLS配置（加载CA、客户端证书）
func NewTLSConfig(caPath, clientCertPath, clientKeyPath, serverName string) (*tls.Config, error) {
	// 1. 加载CA根证书，构建信任池
	caCert, err := ioutil.ReadFile(caPath)
	if err != nil {
		return nil, err
	}
	caPool := x509.NewCertPool()
	if !caPool.AppendCertsFromPEM(caCert) {
		return nil, err
	}

	// 2. 加载客户端证书和私钥
	clientCert, err := tls.LoadX509KeyPair(clientCertPath, clientKeyPath)
	if err != nil {
		return nil, err
	}

	// 3. TLS配置
	tlsConfig := &tls.Config{
		RootCAs:      caPool,
		Certificates: []tls.Certificate{clientCert},
		ServerName:   serverName, // 必须和服务端证书SAN中的DNS/CN一致
		InsecureSkipVerify: false, // 生产环境必须设为false
	}
	return tlsConfig, nil
}
```

```text
连接MQ : 使用DialTLS实现连接,  要在参数中加上 (url:"amqps:admin:admin123@ip/" , tlsConfig)
```

ps : 管理内部是不需要任何加密的, 外部节点是一定要加密的, 加密是一定会损失性能 的

## 工作队列模式

消息轮询\(Round\-Robin\) , 分配给不同的消费者, 防止单个消费者的压力过大 ;

简单模式基础上, 若有多个消费者, 默认就是工作队列模式 ;

消息基本上会被均分给不同的消费者

配置不同消费者接收消息的能力 , 需要实现以下的相关配置

```text
func main() {
	ch := core.InitMQ()

	//3. 声明队列
	q, err := ch.QueueDeclare(name: "jiandan", durable: false, autoDelete: false, exclusive: false, noWait: false, args: nil)
	if err != nil {
		log.Fatal(err)
	}

	for i := 0; i < 10; i++ {
		msg := fmt.Sprintf(format: "消息%d", i)
		//4. 发送消息
		err = ch.Publish(exchange: "", q.Name, mandatory: false, immediate: false, amqp.Publishing{
			Body: []byte(msg),
		})
		if err != nil {
			fmt.Println(a...: "消息发送失败", err)
			return
		}
		fmt.Println(a...: "消息发送成功", msg)
	}
}
```

```text
func main() {
	ch := core.InitMQ()

	// 3. 声明队列
	q, err := ch.QueueDeclare(
		"jiandan",  // 队列名
		false,      // durable：是否持久化
		false,      // autoDelete：是否自动删除
		false,      // exclusive：是否独占
		false,      // noWait：是否等待服务端确认
		nil,        // args：额外参数
	)go
	if err != nil {
		log.Fatal(err)
	}
  //如果想实现验证的话, 配置消费者的消费能力
  err = ch.Qos(
      1,     // prefetchCount:未确认消息上限  能收到多少消息
      0,		 // prefetchSize :不限制消息大小  吞吐量
      false, // global:仅对当前的消费者生效
  )

	// 4. 消费消息
	consumer, err := ch.Consume(
		q.Name,     // 队列名
		"",         // consumer：消费者标签（自动生成）
		false,      // autoAck：关闭自动确认
		false,      // exclusive：是否独占消费
		false,      // noLocal：RabbitMQ 不使用
		false,      // noWait：是否等待服务端确认
		nil,        // args：额外参数
	)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("接收消息")
	for msg := range consumer {
		fmt.Println("消息内容", string(msg.Body))
		msg.Ack(false) // 手动确认消息
	}
}

```

## 发布订阅模式

在网页web端可以直接使用 exchange 实现创建交换机 ;

使用 queues 去创建队列

生产者生产消息, 多个消费者订阅消息 ;

Publish/Subscribe Pattern 是一种消息广播机制, 生产者将消息发送到交换器 \(Exchange\) , 交换器将消息复制到所有绑定的队列, 每一队列对应一个消费者 ;

- **无视路由键 routingKey**
- 消息进来直接**全广播**
- 绑定该交换机的**所有队列**全都收到一模一样消息

```text
1.声明fanout类型的交换器
2.将消息直接发给交换器
// 声明 fanout 类型的交换器
err = ch.ExchangeDeclare(
	exChangeName, // 交换器名称
	"fanout",     // 交换器类型
	true,         // 持久化
	false,        // 非自动删除
	false,        // 内部使用
	false,        // 不等待服务器确认
	nil,          // 额外参数
)
if err != nil {
	log.Fatalf("声明交换器失败 %s", err)
}

for i := 0; i < 20; i++ {
	// 发送消息
	body := fmt.Sprintf("msg-%d", i)
	err = ch.Publish(
		exChangeName, // 交换器名称
		"",           // 路由键（fanout 类型忽略）
		false,        // mandatory
		false,        // immediate
		amqp.Publishing{
			Body: []byte(body),
		})
	if err != nil {
		logrus.Errorf("发送失败: %v", err)
		return
	}
	fmt.Printf("发送消息: %s\n", body)
}
```

```text
声明交换器  可以直接省略,只需要创建一次交换器就行
创建临时队列
将队列绑定到交换器
消费消息 
// 声明 fanout 类型的交换器
err = ch.ExchangeDeclare(
	exChangeName, // 交换器名称
	"fanout",     // 交换器类型
	true,         // 持久化
	false,        // 非自动删除
	false,        // 内部使用
	false,        // 不等待服务器确认
	nil,          // 额外参数
)
if err != nil {
	log.Fatalf("声明交换器失败 %s", err)
}

// 创建临时队列（自动生成唯一名称，连接关闭后自动删除）
q, err := ch.QueueDeclare(
	"",    // 空名称，让 RabbitMQ 自动生成
	false, // 非持久化
	true,  // 排他性（仅当前连接可见）
	true,  // 自动删除
	false, // 不等待服务器确认
	nil,   // 额外参数
)
if err != nil {
	log.Fatalf("声明临时队列失败 %s", err)
}

// 将队列绑定到交换器（关键步骤）
err = ch.QueueBind(
    q.Name,       // 队列名称
    "",           // 路由键（fanout 类型忽略）
    exChangeName, // 交换器名称
    false,        // 不等待服务器确认
    nil,          // 额外参数
)

// 消费消息
msgs, err := ch.Consume(
    q.Name,   // 队列名称
    "",       // 消费者标签
    true,     // 自动确认（简单示例，生产环境建议手动确认）
    false,    // 非排他性
    false,    // 非本地消费者
    false,    // 不等待服务器确认
    nil,      // 额外参数
)
if err != nil {
    log.Fatalf("创建消费者失败 %s", err)
}

fmt.Println("准备接收消息")
for d := range msgs {
    log.Printf("[x] 收到消息: %s\n", d.Body)
}
```

ps : 这种使用的模式, 消费者只能消费生产者生产的消息

## 发布订阅模式 缓存消息

之前的ps : 交换器只会做分发, 不会做保存消息的 ;

生产者生产的时候,提前绑定消费者的队列;

消费者消费消息的时候, 也绑定到这个队列就行了

```text
创建交换器 
创建临时队列
将队列绑定到交换器(关键)
// 1. 声明交换机
	err = ch.ExchangeDeclare(
		exchangeName,
		"fanout", // 可改成 direct / topic
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatal("创建交换机失败：", err)
	}
	// 2. 生产者创建【固定正式队列】
	_, err = ch.QueueDeclare(
		queueName, // 固定名称
		true,      // 队列持久化
		false,     // 不自动删除
		false,     // 非独占，所有客户端都能访问
		false,
		nil,
	)
	if err != nil {
		log.Fatal("创建队列失败：", err)
	}

	// 3. 生产者主动完成绑定：队列 ←→ 交换机
	err = ch.QueueBind(
		queueName,
		"",        // fanout路由键填空
		exchangeName,
		false,
		nil,
	)
	if err != nil {
		log.Fatal("队列绑定交换机失败：", err)
	}
	fmt.Println("生产者初始化完成：交换机+队列+绑定全部建好")

	// 发送消息到交换机，自动路由进已绑定队列
	for i := 1; i <= 10; i++ {
		msg := fmt.Sprintf("业务消息 %d", i)
		err = ch.Publish(
			exchangeName,
			"",
			false,
			false,
			amqp.Publishing{
				DeliveryMode: amqp.Persistent,
				Body:         []byte(msg),
			},
		)
		if err != nil {
			log.Println("发送失败", err)
			continue
		}
		fmt.Println("发送成功：", msg)
	}

	// 常驻防止程序退出
	select {}
}
```

消费者只需要绑定到创建好的队列中去 获取消息即可 ;

## 路由模式

精准投喂 , 严格匹配 rountingKey , 发送给 绑定键 完全一致的 队列

生产者指定消费者进行消费

基于消息的 “路由键（Routing Key）” 精确匹配消息分发，生产者发送消息时指定路由键，消费者通过绑定队列与路由键的关系接收特定消息。

交换器的类型必须是direct

发送消息的时候指定路由键即可

```text
package main

import (
  "fmt"
  "github.com/sirupsen/logrus"
  "github.com/streadway/amqp"
  "log"
)

func main() {
  // 连接 RabbitMQ
  conn, err := amqp.Dial("amqp://admin:password@10.3.0.8:5672/")
  if err != nil {
    log.Fatalf("无法连接到 RabbitMQ: %v", err)
  }
  defer conn.Close()

  // 创建通道
  ch, err := conn.Channel()
  if err != nil {
    log.Fatalf("无法打开通道: %v", err)
  }
  defer ch.Close()

  exChangeName := "logs_direct"

  // 声明 fanout 类型的交换器
  err = ch.ExchangeDeclare(
    exChangeName, // 交换器名称
    "direct",     // 交换器类型
    true,         // 持久化
    false,        // 非自动删除
    false,        // 内部使用
    false,        // 不等待服务器确认
    nil,          // 额外参数
  )
  if err != nil {
    log.Fatalf("声明交换器失败 %s", err)
  }

  for i := 0; i < 20; i++ {
    // 发送消息
    body := fmt.Sprintf("msg-%d", i)
    err = ch.Publish(
      exChangeName, //  交换器名称
      "node001",           //
      false,        // mandatory
      false,        // immediate
      amqp.Publishing{
        Body: []byte(body),
      })
    if err != nil {
      logrus.Errorf("发送失败: %v", err)
      return
    }
    fmt.Printf("发送消息: %s\n", body)
  }
  for i := 0; i < 10; i++ {
    // 发送消息
    body := fmt.Sprintf("msg-%d", i)
    err = ch.Publish(
      exChangeName, //  交换器名称
      "node002",           //
      false,        // mandatory
      false,        // immediate
      amqp.Publishing{
        Body: []byte(body),
      })
    if err != nil {
      logrus.Errorf("发送失败: %v", err)
      return
    }
    fmt.Printf("发送消息: %s\n", body)
  }
}
```

```text
package main

import (
  "fmt"
  "github.com/streadway/amqp"
  "log"
)

func main() {
  // 连接 RabbitMQ
  conn, err := amqp.Dial("amqp://admin:password@10.3.0.8:5672/")
  if err != nil {
    log.Fatalf("无法连接到 RabbitMQ: %v", err)
  }
  defer conn.Close()

  // 创建通道
  ch, err := conn.Channel()
  if err != nil {
    log.Fatalf("无法打开通道: %v", err)
  }
  defer ch.Close()

  exChangeName := "logs_direct"

  // 声明 fanout 类型的交换器
  err = ch.ExchangeDeclare(
    exChangeName, // 交换器名称
    "direct",     // 交换器类型
    true,         // 持久化
    false,        // 非自动删除
    false,        // 内部使用
    false,        // 不等待服务器确认
    nil,          // 额外参数
  )
  if err != nil {
    log.Fatalf("声明交换器失败 %s", err)
  }

  // 创建临时队列（自动生成唯一名称，连接关闭后自动删除）
  q, err := ch.QueueDeclare(
    "",    // 空名称，让 RabbitMQ 自动生成
    false, // 非持久化
    true,  // 排他性（仅当前连接可见）
    true,  // 自动删除
    false, // 不等待服务器确认
    nil,   // 额外参数
  )
  if err != nil {
    log.Fatalf("声明临时队列失败 %s", err)
  }

  // 将队列绑定到交换器（关键步骤）
  err = ch.QueueBind(
    q.Name,       // 队列名称
    "node002",           // 路由键（fanout 类型忽略）
    exChangeName, // 交换器名称
    false,        // 不等待服务器确认
    nil,          // 额外参数
  )

  // 消费消息
  msgs, err := ch.Consume(
    q.Name, // 队列名称
    "",     // 消费者标签
    true,   // 自动确认（简单示例，生产环境建议手动确认）
    false,  // 非排他性
    false,  // 非本地消费者
    false,  // 不等待服务器确认
    nil,    // 额外参数
  )
  if err != nil {
    log.Fatalf("创建消费者失败 %s", err)
  }

  fmt.Println("准备接收消息")
  for d := range msgs {
    log.Printf("[x] 收到消息: %s\n", d.Body)
  }

}
```

## 主题模式

基于路由键的 “模糊匹配” 分发，支持通配符，比路由模式更灵活

绑定队列时可使用通配符：

- `*`：匹配一个单词（如 `order.*` 匹配 `order.create`，但不匹配 `order.create.success`）。
- `#`：匹配零个或多个单词（如 `order.#` 匹配 `order.create`、`order.create.success`）。

需要实现的就是 : 创建交换器的 type 为 "topic"

```text
package main

import (
  "log"
  "os"
  "strings"

  "github.com/streadway/amqp"
)

func failOnError(err error, msg string) {
  if err != nil {
    log.Fatalf("%s: %s", msg, err)
  }
}

func main() {
  conn, err := amqp.Dial("amqp://admin:password@10.3.0.8:5672/")
  failOnError(err, "Failed to connect to RabbitMQ")
  defer conn.Close()

  ch, err := conn.Channel()
  failOnError(err, "Failed to open a channel")
  defer ch.Close()

  // 声明主题类型的交换器
  err = ch.ExchangeDeclare(
    "logs_topic", // name
    "topic",      // type
    true,         // durable
    false,        // auto-deleted
    false,        // internal
    false,        // no-wait
    nil,          // arguments
  )
  failOnError(err, "Failed to declare an exchange")

  // 设置路由键，默认为"anonymous.info"
  body := bodyFrom(os.Args)
  routingKey := severityFrom(os.Args)

  // 发布消息到交换器
  err = ch.Publish(
    "logs_topic", // exchange
    routingKey,   // routing key
    false,        // mandatory
    false,        // immediate
    amqp.Publishing{
      ContentType: "text/plain",
      Body:        []byte(body),
    })
  failOnError(err, "Failed to publish a message")

  log.Printf(" [x] Sent %s:%s", routingKey, body)
}

func bodyFrom(args []string) string {
  var s string
  if (len(args) < 3) || os.Args[2] == "" {
    s = "hello"
  } else {
    s = strings.Join(args[2:], " ")
  }
  return s
}

func severityFrom(args []string) string {
  var s string
  if (len(args) < 2) || os.Args[1] == "" {
    s = "anonymous.info"
  } else {
    s = os.Args[1]
  }
  return s
}
```

```text
package main

import (
  "log"
  "os"

  "github.com/streadway/amqp"
)

func failOnError(err error, msg string) {
  if err != nil {
    log.Fatalf("%s: %s", msg, err)
  }
}

func main() {
  conn, err := amqp.Dial("amqp://admin:password@10.3.0.8:5672/")
  failOnError(err, "Failed to connect to RabbitMQ")
  defer conn.Close()

  ch, err := conn.Channel()
  failOnError(err, "Failed to open a channel")
  defer ch.Close()

  // 声明主题类型的交换器
  err = ch.ExchangeDeclare(
    "logs_topic", // name
    "topic",      // type
    true,         // durable
    false,        // auto-deleted
    false,        // internal
    false,        // no-wait
    nil,          // arguments
  )
  failOnError(err, "Failed to declare an exchange")

  // 声明临时队列
  q, err := ch.QueueDeclare(
    "",    // name
    false, // durable
    false, // delete when unused
    true,  // exclusive
    false, // no-wait
    nil,   // arguments
  )
  failOnError(err, "Failed to declare a queue")

  // 获取命令行参数作为绑定键
  if len(os.Args) < 2 {
    log.Printf("Usage: %s [binding_key]...", os.Args[0])
    os.Exit(0)
  }
  for _, s := range os.Args[1:] {
    log.Printf("Binding queue %s to exchange %s with routing key %s",
      q.Name, "logs_topic", s)
    err = ch.QueueBind(
      q.Name,       // queue name
      s,            // routing key
      "logs_topic", // exchange
      false,
      nil)
    failOnError(err, "Failed to bind a queue")
  }

  msgs, err := ch.Consume(
    q.Name, // queue
    "",     // consumer
    true,   // auto-ack
    false,  // exclusive
    false,  // no-local
    false,  // no-wait
    nil,    // args
  )
  failOnError(err, "Failed to register a consumer")

  forever := make(chan bool)

  go func() {
    for d := range msgs {
      log.Printf(" [x] %s: %s", d.RoutingKey, d.Body)
    }
  }()

  log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
  <-forever
}
```

```text
go run 14.主题模式-消费者.go "kernal.*" # 接收内核相关的所有服务信息
go run 14.主题模式-消费者.go "*.error" # 接收所有服务的error信息
go run 14.主题模式-消费者.go "#" # 接收所有
```

```text
go run 13.主题模式-生产者.go "auth.error" "认证服务错误"
go run 13.主题模式-生产者.go "kernal.error" "系统内核错误"
go run 13.主题模式-生产者.go "auth.warning" "认证警告"
```

## 死信队列

处理 “无法被正常消费” 的消息（如消费超时、消费失败且重试次数耗尽），将其转移到专门的 “死信队列”，便于后续排查问题。

- 为普通队列设置死信交换器（`x-dead-letter-exchange`）和死信路由键（`x-dead-letter-routing-key`）。
- 当消息满足死信条件（如被拒绝 `basic.reject` 且 `requeue=false`、TTL 过期、队列满）时，会被路由到死信队列。

感觉像垃圾站 : 满足过期 和 退回的消息都会被处理到死信队列中去 ;

正常生产者 : 只需要设置交换器绑定到死信交换器就行

1. 先声明普通交换器
2. 声明普通队列，通过额外参数设置死信交换器
3. 绑定普通队列到普通交换器
4. 发送消息到普通队列

```text
package main

import (
  "log"
  "os"
  "strings"

  "github.com/streadway/amqp"
)

func failOnError(err error, msg string) {
  if err != nil {
    log.Fatalf("%s: %s", msg, err)
  }
}

func main() {
  conn, err := amqp.Dial("amqp://admin:password@10.3.0.8:5672/")
  failOnError(err, "Failed to connect to RabbitMQ")
  defer conn.Close()

  ch, err := conn.Channel()
  failOnError(err, "Failed to open a channel")
  defer ch.Close()

  // 声明普通交换器
  err = ch.ExchangeDeclare(
    "normal_exchange", // name
    "direct",          // type
    true,              // durable
    false,             // auto-deleted
    false,             // internal
    false,             // no-wait
    nil,               // arguments
  )
  failOnError(err, "Failed to declare an exchange")

  // 声明普通队列并设置死信交换器
  args := amqp.Table{
    "x-dead-letter-exchange":    "dlx_exchange",
    "x-dead-letter-routing-key": "dlx_key",
  }
  _, err = ch.QueueDeclare(
    "normal_queue", // name
    true,           // durable
    false,          // delete when unused
    false,          // exclusive
    false,          // no-wait
    args,           // arguments
  )
  failOnError(err, "Failed to declare a queue")

  // 绑定普通队列到普通交换器
  err = ch.QueueBind(
    "normal_queue",       // queue name
    "normal_routing_key", // routing key
    "normal_exchange",    // exchange
    false,
    nil,
  )
  failOnError(err, "Failed to bind a queue")

  // 发送消息到普通队列
  body := bodyFrom(os.Args)
  err = ch.Publish(
    "normal_exchange",    // exchange
    "normal_routing_key", // routing key
    false,                // mandatory
    false,                // immediate
    amqp.Publishing{
      ContentType: "text/plain",
      Body:        []byte(body),
    })
  failOnError(err, "Failed to publish a message")

  log.Printf(" [x] Sent %s", body)
}

func bodyFrom(args []string) string {
  var s string
  if (len(args) < 2) || os.Args[1] == "" {
    s = "hello"
  } else {
    s = strings.Join(args[1:], " ")
  }
  return s
}
```

也完全一样 , 只有一个reject\(\) 方法实现退回消息, 实现返回死信交换器;

```text
package main

import (
  "log"

  "github.com/streadway/amqp"
)

func failOnError(err error, msg string) {
  if err != nil {
    log.Fatalf("%s: %s", msg, err)
  }
}

func main() {
  conn, err := amqp.Dial("amqp://admin:password@10.3.0.8:5672/")
  failOnError(err, "Failed to connect to RabbitMQ")
  defer conn.Close()

  ch, err := conn.Channel()
  failOnError(err, "Failed to open a channel")
  defer ch.Close()

  // 声明普通交换器
  err = ch.ExchangeDeclare(
    "normal_exchange", // name
    "direct",          // type
    true,              // durable
    false,             // auto-deleted
    false,             // internal
    false,             // no-wait
    nil,               // arguments
  )
  failOnError(err, "Failed to declare an exchange")

  // 声明普通队列并设置死信交换器
  args := amqp.Table{
    "x-dead-letter-exchange":    "dlx_exchange",
    "x-dead-letter-routing-key": "dlx_key",
  }
  _, err = ch.QueueDeclare(
    "normal_queue", // name
    true,           // durable
    false,          // delete when unused
    false,          // exclusive
    false,          // no-wait
    args,           // arguments
  )
  failOnError(err, "Failed to declare a queue")

  // 绑定普通队列到普通交换器
  err = ch.QueueBind(
    "normal_queue",       // queue name
    "normal_routing_key", // routing key
    "normal_exchange",    // exchange
    false,
    nil,
  )
  failOnError(err, "Failed to bind a queue")

  // 消费普通队列中的消息
  msgs, err := ch.Consume(
    "normal_queue", // queue
    "",             // consumer
    false,          // auto-ack设为false，手动处理确认
    false,          // exclusive
    false,          // no-local
    false,          // no-wait
    nil,            // args
  )
  failOnError(err, "Failed to register a consumer")

  forever := make(chan bool)

  go func() {
    for d := range msgs {
      log.Printf(" [x] Received %s", d.Body)
      // 拒绝消息，不重新入队，触发死信机制
      d.Reject(false)
      log.Printf(" [x] Rejected message and sent to DLX")
    }
  }()

  log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
  <-forever
}
```

```text
package main

import (
  "log"

  "github.com/streadway/amqp"
)

func failOnError(err error, msg string) {
  if err != nil {
    log.Fatalf("%s: %s", msg, err)
  }
}

func main() {
  conn, err := amqp.Dial("amqp://admin:password@10.3.0.8:5672/")
  failOnError(err, "Failed to connect to RabbitMQ")
  defer conn.Close()

  ch, err := conn.Channel()
  failOnError(err, "Failed to open a channel")
  defer ch.Close()

  // 声明死信交换器
  err = ch.ExchangeDeclare(
    "dlx_exchange", // name
    "direct",       // type
    true,           // durable
    false,          // auto-deleted
    false,          // internal
    false,          // no-wait
    nil,            // arguments
  )
  failOnError(err, "Failed to declare an exchange")

  // 声明死信队列
  _, err = ch.QueueDeclare(
    "dlx_queue", // name
    true,        // durable
    false,       // delete when unused
    false,       // exclusive
    false,       // no-wait
    nil,         // arguments
  )
  failOnError(err, "Failed to declare a queue")

  // 绑定死信队列到死信交换器
  err = ch.QueueBind(
    "dlx_queue",    // queue name
    "dlx_key",      // routing key
    "dlx_exchange", // exchange
    false,
    nil,
  )
  failOnError(err, "Failed to bind a queue")

  // 消费死信队列中的消息
  msgs, err := ch.Consume(
    "dlx_queue", // queue
    "",          // consumer
    true,        // auto-ack
    false,       // exclusive
    false,       // no-local
    false,       // no-wait
    nil,         // args
  )
  failOnError(err, "Failed to register a consumer")

  forever := make(chan bool)

  go func() {
    for d := range msgs {
      log.Printf(" [x] DLX Received %s", d.Body)
    }
  }()

  log.Printf(" [*] Waiting for DLX messages. To exit press CTRL+C")
  <-forever
}
```

## 延迟队列

消息发送后不会立即被消费，而是延迟指定时间后才被处理

上面讲了死信队列，那么生产者可以让消息过期，这样消息就进入了死信队列，而且是按时间顺序进入的

这样消费者消费死信队列的数据即可

本质上就是 多加一个参数：`x-message-ttl` , 就把普通的队列变化为了延迟队列 ;

```text
package main

import (
  "log"
  "time"

  "github.com/streadway/amqp"
)

func failOnError(err error, msg string) {
  if err != nil {
    log.Fatalf("%s: %v", msg, err)
  }
}

func main() {
  conn, err := amqp.Dial("amqp://admin:password@10.3.0.8:5672/")
  failOnError(err, "Failed to connect to RabbitMQ")
  defer conn.Close()

  ch, err := conn.Channel()
  failOnError(err, "Failed to open a channel")
  defer ch.Close()

  // 声明死信交换器
  dlxExchange := "dlx_exchange"
  err = ch.ExchangeDeclare(
    dlxExchange, // name
    "direct",    // type
    true,        // durable
    false,       // auto-deleted
    false,       // internal
    false,       // no-wait
    nil,         // arguments
  )
  failOnError(err, "Failed to declare an exchange")

  // 声明死信队列
  dlQueueName := "dl_queue"
  _, err = ch.QueueDeclare(
    dlQueueName, // name
    true,        // durable
    false,       // delete when unused
    false,       // exclusive
    false,       // no-wait
    nil,         // arguments
  )
  failOnError(err, "Failed to declare a queue")

  // 绑定死信队列到死信交换器
  err = ch.QueueBind(
    dlQueueName, // queue name
    "dl_key",    // routing key
    dlxExchange, // exchange
    false,
    nil,
  )
  failOnError(err, "Failed to bind a queue")

  // 声明延迟队列（设置x-dead-letter-exchange和x-message-ttl参数）
  delayQueueName := "delay_queue"
  _, err = ch.QueueDeclare(
    delayQueueName, // name
    true,           // durable
    false,          // delete when unused
    false,          // exclusive
    false,          // no-wait
    amqp.Table{
      "x-dead-letter-exchange":    dlxExchange,
      "x-dead-letter-routing-key": "dl_key",
      "x-message-ttl":             5000, // 5秒后消息过期
    }, // arguments
  )
  failOnError(err, "Failed to declare a queue")

  // 发送消息到延迟队列
  body := "Hello, delayed message!"
  err = ch.Publish(
    "",             // exchange
    delayQueueName, // routing key
    false,          // mandatory
    false,          // immediate
    amqp.Publishing{
      ContentType: "text/plain",
      Body:        []byte(body),
    })
  failOnError(err, "Failed to publish a message")

  log.Printf(" [x] Sent %s", body)
  log.Println("消息已发送到延迟队列，5秒后将进入死信队列")

  time.Sleep(2 * time.Second) // 等待消息发送完成
}
```

```text
package main

import (
  "github.com/streadway/amqp"
  "log"
  "time"
)

func failOnError(err error, msg string) {
  if err != nil {
    log.Fatalf("%s: %v", msg, err)
  }
}

func main() {
  conn, err := amqp.Dial("amqp://admin:password@10.3.0.8:5672/")
  failOnError(err, "Failed to connect to RabbitMQ")
  defer conn.Close()

  ch, err := conn.Channel()
  failOnError(err, "Failed to open a channel")
  defer ch.Close()

  // 声明死信队列（消费者只需要关注死信队列）
  queueName := "dl_queue"
  _, err = ch.QueueDeclare(
    queueName, // name
    true,      // durable
    false,     // delete when unused
    false,     // exclusive
    false,     // no-wait
    nil,       // arguments
  )
  failOnError(err, "Failed to declare a queue")

  // 消费死信队列中的消息
  msgs, err := ch.Consume(
    queueName, // queue
    "",        // consumer
    true,      // auto-ack
    false,     // exclusive
    false,     // no-local
    false,     // no-wait
    nil,       // args
  )
  failOnError(err, "Failed to register a consumer")

  var forever chan struct{}

  go func() {
    for d := range msgs {
      log.Printf(" [x] Received %s", d.Body)
      log.Printf("当前时间: %s", time.Now().Format("2006-01-02 15:04:05"))
    }
  }()

  log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
  <-forever
}
```

## 优先级队列

声明优先级队列

在队列声明时通过`x-max-priority`参数设置队列支持的最大优先级

发送带优先级的消息

在`amqp.Publishing`中设置`Priority`字段指定消息的优先级

消费者会优先收到优先级较高的消息

```text
package main

import (
  "fmt"
  "github.com/streadway/amqp"
  "log"
  "mq_study/core"
)

func main() {
  ch := core.InitMQ()

  //声明优先级队列
  q, err := ch.QueueDeclare(
    "yxj", false, false, false, false,
    amqp.Table{
      "x-max-priority": 10, // 设置最大优先级
    },
  )
  if err != nil {
    log.Fatal(err)
  }
  // 发送不同优先级的消息
  messages := []struct {
    body     string
    priority uint8
  }{
    {"这是低优先级消息 (1)", 1},
    {"这是中优先级消息 (5)", 5},
    {"这是高优先级消息 (10)", 10},
    {"这是另一个低优先级消息 (2)", 2},
    {"这是另一个高优先级消息 (9)", 9},
  }

  for _, msg := range messages {
    err = ch.Publish(
      "",     // 交换机
      q.Name, // 路由键（队列名称）
      false,  // 非强制
      false,  // 非立即
      amqp.Publishing{
        ContentType: "text/plain",
        Body:        []byte(msg.body),
        Priority:    msg.priority, // 设置消息优先级
      })
    if err != nil {
      fmt.Println("消息发送失败", err)
      continue
    }
    log.Printf("已发送: %s 优先级: %d", msg.body, msg.priority)
  }
}
```

## 回调队列

生产者生产消息 \(回调队列名字 \+ 回调的 id号\)

消费者消费消息，然后把结果再返回给回调队列

```text
package main

import (
  "fmt"
  "github.com/google/uuid"
  "github.com/streadway/amqp"
  "log"
  "mq_study/core"
)

func main() {
  ch := core.InitMQ()

  //声明普通队列
  q, err := ch.QueueDeclare(
    "request_queue", false, false, false, false, nil)
  if err != nil {
    log.Fatal(err)
  }

  // 声明回调队列
  callbackQueue, err := ch.QueueDeclare(
    "",    // 空名称表示让RabbitMQ自动生成队列名
    false, // 非持久化（因为响应消息不需要长期保存）
    true,  // 自动删除（当消费者断开连接时）
    true,  // 排他性（只允许当前连接访问）
    false, // 非阻塞
    nil,
  )
  msgs, err := ch.Consume(
    callbackQueue.Name,  // 回调队列名
    "", // 消费者标签
    true,                // 自动确认
    false,               // 非排他性
    false,               // 不阻塞
    false,               // 无参数
    nil,
  )
  if err != nil {
    log.Fatal(err)
  }

  for i := 0; i < 5; i++ {
    msg := fmt.Sprintf("消息 %d", i)
    msgID := uuid.New().String() // 消息id，用于匹配回调队列中的消息
    err = ch.Publish(
      "",     // 交换机
      q.Name, // 路由键（队列名称）
      false,  // 非强制
      false,  // 非立即
      amqp.Publishing{
        Body:          []byte(msg),
        CorrelationId: msgID,+
        ReplyTo:       callbackQueue.Name,
      })
    if err != nil {
      fmt.Println("消息发送失败", err)
      continue
    }
    log.Printf("已发送: %s 消息id %s", msg, msgID)
  }
  for d := range msgs {
    fmt.Printf("收到回调消息 %s %s\n", d.Body, d.CorrelationId)
  }
}
```

```text
package main

import (
  "fmt"
  "github.com/streadway/amqp"
  "log"
  "mq_study/core"
)

func main() {
  ch := core.InitMQ()

  // 4.消费消息
  consumer, err := ch.Consume("request_queue", "x1", true, false, false, false, nil)
  if err != nil {
    log.Fatal(err)
  }
  for msg := range consumer {
    fmt.Println("消息内容", string(msg.Body), msg.CorrelationId)
    m := fmt.Sprintf("这是回来的消息 %s", msg.CorrelationId)
    err = ch.Publish("", msg.ReplyTo, false, false, amqp.Publishing{
      Body:          []byte(m),
      CorrelationId: msg.CorrelationId,
    })
    if err != nil {
      fmt.Println("发送响应消息失败", err)
      continue
    }
    fmt.Println("发送响应消息", m)

  }
}
```

### 流量控制

生产者发送消息，如果队列消息已经积压了，则生产者慢点发

消费者按照自己能力消费消息

生产者 通过 ch\.QueueInspect\([q\.Name](http://q.name/)\) 获取队列状态

消费者通过ch\.Qos\(\) 设置消费的能力

**消费者控消费速度 \+ 生产者控发送速度**，双向限流，解决消息积压、消费跟不上生产问题

1. 消费者用 `Qos` 限制单次拉取消息数量，**按自己处理能力干活**
2. 生产者轮询查询队列堆积数，**队列满了就暂停发送**，等消费消化再继续发

Go复制代码

```text
package main

import (
  "fmt"
  "log"
  "mq_study/core"
  "time"

  "github.com/streadway/amqp"
)

func failOnError(err error, msg string) {
  if err != nil {
    log.Fatalf("%s: %s", msg, err)
  }
}

// 1. 使用 QoS 进行流量控制（最常用方式）
func consumerWithQoS(consumerID string, count int) {
  ch := core.InitMQ()
  // 声明队列
  q, err := ch.QueueDeclare(
    "flow_control_queue",
    true,
    false,
    false,
    false,
    nil,
  )
  failOnError(err, "Failed to declare a queue")

  // 设置 QoS (Quality of Service)
  // 第一个参数: prefetchCount - 每次从队列获取的最大消息数
  // 第二个参数: prefetchSize - 每次获取的最大字节数，0表示不限制
  // 第三个参数: global - 是否对整个连接生效，false表示只对当前通道生效
  err = ch.Qos(
    count, // 每次最多处理条消息，处理完再获取新的
    0,     // 不限制字节数
    false,
  )
  failOnError(err, "Failed to set QoS")

  // 消费消息
  msgs, err := ch.Consume(
    q.Name,
    consumerID,
    false, // 关闭自动确认，手动确认消息处理完成
    false,
    false,
    false,
    nil,
  )
  failOnError(err, "Failed to register a consumer")

  forever := make(chan bool)

  go func() {
    for d := range msgs {
      log.Printf("消费者 %s 收到消息: %s", consumerID, d.Body)

      // 模拟处理耗时
      time.Sleep(500 * time.Millisecond)

      // 手动确认消息已处理
      d.Ack(false)
      log.Printf("消费者 %s 确认消息处理完成", consumerID)
    }
  }()

  log.Printf("消费者 %s (QoS控制) 启动，等待消息...", consumerID)
  <-forever
}

// 基于队列长度的流量控制
func producerWithQueueLengthControl() {
  ch := core.InitMQ()

  // 声明队列
  q, err := ch.QueueDeclare(
    "flow_control_queue",
    true,
    false,
    false,
    false,
    nil,
  )
  failOnError(err, "Failed to declare a queue")

  maxQueueLength := 100 // 队列最大长度阈值

  for i := 1; i <= 1000; i++ {
    // 获取队列状态
    queueStatus, err := ch.QueueInspect(q.Name)
    failOnError(err, "Failed to inspect queue")

    // 如果队列长度超过阈值，等待
    if queueStatus.Messages >= maxQueueLength {
      log.Printf("队列长度 %d 超过阈值 %d，等待...", queueStatus.Messages, maxQueueLength)
      time.Sleep(2 * time.Second)
      i-- // 重试当前消息
      continue
    }

    body := fmt.Sprintf("这是第 %d 条消息", i)
    err = ch.Publish(
      "",
      q.Name,
      false,
      false,
      amqp.Publishing{
        DeliveryMode: amqp.Persistent,
        ContentType:  "text/plain",
        Body:         []byte(body),
      })
    failOnError(err, "Failed to publish a message")

    log.Printf("已发送消息 %d (当前队列长度: %d)", i, queueStatus.Messages)
  }

  log.Println("所有消息发送完成")
}

func main() {
  // 启动消费者（带QoS控制）
  go consumerWithQoS("consumer_1", 2)
  go consumerWithQoS("consumer_2", 1)

  // 启动生产者（选择一种流量控制方式）
  go producerWithQueueLengthControl()

  // 保持程序运行
  time.Sleep(5 * time.Minute)
}
```

### 消息过期

之前讲延迟队列的时候，队列可以设置整体的消息过期时间

其实消息也可以设置过期时间

核心就是

Go复制代码

```text
amqp.Publishing{
  Body:         []byte(msg.body),
  Expiration:   fmt.Sprintf("%d", msg.ttl), // 消息过期时间(毫秒)
})
```

### 持久化

需要设置队列和消息的持久化

声明持久化队列

Go复制代码

```text
// 声明一个持久化的队列
  q, err := ch.QueueDeclare(
    "persistent_queue", // 队列名称
    true,               // 是否持久化
    false,              // 是否自动删除
    false,              // 是否排他
    false,              // 是否等待服务器响应
    nil,                // 额外参数
  )
```

声明交换器持久化

Go复制代码

```text
ch.ExchangeDeclare(
  exchangeName, // name
  "direct",     // type
  true,         // 是否持久化
  false,        //
  false,        //
  false,        //
  nil,          //
)
```

发送持久化消息

Go复制代码

```text
// 要发送的消息
body := "Hello, persistent message!"
// 发布消息到队列，设置为持久化
err = ch.Publish(
  "",     // 交换器
  q.Name, // 路由键（队列名称）
  false,  // 是否强制
  false,  // 是否立即
  amqp.Publishing{
    ContentType: "text/plain",
    // 重要：将消息标记为持久化（2表示持久化）
    DeliveryMode: amqp.Persistent,
    Body:         []byte(body),
  })
```

### 高可用配置

之前我们的rabbitMQ是跑在单机的

像这样的中间件服务，高可用是非常重要的

单节点的情况下，rabbitMQ容器挂了，整个依赖消息队列的业务都会受影响

这个在生产环境环境是万万接收不了的

这里就在一个机器上跑三个mq容器在模拟高可用配置

YAML复制代码

```text
version: '3'

services:
  rabbitmq1:
    image: rabbitmq:3.9-management
    container_name: rabbitmq1
    ports:
      - "5672:5672"  # mq端口，只映射一个
      - "15672:15672"  # RabbitMQ的管理界面端口
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
      RABBITMQ_ERLANG_COOKIE: 'TDONUYAMEVUIWQTTDRHM'
    hostname: rabbitmq1
    volumes:
      - ./rabbitmq1_data:/var/lib/rabbitmq
    networks:
      mq_network:
        ipv4_address: 10.1.0.2
  rabbitmq2:
    image: rabbitmq:3.9-management
    container_name: rabbitmq2
    hostname: rabbitmq2
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
      RABBITMQ_ERLANG_COOKIE: 'TDONUYAMEVUIWQTTDRHM'
    volumes:
      - ./rabbitmq2_data:/var/lib/rabbitmq
    networks:
      mq_network:
        ipv4_address: 10.1.0.3
  rabbitmq3:
    image: rabbitmq:3.9-management
    container_name: rabbitmq3
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
      RABBITMQ_ERLANG_COOKIE: 'TDONUYAMEVUIWQTTDRHM'
    hostname: rabbitmq3
    volumes:
      - ./rabbitmq3_data:/var/lib/rabbitmq
    networks:
      mq_network:
        ipv4_address: 10.1.0.4

networks:
  mq_network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 10.1.0.0/24
```

执行

Bash复制代码

```text
# 先停止 rabbitmq2 应用
docker exec rabbitmq2 rabbitmqctl stop_app
# 重置节点
docker exec rabbitmq2 rabbitmqctl reset
# 重新加入集群（确保主机名正确）
docker exec rabbitmq2 rabbitmqctl join_cluster rabbit@rabbitmq1
# 启动应用
docker exec rabbitmq2 rabbitmqctl start_app

docker exec rabbitmq3 rabbitmqctl stop_app
docker exec rabbitmq3 rabbitmqctl reset
docker exec rabbitmq3 rabbitmqctl join_cluster rabbit@rabbitmq1
docker exec rabbitmq3 rabbitmqctl start_app
```

然后在主节点的bash中，镜像队列就好了

Bash复制代码

```text
rabbitmqctl set_policy ha-queue-two '^' '{"ha-mode":"exactly","ha-params":3,"ha-sync-mode":"automatic"}'
```

在界面上看到三个节点在就说明ok了

![](</blogs/_assets/lakebook/5ee3489500075268e3ccfb7d.png>)

其中一个挂了，另外的就会顶上

## 参数详解

### 队列的参数

Go复制代码

```text
func (ch *Channel) QueueDeclare(name string, durable, autoDelete, exclusive, noWait bool, args Table) (Queue, error)
```

声明队列的时候，参数很多，到底每个参数表示什么意思呢

1. \*\*"\*\*name **"**：队列名称（name）

- 这是你要声明的队列的名称
- 如果为空字符串，RabbitMQ 会自动生成一个随机名称

2. durable：持久化（durable）

- `true` 表示队列是持久化的，在 broker 重启后队列依然存在
- `false` 表示队列是非持久化的，broker 重启后队列会被删除
- 注意：这只保证队列本身的持久化，不保证消息的持久化

3. autoDelete：自动删除（autoDelete）

- `true` 表示当最后一个消费者断开连接后，队列会自动删除
- `false` 表示队列不会自动删除，即使没有消费者连接

4. exclusive：排他性（exclusive）

- `true` 表示队列是排他的，只能被当前连接使用，连接关闭后队列会被删除
- `false` 表示队列可以被多个连接共享

5. noWait ：不等待（noWait）

- `true` 表示不需要等待服务器的确认，会立即返回
- `false` 表示会等待服务器的确认后才返回

6. args ：额外参数（args）

- 用于指定队列的额外属性，如消息 TTL、最大长度等
- `nil` 表示使用默认设置

声明队列的时候，相同名称的队列，如果重复声明，必须保证所有配置一样

设置队列消息长度

Go复制代码

```text
args := amqp.Table{
    "x-max-length": 100,        // 最大消息数100
    "x-overflow":   "reject-publish", // drop-head丢弃旧消息，reject-publish超过限制时拒绝新消息  
},
```

### 消息的参数

Go复制代码

```text
ch.Publish(
  "",    // exchange 交换器的名称
  "xxx", // key 路由键，如果exchange="" 则路由键=队列名
  true,  // mandatory 如果消息无法被路由到任何队列（没有匹配的绑定规则），RabbitMQ 会将消息返回给生产者。
  false, // immediate 已废弃 历史作用：如果消息路由到的队列没有消费者，消息会被返回给生产者。
  amqp.Publishing{
    Body: []byte("你好"),
  })
```

如果配置了mandatory\=true，就可以在NotifyReturn这个队列中获取没有匹配到路由的消息

Go复制代码

```text
returnChan := make(chan amqp.Return, 10)
  ch.NotifyReturn(returnChan)
  for returnMsg := range returnChan {
    log.Printf("消息被退回:")
    log.Printf("  回复码: %d", returnMsg.ReplyCode)
    log.Printf("  回复文本: %s", returnMsg.ReplyText)
    log.Printf("  交换机: %s", returnMsg.Exchange)
    log.Printf("  路由键: %s", returnMsg.RoutingKey)
    log.Printf("  消息体: %s", string(returnMsg.Body))
  }
```

Publishing 字段详解

Go复制代码

```text
type Publishing struct {
  // 应用程序或交换机特定的字段，headers类型交换机会检查此字段
  // 用于存储自定义键值对元数据，可用于headers交换机的路由规则匹配
  Headers Table

  // 消息属性
  ContentType     string    // MIME内容类型（如"text/plain"、"application/json"）
  ContentEncoding string    // MIME内容编码（如"gzip"、"base64"，无编码则为空）
  DeliveryMode    uint8     // 投递模式：0或1为非持久化，2为持久化（需配合持久化队列）
  Priority        uint8     // 消息优先级（0-9，需队列支持x-max-priority参数）
  CorrelationId   string    // 关联标识符，用于匹配请求与响应（尤其在RPC场景）
  ReplyTo         string    // 回复地址，指定接收响应的回调队列（常用于RPC）
  Expiration      string    // 消息过期时间（毫秒字符串，如"60000"表示60秒）
  MessageId       string    // 消息唯一标识符（业务层面，用于追踪或去重）
  Timestamp       time.Time // 消息创建的时间戳
  Type            string    // 消息类型名称（自定义，用于区分消息分类，如"order_created"）
  UserId          string    // 发送消息的用户ID（需RabbitMQ已存在的用户）
  AppId           string    // 发送消息的应用程序ID（标识消息来源应用）

  // 消息的实际业务数据负载
  Body []byte
}
```

### 消费者的参数

Go复制代码

```text
func (ch *Channel) Consume(queue, consumer string, autoAck, exclusive, noLocal, noWait bool, args Table) (<-chan Delivery, error) {}
```

1. **queue**：字符串类型，指定要消费的队列名称。
2. **consumer**：字符串类型，消费者的标识名称。可以自定义命名，用于在 RabbitMQ 管理界面中识别不同的消费者。
3. **autoAck**：布尔类型，是否自动确认消息。

- `true`：消息被消费者接收后会自动确认（从队列中移除），无论业务处理是否成功。
- `false`：需要手动调用 `Delivery.Ack()` 方法确认消息，确保业务处理完成后再删除消息。

4. **exclusive**：布尔类型，是否设置为排他性消费者。

- `true`：该消费者是队列的唯一消费者，其他消费者无法消费该队列。
- `false`：允许多个消费者同时消费该队列（消息会轮询分配给不同消费者）。

5. **noLocal**：布尔类型，是否禁止接收本连接发布的消息，需要借助direct交换器

- `true`：消费者不会收到由当前连接发布的消息。
- `false`：可以接收当前连接发布的消息（通常设为 `false`）。

6. **noWait**：布尔类型，是否非阻塞等待服务器响应。

- `true`：方法会立即返回，不等待服务器确认（可能存在潜在错误）。
- `false`：等待服务器确认后再返回（推荐使用）。

7. **args**：`Table` 类型（类似字典），额外的参数配置。通常用于传递 RabbitMQ 扩展属性（如消息优先级、过期时间等），一般情况下可传 `nil`。

msg\.Ack\(false\)表示收到此消息，此消息会从队列里面删除

如果不执行ack，也不执行reject，那么下次运行消费者，此消息会被投递给消费者

msg\.Reject\(true\)，表示拒绝消息，并且让消息重新入队

msg\.Reject\(false\)，表示拒绝消息，此消息会从队列中删除

如果消费者接收消息的处理任务存在失败的风险，那么建议手动确认消息

## 管理界面
