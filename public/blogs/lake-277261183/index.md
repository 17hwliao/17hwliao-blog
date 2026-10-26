ElasticSearch 简称为es , 开源的分布式的全文搜索引擎 , 可以近乎实时的存储检索数据 ;

## es安装

使用docker实现es的安装 ;

```text
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.19.17
    container_name: elasticsearch
    restart: unless-stopped
    ports:
      - "9200:9200"
      - "9300:9300"
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
      # Local development only. Do not disable security in a production deployment.
      - xpack.security.enabled=false
      - xpack.security.http.ssl.enabled=false
      - TZ=Asia/Shanghai
    volumes:
      - C:/Docker/elasticsearch/data:/usr/share/elasticsearch/data
    networks:
      - elastic-net
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:9200/_cluster/health?wait_for_status=yellow || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 10
      start_period: 30s

networks:
  elastic-net:
    driver: bridge

```

```text
docker composed up -d 
```

这里可以直接点击 127\.0\.0\.1:9200 实现访问 ;

## 认识ES的基本操作

```text
go get github.com/elastic/go-elasticsearch/v9@latest
```

<table class="ne-table" id="AFp3H"><tbody><tr><td width="250"><p class="ne-p" id="u5fe0dadd"><span class="ne-text">方式</span></p></td><td width="250"><p class="ne-p" id="u9b1491ba"><code class="ne-code"><span class="ne-text">NewTyped()</span></code></p></td><td width="250"><p class="ne-p" id="ue78514c8"><code class="ne-code"><span class="ne-text">New()</span></code></p></td></tr><tr><td width="250"><p class="ne-p" id="u8c844451"><span class="ne-text">编写查询</span></p></td><td width="250"><p class="ne-p" id="udd03d23f"><span class="ne-text">Go 类型与链式构造器</span></p></td><td width="250"><p class="ne-p" id="u0dfb1745"><span class="ne-text">原始 JSON / REST 风格</span></p></td></tr><tr><td width="250"><p class="ne-p" id="u1b1e33d8"><span class="ne-text">编译期检查</span></p></td><td width="250"><p class="ne-p" id="u24f78579"><span class="ne-text">有，字段和查询结构更不易写错</span></p></td><td width="250"><p class="ne-p" id="u1668d09e"><span class="ne-text">少，JSON 是否正确主要运行时才知道</span></p></td></tr><tr><td width="250"><p class="ne-p" id="uc72c944b"><span class="ne-text">灵活性</span></p></td><td width="250"><p class="ne-p" id="u03b0bfaf"><span class="ne-text">常用 API 足够，受类型定义约束</span></p></td><td width="250"><p class="ne-p" id="ubf718f92"><span class="ne-text">最高，可快速使用任何 ES REST API</span></p></td></tr><tr><td width="250"><p class="ne-p" id="ue6d34b0f"><span class="ne-text">适合</span></p></td><td width="250"><p class="ne-p" id="u78276063"><span class="ne-text">新业务开发、常规搜索/聚合</span></p></td><td width="250"><p class="ne-p" id="uf1956ed5"><span class="ne-text">动态 DSL、复制 Kibana 请求、未覆盖的新接口</span></p></td></tr></tbody></table>

### 创建一个ES连接

```text
func EsConnect() {
	ES, err := elasticsearch.NewTyped(
  //找到es地址连接
		elasticsearch.WithAddresses("http://localhost:9200"),
	//设置认证信息,后续设置完成之后使用
    elasticsearch.WithBasicAuth("elastic", "haowuliao"),
	)
	if err != nil {
		log.Printf("创建 ES 客户端失败: %v", err)
		return
	}

	_, err = ES.Info().Do(context.Background())
	if err != nil {
		log.Printf("连接 ES 失败: %v", err)
		return
	}

	fmt.Println("ES 8 连接成功")
}

```

注意 :

使用type实现连接的时候, 函数名和类型名 ;

关键原则：`NewTyped`**↔**`*TypedClient`**；**`New`**↔**`*Client`**，全项目保持一致。**

### ES 认证

无需认证情况 :

跑的机子本地的端口不对外开放 ;

需要实现认证 :

对外开放服务 ;

```text
认证 + HTTPS + 节点间 TLS + 密钥不写死 + 不暴露 9300
在docker中开始设置密码
./bin/elasticsearch-setup-passwords interactive
y , 然后设置六种账户的密码 ; 
后续登陆统一用户名为elastic ; 
```

### ES 中的 索引CRUD操作

先了解一下Mapping :

**Mapping的核心作用：**

**\- 定义字段类型（text, keyword, integer, date等）**

**\- 设置分词器（analyzer）**

**\- 控制字段是否被索引**

**\- 定义动态映射规则**

索引\(Index\) ≈ 数据库表

└── 文档\(Document\) ≈ 行/记录

└── 字段\(Fields\) ≈ 列

└── Mapping ≈ 定义每个列的类型

```text
Go中创建Mapping示例：
mapping := `{
  "mappings": {
    "properties": {
      "title": {"type": "text", "analyzer": "standard"},
      "status": {"type": "keyword"},
      "created_at": {"type": "date"}
    }
  }
}`
基本操作：
- PUT /my_index - 创建索引并定义mapping
- GET /my_index/_mapping - 获取mapping
- PUT /my_index/_mapping - 更新mapping
```

```text
//查看某个索引的map
/index/_mapping
```

封装一个对象

```text
type UserModel struct {
	ID        uint      `json:"id"`
	UserName  string    `json:"user_name"`
	QuickMame string    `json:"quick_mame"`
	CreatedAt time.Time `json:"createdAt"`
}
```

创建一个索引的index

```text
type UserModel struct {
	ID        uint      `json:"id"`
	UserName  string    `json:"user_name"`
	QuickMame string    `json:"quick_mame"`
	CreatedAt time.Time `json:"createdAt"`
}

func (UserModel) Mapping() string {
	return `{
		"mappings": {
			"properties": {
				"title": {
					"type": "text"
				},
				"key": {
					"type": "keyword"
				},
				"user_id": {
					"type": "integer"
				},
				"created_at": {
					"type": "date",
						"format": "yyyy-MM-dd HH:mm:ss"
				}}}}`}
```

#### 官方的CRUD 具体实现API方法 :

CRUD的具体实现库 ;

global\.ESClient\.Indices\.Create // 创建索引  
global\.ESClient\.Indices\.Delete // 删除索引  
global\.ESClient\.Indices\.Exists // 判断索引是否存在  
global\.ESClient\.Indices\.Get // 查询索引配置

创建索引文件 : 使用内部的方法实现将可读对象转化为 请求体发送 ;

```text
createResponse, err := global.ESClient.Indices.Create(
		userIndexName,  //创建出来的索引的索引名; 
		global.ESClient.Indices.Create.WithBody(将这个可读取对象设为请求体。也就是将 Mapping JSON 发送给 ES。
			strings.NewReader(models.UserModel{}.Mapping()), //获取到UserModel中的请求方法; 
		),
		global.ESClient.Indices.Create.WithContext(ctx),  //为这次创建索引的 HTTP 请求绑定 ctx。
	)

	if err != nil {
		return fmt.Errorf("创建索引失败: %w", err)
	}
	defer createResponse.Body.Close()
```

通过访问地址 : 127\.0\.0\.1:9200/user\_index/\_mapping 可以查看自己创建出来的索引请求文件 ;

#### 索引删除

修改索引几乎不会使用 , 所以一般会先取判断是否存在 ;

```text
//判断客户端是否连接
if global.ESClient == nil {
		return errors.New("ES 客户端未初始化")
	}
  // 判断index是否已经存在 ;
	// 传参的限制为[]string{} 组
	existsResponse, err := global.ESClient.Indices.Exists(
		[]string{userIndexName},
		global.ESClient.Indices.Exists.WithContext(ctx),
	)
	if err != nil {
		return fmt.Errorf("检查索引是否存在失败: %w", err)
	}
	defer existsResponse.Body.Close()
```

建议使用状态实现直接判断 :

```text
switch existsResponse.StatusCode {
case 200:   这种创建的是单索引创建单文档 ,一般是单个索引创建多个类型文档
	// 索引存在：删除旧索引
	deleteResponse, err := global.ESClient.Indices.Delete(  //还是使用Indices中的官方API 
		[]string{userIndexName},
		global.ESClient.Indices.Delete.WithContext(ctx),  
	)
	if err != nil {
		return fmt.Errorf("删除旧索引失败: %w", err)
	}
	defer deleteResponse.Body.Close()

	if deleteResponse.IsError() {
		body, _ := io.ReadAll(deleteResponse.Body)
		return fmt.Errorf("删除旧索引失败: %s", body)
	}

case 404:
	// 索引不存在：跳过删除，直接创建

default:
	// 认证、网络、服务端异常等
	body, _ := io.ReadAll(existsResponse.Body)
	return fmt.Errorf("检查索引失败: %s", body)
}
```

## 文档的CRUD

### 添加文档

```text
if global.ESClient == nil {
		return errors.New("ES 客户端未初始化")
	}  // 先判断ESClient 是否成功初始化; 
//创建文档需要先封装结构体; 
	user := models.UserModel{
		ID:        11,
		UserName:  "zhaojiaqi",
		Age:       18,
		QuickName: "qutianhuaban",
		CreatedAt: time.Now(),
	}
```

```text
data, err := json.Marshal(user)
if err != nil {return fmt.Errorf("序列化用户数据失败: %w", err)}
```

```text
response, err := global.ESClient.Index(  //初始化ES客户端
		user_index, // 索引名：user_index 索引名称
		bytes.NewReader(data),  //创建读取流
		
    
    global.ESClient.Index.WithDocumentID(
      //实现整形转化:下面的函数实现将无符号整数转化为十进制字符串;
			strconv.FormatUint(uint64(user.ID), 10),   //设置ES文档的元数据 _id
    ),
    //若原本为int64,还需要转化
    global.ESClient.Index.WithDocumentID(
      	strconv.FormatInt(user.ID, 10),
    )
    原本id就为string的情况的时候 : 
    可以直接使用
    global.ESClient.Index.WithDocumentID("10") ; 

    
		global.ESClient.Index.WithContext(ctx),
	)
	if err != nil {
		return fmt.Errorf("创建文档失败: %w", err)
	}
	defer response.Body.Close()
```

### 删除文档

```text
if global.ESClient == nil {
  return errors.New("ES 客户端未初始化")
}
```

```text
response, err := global.ESClient.Delete(
		index.UserIndexName,  //获取文档索引
		strconv.FormatUint(uint64(id), 10),  //文档ID转化为10进制
		global.ESClient.Delete.WithContext(ctx),
	)
	if err != nil {
		return fmt.Errorf("delete document: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode == http.StatusNotFound {
		return fmt.Errorf("document not found: _id=%d", id)
	}

	if response.IsError() {
		body, _ := io.ReadAll(response.Body)
		return fmt.Errorf("delete document: %s", body)
	}

```

### 使用 id 批量实现删除一个索引下的文档

```text
if global.ESClient == nil {
		return errors.New("ES client is not initialized")
	}
	if len(ids) == 0 {
		return errors.New("document IDs cannot be empty")
	}
```

```text
var requestBody bytes.Buffer //创建的字符串容器
for _, id := range ids {
    id = strings.TrimSpace(id) //规范id本身字段的格式
    if id == "" {
       return errors.New("document ID cannot be empty")
    }
  
    // The Bulk API uses newline-delimited JSON (NDJSON): one action per line.
    实现将map转化为ES Bulk API需要的格式; 
    //map[string]map[string]string{
    	"delete": {
    		"	_index": index.UserIndexName,
    		"_id":    id,
    	},
  }
  //实现封装好一条Bulk的删除指令; 
    action, err := json.Marshal(map[string]map[string]string{   
       "delete": {
          "_index": index.UserIndexName,
          "_id":    id,
       },
    })
    if err != nil {
       return fmt.Errorf("encode bulk delete action: %w", err)
    }

    requestBody.Write(action)
    requestBody.WriteByte('\n')
}
```

```text
response, err := global.ESClient.Bulk(
    bytes.NewReader(requestBody.Bytes()),
    global.ESClient.Bulk.WithContext(ctx),
)
```

```text
var result struct {
       Errors bool `json:"errors"`
       Items  []struct {
          Delete struct {
             ID     string          `json:"_id"`
             Status int             `json:"status"`
             Error  json.RawMessage `json:"error"`
          } `json:"delete"`
       } `json:"items"`
    }
    if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
       return fmt.Errorf("decode bulk delete response: %w", err)
    }

    if !result.Errors {
       return nil
    }

    var failed []string
    for _, item := range result.Items {
       if item.Delete.Status >= 300 {
          failed = append(failed, fmt.Sprintf("_id=%s, status=%d, error=%s", item.Delete.ID, item.Delete.Status, item.Delete.Error))
       }
    }

    return fmt.Errorf("some documents were not deleted: %s", strings.Join(failed, "; "))
}
```

### 文档查询

```text
if global.ESClient == nil {
    return nil, errors.New("ES client is not initialized")
}
//单条查询直接调用函数实现查询即可
response, err := global.ESClient.Get(
    index.UserIndexName,
    strconv.FormatUint(uint64(id), 10),
    global.ESClient.Get.WithContext(ctx),
)
if err != nil {
    return nil, fmt.Errorf("get document: %w", err)
}
defer response.Body.Close()

if response.StatusCode == http.StatusNotFound {
    return nil, fmt.Errorf("document not found: _id=%d", id)
}
if response.IsError() {
    body, _ := io.ReadAll(response.Body)
    return nil, fmt.Errorf("get document: %s", body)
}
//这段代码是在把 ES 返回的 JSON 文档，转换成 Go 的 models.UserModel 结构体。
var result struct {
    Source models.UserModel `json:"_source"`
}
if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
    return nil, fmt.Errorf("decode document: %w", err)
}

return &result.Source, nil
```

### 列表查询

```text
page := 2
limit := 10
from := (page - 1) * limit // 10
```

```text
// DocListResult represents one page of user documents.
//定义返回的结构体类型; (返回条数和用户列表)//修改添加分页版本
type DocListResult struct {
	Page  int
	Limit int
	From  int
	Total int
	Users []models.UserModel
}

// DocFindList returns user documents ordered by created_at in descending order.
// from is the zero-based offset and size is the number of documents to return.
func DocFindList(ctx context.Context, from, size int) (DocListResult, error) {
    //检查客户端连接
    if global.ESClient == nil {
       return DocListResult{}, errors.New("ES client is not initialized")
    }
    //参数校验
   if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
  	from := (page - 1) * limit
    //构造ES查询JSON参数
    request := map[string]any{
       "from": from,
       "size": size,
       "query": map[string]any{
          "match_all": map[string]any{},
       },
       "sort": []map[string]map[string]string{
          {"created_at": {"order": "desc"}},
       },
    }
    使用序列化工具转化为JSON请求体
    requestBody, err := json.Marshal(request)
    if err != nil {
       return DocListResult{}, fmt.Errorf("encode search request: %w", err)
    }
    //查询相关的参数
    response, err := global.ESClient.Search(
       global.ESClient.Search.WithContext(ctx),
       global.ESClient.Search.WithIndex(index.UserIndexName),
       global.ESClient.Search.WithBody(bytes.NewReader(requestBody)),
    )
    if err != nil {
       return DocListResult{}, fmt.Errorf("search documents: %w", err)
    }
    defer response.Body.Close()

    if response.IsError() {
       body, _ := io.ReadAll(response.Body)
       return DocListResult{}, fmt.Errorf("search documents: %s", body)
    }
  //定义返回结构体,统一返回的基本数据类型; 
    var result struct {
       Hits struct {
          Total struct {
             Value int `json:"value"`
          } `json:"total"`
          Hits []struct {
             Source models.UserModel `json:"_source"`
          } `json:"hits"`
       } `json:"hits"`
    }
    if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
       return DocListResult{}, fmt.Errorf("decode search response: %w", err)
    }

    users := make([]models.UserModel, 0, len(result.Hits.Hits))
    for _, hit := range result.Hits.Hits {
       users = append(users, hit.Source)
    }

    return DocListResult{
		Page:  page,
		Limit: limit,
		From:  from,
		Total: result.Hits.Total.Value,
		Users: users,
	}, nil
}
```

### 精准匹配

主要就是查询参数列表中的 key \- value 匹配字段中 :

key要选择索引元素中的key\-word \-&gt; UserName , Age ;

```text
request := map[string]any{
		"from": from,
		"size": limit,
		"query": map[string]any{
    	"term": map[string]any{
    		"user_name": map[string]string{
    			"value": keyword,     <----- 填写keyword字段; 
      	},
    	},
    },
		"sort": []map[string]map[string]string{
			{"created_at": {"order": "desc"}},
		},
	}
```

### 模糊匹配

主要查test , 也可以实现查看keyword

```text
request := map[string]any{
		"from": from,
		"size": limit,
  "query": {
    "match": {
      "user_name": {
        "query": "sunyuhaan",
        "fuzziness": "AUTO"
      }
    }
  }
		"sort": []map[string]map[string]string{
			{"created_at": {"order": "desc"}},
		},
	}
```

### 嵌套字段的查询

对象内部的参数定义 :

```text
type Address struct {
	City     string `json:"city"`
	District string `json:"district"`
	Detail   string `json:"detail"`
}

type UserModel struct {
	ID        uint      `json:"id"`
	UserName  string    `json:"user_name"`
	QuickName string    `json:"quick_name"`
	Addresses []Address `json:"addresses"` // 嵌套对象数组
	CreatedAt time.Time `json:"created_at"`
}
```

```text
{
  "id": 11,
  "user_name": "zhaojiaqi",
  "addresses": [
    {
      "city": "Shanghai",
      "district": "Pudong",
      "detail": "Lujiazui"
    },
    {
      "city": "Beijing",
      "district": "Haidian",
      "detail": "Zhongguancun"
    }
  ]
}
```

```text
request := map[string]any{
		"from": from,
		"size": limit,
		"query": map[string]any{
			"nested": map[string]any{
				"path":       "addresses",
				"score_mode": "none",
				"query": map[string]any{
					"bool": map[string]any{
						"filter": []map[string]any{
							{"term": map[string]string{"addresses.city": city}},
							{"term": map[string]string{"addresses.district": district}},
						},
					},
				},
			},
		},
	}
```

## ES文档 更新

```text
func DocUpdate(ctx context.Context, id uint, updates map[string]any) error {
    if global.ESClient == nil {
       return errors.New("ES client is not initialized")
    }
    if len(updates) == 0 {
       return errors.New("updates cannot be empty")
    }

    // The Update API expects the changed fields under the "doc" property.
    requestBody, err := json.Marshal(map[string]any{
       "doc": updates,
    })
    if err != nil {
       return fmt.Errorf("encode update request: %w", err)
    }

    response, err := global.ESClient.Update(
       index.UserIndexName,
       strconv.FormatUint(uint64(id), 10),
       bytes.NewReader(requestBody),
       global.ESClient.Update.WithContext(ctx),
    )
    if err != nil {
       return fmt.Errorf("update document: %w", err)
    }
    defer response.Body.Close()

    if response.StatusCode == http.StatusNotFound {
       return fmt.Errorf("document not found: _id=%d", id)
    }
    if response.IsError() {
       body, _ := io.ReadAll(response.Body)
       return fmt.Errorf("update document: %s", body)
    }

    return nil
}
```

## ES文档更新

```text
func DocUpdate(ctx context.Context, id uint, updates map[string]any) error {
	if global.ESClient == nil {
		return errors.New("ES client is not initialized")
	}
	if len(updates) == 0 {
		return errors.New("updates cannot be empty")
	}

  //转化格式为JSON格式的请求 , 而是符合 ES Update API 格式的 JSON：
json.Marshal
→ 只负责把 Go 数据翻译成 JSON

ESClient.Update
  → 决定请求的是“更新文档”接口

"doc"
  → 告诉 ES：这是需要合并更新的字段
	requestBody, err := json.Marshal(map[string]any{
		"doc": updates,
	})
	if err != nil {
		return fmt.Errorf("encode update request: %w", err)
	}

	response, err := global.ESClient.Update(
		index.UserIndexName,
		strconv.FormatUint(uint64(id), 10),
		bytes.NewReader(requestBody),
		global.ESClient.Update.WithContext(ctx),
	)
	if err != nil {
		return fmt.Errorf("update document: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode == http.StatusNotFound {
		return fmt.Errorf("document not found: _id=%d", id)
	}
	if response.IsError() {
		body, _ := io.ReadAll(response.Body)
		return fmt.Errorf("update document: %s", body)
	}

	return nil
}
```

## 

##
