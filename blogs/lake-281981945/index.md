## 简介

Milvus 是一个开源的向量数据库 ,专门用来实现存储,索引 和 管理大规模向量数据 , 实现构建 AI应用 \(如RAG, 推荐系统,图像搜索等\)的理想选择 ;

### Milvus 的核心特性

```text
- ✅ 高性能向量搜索：支持十亿级向量的毫秒级搜索
- ✅ 多种索引类型：支持 IVF_FLAT、HNSW、ANNOY 等多种索引算法
- ✅ 分布式架构：支持水平扩展，可处理大规模数据
- ✅ 多种相似度度量：支持 L2、IP、COSINE、HAMMING、JACCARD 等
- ✅ 丰富的 SDK：支持 Python、Go、Java 等多种语言
- ✅ 云原生设计：支持 Kubernetes 部署
```

### Milvus 的应用场景

```text
- 🔍 语义搜索：基于向量相似度的语义检索
- 📚 RAG 系统：检索增强生成应用
- 🎯 推荐系统：基于向量相似度的内容推荐
- 🖼️ 图像搜索：以图搜图、相似图片检索
- 🎵 音频/视频搜索：多媒体内容检索
```

### Milvus 和 Elasticsearch

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1787205852710-6c45ad33-ccd0-421f-a6db-4685d29f3eaa.png>)

### 使用 Docker 创建安装 Milvus

**Milvus 本身是一个向量数据库，但它不像 MySQL 那样单进程就能跑，它的架构设计上把不同职责拆分给了独立的存储组件。具体来说：**

**Milvus 容器（核心）****— 负责向量索引的构建、搜索、插入等核心业务。但它****不自己存数据****，而是把存储委托出去。**

**它依赖两个外部组件：**

**etcd（元数据存储）****— Milvus 用它来记录"有哪些集合、有哪些索引、每个分片在哪个节点上"这类****元信息****。你可以把它理解为 Milvus 的"目录本"，数据量小但必须保证强一致性和快速读取，etcd 就是干这个的。**

**MinIO（对象存储）****— 向量数据本身（以及索引文件、日志文件）的实际存储。向量数据通常很大（几百万到几亿条向量，每条 128\~2048 维），所以 Milvus 把它们存到 S3 兼容的对象存储里。MinIO 就是一个可以私有部署的 S3 替代品。**

**Attu（管理界面） — 这个是可选的，就是 Milvus 官方提供的 Web GUI，方便你在浏览器里查看集合、管理索引、执行搜索测试，不用每次都敲代码连 19530 端**

```text
services:
  # ---- etcd: 元数据存储 ----
  etcd:
    image: quay.io/coreos/etcd:v3.5.25
    container_name: milvus-etcd
    restart: unless-stopped
    ports:
      - "2389:2379"
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
      - ETCD_SNAPSHOT_COUNT=50000
    volumes:
      - ./data/etcd:/etcd
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
    healthcheck:
      test: ["CMD", "etcdctl", "endpoint", "health"]
      interval: 30s
      timeout: 20s
      retries: 3
      start_period: 10s
    networks:
      - milvus-net

  # ---- MinIO: 对象存储（S3 兼容） ----
  minio:
    image: minio/minio:latest
    container_name: milvus-minio
    restart: unless-stopped
    ports:
      - "9001:9001"
      - "9011:9000"
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    volumes:
      - ./data/minio:/minio_data
    command: minio server /minio_data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
      start_period: 10s
    networks:
      - milvus-net

  # ---- Milvus: 向量数据库（standalone 模式） ----
  milvus:
    image: milvusdb/milvus:latest
    container_name: milvus
    restart: unless-stopped
    ports:
      - "19530:19530"
      - "9091:9091"
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - ./data/milvus:/var/lib/milvus
    command: ["milvus", "run", "standalone"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9091/healthz"]
      interval: 30s
      timeout: 20s
      retries: 3
      start_period: 90s
    depends_on:
      etcd:
        condition: service_healthy
      minio:
        condition: service_healthy
    networks:
      - milvus-net

  # ---- Attu: Milvus Web 可视化管理界面 ----
  attu:
    image: zilliz/attu:latest
    container_name: milvus-attu
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - MILVUS_URL=milvus:19530
    depends_on:
      milvus:
        condition: service_healthy
    networks:
      - milvus-net

networks:
  milvus-net:
    driver: bridge

```

## 基础使用

### 1\.创建Milvus 客户端

```text
func main(){
  ctx := context.Background() 
  //创建 Milvus 客户端
  addr := os.Getenv("MILUS_ADDR")
  if addr == "" {
      addr = "localhost:19530" // 默认的地址(gRPC 端口)
    }
  cli , err := client.NewClient(ctx , client.Config{
      Address : addr , 
  }) 
  if err != nil {
      log.Fatalf("创建Milvus客户端失败 : %v" ,err )
  }
  defer cli.Close() 
  fmp("Milvus客户端创建成功")
}
```

### 2\.创建 Indexer 创建索引文档

```text
func main(){
    // 获取环境变量
    addr := os.Getenv("MILVUS_ADDR")
    if addr == "" { addr = "192.168.179.138:19530" }
    // 创建客户端
    ctx := context.Background()
    cli, err := client.NewClient(ctx, client.Config{
        Address: addr,
    })
    if err != nil {
        log.Fatalf("创建 Milvus 客户端失败: %v", err)
        return
    }
    defer cli.Close()
    // 删除旧集合（如果存在），避免 schema 冲突
    collectionName := "eino_example"
    hasCollection, err := cli.HasCollection(ctx, collectionName)
    if err == nil && hasCollection {
        log.Printf("删除旧集合: %s", collectionName)
        if err := cli.DropCollection(ctx, collectionName); err != nil {
            log.Printf("删除集合失败（可能不存在）: %v", err)
        }
    } 
    // 2. 创建 Embedding 模型
    emb , err := ark.NewEmbedder(ctx,&ark.EmbeddingConfig{
        APIKey : os.Getenv("ARK_API_KEY") ,
        Model  : os.Getenv("ARK_EMBEDDING_MODEL") , 
    })
    if err != nil {
        log.Fatalf("创建Embedding失败:%w" ,err)
    }
    // 创建 Indexer
    // 注意：默认配置使用二进制向量（8192 维度，HAMMING 度量），不适用于 ARK Embedding 的浮点向量
    // 因此需要自定义 Fields 使用浮点向量类型
    // 首先需要获取向量维度：通过 Embedding 一个测试文档来检测
    testVector, err := emb.EmbedStrings(ctx, []string{"test"})
    if err != nil {
        log.Fatalf("无法获取向量维度: %v", err)
        return
    }
    if len(testVector) == 0 || len(testVector[0]) == 0 {
        log.Fatalf("无法获取向量维度: 向量为空")
        return
    }
    dim := int64(len(testVector[0]))
    log.Printf("检测到向量维度: %d", dim)
    //定义自定义字段 : 使用浮点向量
    fields := []*entity.Field{
    entity.NewField().WithName("id").WithDataType(entity.FieldTypeVarChar).WithMaxLength(255).WithIsPrimaryKey(true),
    entity.NewField().WithName("content").WithDataType(entity.FieldTypeVarChar).WithMaxLength(1024),
    entity.NewField().WithName("vector").WithDataType(entity.FieldTypeFloatVector).WithDim(dim),
    entity.NewField().WithName("metadata").WithDataType(entity.FieldTypeJSON),
    }
    // 自定义 DocumentConverter: 将 float64 向量转换为 float32 向量
    // 注意: 必须确保返回的数据格式与 Fields 定义的字段顺序和类型一致
    documentConverter := func(ctx context.Context, docs []*schema.Document, vectors [][]float64) ([][]interface{}, error) {
        rows := make([][]interface{}, len(docs))
        for i, doc := range docs {
        // 将 float64 向量转换为 float32 向量 (Milvus 需要 float32)
          if i >= len(vectors) {
            return nil, fmt.Errorf("向量数量不匹配: docs=%d, vectors=%d", len(docs), len(vectors))
        }
        vector32 := make([]float32, len(vectors[i]))
        for j, v := range vectors[i] {
            vector32[j] = float32(v)
        }
        // 构建行数据, 使用 map 格式
        // 字段名必须与 Fields 定义中的名称完全一致
        rows[i] = map[string]interface{}{
            "id":       doc.ID,
            "content":  doc.Content,
            "vector":   vector32, // []float32 类型
            "metadata": doc.MetaData,
        }
    }
    return rows, nil
}

    indexer, err := milvus.NewIndexer(ctx, &milvus.IndexerConfig{
        Client:    cli,
        Collection: collectionName, // 集合名称
        Embedding: emb,
        Fields:    fields,                   // 使用自定义浮点向量字段 (必须配置)
        MetricType: milvus.COSINE,          // 使用 COSINE 度量 (适用于浮点向量)
        DocumentConverter: documentConverter, // 自定义转换函数, 将 float64 转为 float32
    })
    if err != nil {
      log.Fatalf("创建 Indexer 失败: %v", err)
      return
  }
    log.Printf("Indexer 创建成功")
}
    // 准备文档
    docs := []*schema.Document{
      {
        ID:      "doc-1",
        Content: "Go 语言是 Google 开发的一门编程语言，具有并发编程的优势。",
        MetaData: map[string]any{
            "source": "go_intro",
            "type":   "programming",
        },
    },
    {
        ID:      "doc-2",
        Content: "Python 是一门易于学习的编程语言，广泛应用于数据科学和机器学习。",
        MetaData: map[string]any{
            "source": "python_intro",
            "type":   "programming",
        },
    },
}

// 索引文档
fmt.Println("=== 开始索引文档 ===")
ids, err := indexer.Store(ctx, docs)
if err != nil {
    log.Fatalf("索引失败: %v", err)
    return
}

fmt.Printf("成功索引 %d 个文档\n", len(ids))
for i, id := range ids {
    fmt.Printf(" 文档 %d: ID=%s\n", i+1, id)
}
```

### 3\.使用 Retriever 检索文档

```text
func main(){
  ctx := context.BackGround() ; 
  // 1. 创建 Milvus 客户端
  addr := os.Getenv("MILVUS_ADDR")
  if addr == "" {
      addr = "192.168.179.128:19530"
  }

  cli, err := client.NewClient(ctx, client.Config{
    Address: addr,
  })
  if err != nil {
      log.Fatalf("创建 Milvus 客户端失败: %v", err)
  }
  defer cli.Close()
  // 检查集合是否存在
  collectionName := "eino_example"
  hasCollection, err := cli.HasCollection(ctx, collectionName)
  if err != nil {
      log.Fatalf("检查集合失败: %v", err)
  }
  if !hasCollection {
      log.Fatalf("集合 %s 不存在, 请先运行 Indexer 创建集合和索引", collectionName)
  }
  log.Printf("集合 %s 已存在, 开始检索...", collectionName)
  // 2. 创建 Embedding 模型
embedder, err := ark.NewEmbedder(ctx, &ark.EmbeddingConfig{
    APIKey: os.Getenv("ARK_API_KEY"),
    Model:  os.Getenv("ARK_EMBEDDING_MODEL"),
})
if err != nil {
    log.Fatalf("创建 Embedder 失败: %v", err)
}

// 3. 创建 Retriever
// 根据错误信息,range_filter 错误可能是因为 Milvus 内部使用了 range search
// 尝试设置 SearchParam 使用默认的搜索方式,避免 range search
searchParam, err := entity.NewIndexAUTOINDEXSearchParam(1)
if err != nil {
    log.Fatalf("创建搜索参数失败: %v", err)
}
retriever, err := milvusretriever.NewRetriever(ctx, &milvusretriever.RetrieverConfig{
    Client:       cli,
    Collection:   collectionName,
    TopK:         3, // 返回最相关的 3 个文档
    MetricType:   entity.COSINE, // 使用 COSINE 度量（必须与 Indexer 创建集合时一致）
    Embedding:    embedder,
    OutputFields: []string{"id", "content", "metadata"}, // 指定要返回的字段
    // 尝试设置 SearchParam 使用默认搜索参数，避免 range search
    Sp: searchParam,
})
if err != nil {
    log.Fatalf("创建 Retriever 失败: %v", err)
}
// 4. 执行检索
query := "编程语言"
fmt.Printf("=== 检索: %s ===\n", query)

docs, err := retriever.Retrieve(ctx, query)
if err != nil {
    log.Fatalf("检索失败: %v", err)
}
  fmt.Printf("检索到 %d 个相关文档:\n\n", len(docs))
  for i, doc := range docs {
    fmt.Printf("文档 %d:\n", i+1)
    fmt.Printf("  ID: %s\n", doc.ID)
    fmt.Printf("  内容: %s\n", doc.Content)
    fmt.Printf("  元数据: %v\n\n", doc.MetaData)
  }
}
```

### 实现一个完整的 RAG 系统

```text
const (
    collectionName = "eino_rag_example"
)

func main() {
    ctx := context.Background()

    // 1. 创建 Milvus 客户端
    addr := os.Getenv("MILVUS_ADDR")
    if addr == "" {
        addr = "192.168.179.133:19530"
    }

    cli, err := client.NewClient(ctx, client.Config{
        Address: addr,
    })
    if err != nil {
        log.Fatalf("创建 Milvus 客户端失败: %v", err)
    }
    defer cli.Close()

    // 2. 创建 Embedding 模型
    embedder, err := ark.NewEmbedder(ctx, &ark.EmbeddingConfig{
        APIKey: os.Getenv("ARK_API_KEY"),
        Model:  os.Getenv("ARK_EMBEDDING_MODEL"),
    })
    if err != nil {
        log.Fatalf("创建 Embedder 失败: %v", err)
    }

    // 3. 检测向量维度
    testVector, err := embedder.EmbedStrings(ctx, []string{"test"})
    if err != nil {
        log.Fatalf("无法获取向量维度: %v", err)
    }
    if len(testVector) == 0 || len(testVector[0]) == 0 {
        log.Fatalf("无法获取向量维度: 向量为空")
    }
    dim := int64(len(testVector[0]))
    log.Printf("检测到向量维度: %d", dim)

    // 4. 定义自定义字段: 使用浮点向量
    fields := []*entity.Field{
        entity.NewField().WithName("id").WithDataType(entity.FieldTypeVarChar).WithMaxLength(255).WithIsPrimaryKey(true),
        entity.NewField().WithName("content").WithDataType(entity.FieldTypeVarChar).WithMaxLength(1024),
        entity.NewField().WithName("vector").WithDataType(entity.FieldTypeFloatVector).WithDim(dim),
        entity.NewField().WithName("metadata").WithDataType(entity.FieldTypeJSON),
    }

    // 5. 自定义 DocumentConverter: 将 float64 向量转换为 float32 向量
    documentConverter := func(ctx context.Context, docs []*schema.Document, vectors [][]float64) ([][]interface{}, error) {
        rows := make([][]interface{}, len(docs))
        for i, doc := range docs {
            if i >= len(vectors) {
                return nil, fmt.Errorf("向量数量不匹配: docs=%d, vectors=%d", len(docs), len(vectors))
            }

            vector32 := make([]float32, len(vectors[i]))
            for j, v := range vectors[i] {
                vector32[j] = float32(v)
            }

            rows[i] = map[string]interface{}{
                "id":       doc.ID,
                "content":  doc.Content,
                "vector":   vector32,
                "metadata": doc.MetaData,
            }
        }
        return rows, nil
    }

    // 6. 创建 Indexer
    indexer, err := milvusindexer.NewIndexer(ctx, &milvusindexer.IndexerConfig{
        Client:            cli,
        Collection:        collectionName,
        Embedding:         embedder,
        Fields:            fields,                   // 使用自定义浮点向量字段
        MetricType:        milvusindexer.COSINE,    // 使用 COSINE 度量
        DocumentConverter: documentConverter,       // 自定义转换函数
    })
    if err != nil {
        log.Fatalf("创建 Indexer 失败: %v", err)
    }

    // 准备知识库文档
    docs := []*schema.Document{
        {
            ID:      "eino-1",
            Content: "Eino 是字节跳动开源的大语言模型应用开发框架，基于 Go 语言开发。",
            MetaData: map[string]any{
                "source":   "eino_intro",
                "category": "framework",
            },
        },
        {
            ID:      "eino-2",
            Content: "Eino 提供了 ChatModel、Embedding、Retriever 等丰富的组件，支持 Chain 和 Graph 两种编排方式。",
            MetaData: map[string]any{
                "source":   "eino_components",
                "category": "framework",
            },
        },
    }
fmt.Println("=== 索引文档 ===")
indexedIDs, err := indexer.Store(ctx, docs)   // 实现存入文档
if err != nil {
    log.Fatalf("索引失败: %v", err)
}
fmt.Printf("成功索引 %d 个文档\n", len(indexedIDs))
fmt.Println("文档索引完成\n")

// 7. 创建 Retriever
searchParam, err := entity.NewIndexAUTOINDEXSearchParam(1)
if err != nil {
    log.Fatalf("创建搜索参数失败: %v", err)
}

retriever, err := milvusretriever.NewRetriever(ctx, &milvusretriever.RetrieverConfig{
    Client:       cli,
    Collection:   collectionName,
    TopK:         3, // 返回最相关的 3 个文档
    MetricType:   entity.COSINE, // 使用 COSINE 度量（必须与 Indexer 一致）
    Embedding:    embedder,
    OutputFields: []string{"id", "content", "metadata"}, // 指定要返回的字段
    Sp:           searchParam,                           // 设置搜索参数，避免 range_filter 错误
})
if err != nil {
    log.Fatalf("创建 Retriever 失败: %v", err)
}

// 5. 创建 ChatModel
chatModel, err := deepseek.NewChatModel(ctx, &deepseek.ChatModelConfig{
    APIKey:  os.Getenv("DEEPSEEK_API_KEY"),
    Model:   "deepseek-chat",
    BaseURL: "https://api.deepseek.com",
})
if err != nil {
    log.Fatalf("创建 ChatModel 失败: %v", err)
}

// 6. RAG 流程: 检索 + 生成
userQuery := "Eino 框架有哪些主要组件？"
fmt.Printf("=== 用户问题: %s ===\n\n", userQuery)

// 6.1 检索相关文档
fmt.Println("步骤 1: 检索相关文档...")
retrievedDocs, err := retriever.Retrieve(ctx, userQuery)
if err != nil {
    log.Fatalf("检索失败: %v", err)
}

fmt.Printf("检索到 %d 个相关文档:\n", len(retrievedDocs))
for i, doc := range retrievedDocs {
    score := doc.Score()
    if score != 0 {
        fmt.Printf("  [%d] %s (分数: %.4f)\n", i+1, doc.Content, score)
    } else {
        fmt.Printf("  [%d] %s\n", i+1, doc.Content)
    }
}
fmt.Println()

// 6.2 构建上下文
context := "相关文档内容: \n\n"
for i, doc := range retrievedDocs {
    context += fmt.Sprintf("%d. %s\n", i+1, doc.Content)
}

// 6.3 使用 LLM 生成回答
fmt.Println("步骤 2: 生成回答...")
messages := []*schema.Message{
    schema.SystemMessage(fmt.Sprintf(`你是一个专业的技术助手。
请基于以下文档内容回答用户问题。如果文档中没有相关信息，请如实告知。

%s`, context)),
    schema.UserMessage(userQuery),
}

response, err := chatModel.Generate(ctx, messages)
if err != nil {
    log.Fatalf("生成失败: %v", err)
}

fmt.Println("=== AI 回答 ===")
fmt.Println(response.Content)
```
