id bigint primary key auto\_increment : mysql中实现的 id 键值自增 ;

在 postgreSQL中 : 实现id创建自增 :

int auto\_increment \=\= serial ;

bigint auto\_increment \=\= bigserial ;

TIMESTAMPTZ 比 TIMESTAMP 更推荐用，存储时会转成 UTC，查询时按客户端时区显示，避免时区问题

最后使用 CHECK \(判断式\) 可以直接 限制范围 : 非负数, 非0 ;

REFERENCES users\(id\) : 外键 设置 references \(users\);

\- TIMESTAMP — 存什么取什么，不管时区，像个字符串

\- TIMESTAMPTZ — 存入时自动转 UTC，取出时按你客户端时区显示

```text
CREATE TABLE activities (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(100) NOT NULL,
    created_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    registered_count INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
    status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    registration_start_time TIMESTAMPTZ NOT NULL,
    registration_end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT activities_end_after_start CHECK (end_time > start_time),
    CONSTRAINT activities_registration_end_after_start CHECK (registration_end_time > registration_start_time),
    CONSTRAINT activities_registered_not_over_capacity CHECK (registered_count <= capacity)
);
```

使用 Constraint 约束, 实现保证数据的合法性 ;

最后创建的三条约束 ;
