## 简介

PostgreSQL免费的对象\-关系型数据库,"开源界的Oracle"

#### postgresql官网

http://db\-engines\.com/en/ranking

## 使用docker安装

```text
services:
  postgresql:
    image: postgres:18
    container_name: postgresql
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-xxxx}
      POSTGRES_DB: ${POSTGRES_DB:-postgres}
      TZ: Asia/Shanghai
    ports:
      - "5432:5432"
    volumes:
      - "C:/Docker/postgresql:/var/lib/postgresql"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
```

pgSQL的内部用户设置 :

POSTGRES\_USER : 设置PostgreSQL 的超级用户名\(默认为postgres\) ;

POSTGRES\_PASSWORD : 设置 PostgreSQL 的超级用户密码 ;

POSTGRES\_DB : 设置默认数据库名 \(如果未设置, 默认创建与用户同名的数据库\) ;

## 基础命令

psql \-U &lt;用户名&gt; \-d &lt;数据库名&gt;

\-\- 查看所有数据库

\\l

\-\- 切换数据库

\\c 数据库名

\-\- 查看所有表

\\dt

\-\- 查看表结构

\\d 表名

\-\- 退出 psql

\\q

## 基本使用

```text
# 建库
creat database db ; 
# 查看当前的数据库列表
\l
# 进入数据库
\c
# 删除数据库
drop database db ; 
# shell中直接建库
createdb -U user mydb ; 
```

## 数据表的相关操作

```text
# 建表
create table test(id serial primary key , name varchar(16) not null) ; 
# 插入数据
insert into test(name) values('17hwliao') ; 
# 查记录
select * form test ; 
# 查当前库中的全部表
\d 
# 看表结构
\d test
```

```text
sql:

CREATE TABLE users(
    id BIGSERIAL PRIMARY KEY ,
    username VARCHAR(50) NOT NULL UNIQUE , --> 姓名
    password_hash VARCHAR(50) NOT NULL ,
    nickname VARCHAR(50) NOT NULL ,  --> 昵称
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) ;
```

## Schema

MySQL : Schema \-\-&gt; 库; 下面就是表;

PostgreSQL : 库 \-\-&gt; Schema \-\-&gt; 表 ; 支持多个用户使用同一个库;

使用模式\(Scheme\)好处 : 命名空间 , 对象转化为逻辑组方便容易管理 , 第三方的应用对象可以独立模式,不会发生冲突;

就只是一个多层区分管理的作用 :

```text
# 创建模式
CREATE SCHEMA schema_name ; 
# 创建库.表 --> 创建命名空间 ;
CREATE TABLE schema_name.table_name(
      column_name data_type
); 
# 切换模式
SET search_path TO schema_name ; 
# 查看模式列表
\dn ; 
# 删除模式
DROP SCHEMA schema_name CASCADE(内部数据也需要删除的时候需要带上,否则会报error) ; 
```

## 备份数据库

```text
# 导出数据
pq_dump -U 17hwliao db_name > xxx.sql
# 恢复数据 需要先创建数据库
psql -f xxx.sql -U 17hwliao db 
```

## 用户操作

```text
#创建用户并设置密码
create user u1 password 'pwd' ; 

#创建一个超级用户
create user u2 superuser password 'pwd' ; 

#创建一个可以建库的用户
create user u3 createdb password 'pwd'  ; 

#查看用户列表
\du

#赋予权限 赋予 用户对xx数据库中 public 模式的所有权限:
grant all privileges on database db_name to username ; 

#取消权限
revoke all privileges on database db_name from username ; 

#删除用户
drop user username ; 
```
