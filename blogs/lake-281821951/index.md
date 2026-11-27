### 简介

**Embedding（嵌入/向量化）是将文本转换为数值向量的过程。这些向量能够捕获文本的语义信息，使得语义相似的文本在向量空间中距离较近。**

### 应用场景

```text
 🔍 语义搜索：根据语义而非关键词搜索
 📚 RAG（检索增强生成）：为 AI 提供相关知识
 🎯 文本分类：基于语义的分类
 📊 推荐系统：相似内容推荐
 🔗 去重检测：发现重复或相似内容
```

## 基础使用

获取 API KEY \+ 设置环境变量

## 简单示例 : 文本实现向量化

```text
导入库 : github.com/cloudwe/eino-ext/components/embedding/ark
func main(){
    // 创建 ctx ; 
    // 创建 ARK Embedding 模型
embedder, err := ark.NewEmbedder(ctx, &ark.EmbeddingConfig{
    APIKey: os.Getenv("ARK_API_KEY"),
    Model:  os.Getenv("ARK_EMBEDDING_MODEL"), // 例如：doubao-embedding-large
})
if err != nil {
    log.Fatalf("创建 Embedder 失败: %v", err)
}

// 待向量化的文本
texts := []string{
    "Go 是一门编程语言",
    "Python 是一门编程语言",
    "今天天气真好",
}

// 生成向量
vectors, err := embedder.EmbedStrings(ctx, texts)
if err != nil {
    log.Fatalf("向量化失败: %v", err)
}

// 打印结果
for i, text := range texts {
    fmt.Printf("文本 %d: %s\n", i+1, text)
    fmt.Printf("  向量维度: %d\n", len(vectors[i]))
    fmt.Printf("  前5维: %v\n\n", vectors[i][:5])
}

// 计算相似度
similarity12 := cosineSimilarity(vectors[0], vectors[1])
similarity13 := cosineSimilarity(vectors[0], vectors[2])

fmt.Printf("文本1 和 文本2 的相似度: %.4f\n", similarity12)
fmt.Printf("文本1 和 文本3 的相似度: %.4f\n", similarity13)

}

// 计算余弦相似度
func cosineSimilarity(a, b []float64) float64 {
    if len(a) != len(b) {
        return 0
    }

    var dotProduct, normA, normB float64
    for i := range a {
        dotProduct += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }

    if normA == 0 || normB == 0 {
        return 0
    }

    return dotProduct / (sqrt(normA) * sqrt(normB))
}

func sqrt(x float64) float64 {
    return math.Sqrt(x)
}
```
