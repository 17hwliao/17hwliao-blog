### 一\.先更新本地安装的环境 ;

apt\-get update

apt\-get install \-y curl wget vim net\-tools software\-properties\-common gnupg

### 二\.安装 MySql

\# 安装 MySQL

apt\-get install \-y mysql\-server

\# 启动 MySQL

service mysql start

\# 检查状态

service mysql status

## 二、安装 MySQL（Ubuntu 24\.04 默认 MySQL 8\.0）

bash

```text
# 安装 MySQL
apt-get install -y mysql-server

# 启动 MySQL
service mysql start

# 检查状态
service mysql status
```

### 设置 root 密码

bash

```text
# Ubuntu 24.04 默认使用 auth_socket 插件，需要修改
mysql

# 在 MySQL 命令行中执行：
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';
FLUSH PRIVILEGES;
EXIT;
```

### 测试登录

bash

mysql \-u root \-p123456 \-e "SELECT VERSION\(\);"

### 允许远程访问（可选）

bash

```text
# 修改配置文件
sed -i 's/bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf

# 创建远程用户（可选）
mysql -u root -p123456 -e "CREATE USER 'remote'@'%' IDENTIFIED BY 'remote123';"
mysql -u root -p123456 -e "GRANT ALL PRIVILEGES ON *.* TO 'remote'@'%';"
mysql -u root -p123456 -e "FLUSH PRIVILEGES;"

# 重启服务
service mysql restart
```

---

## 三、安装 Redis

bash

```text
# Ubuntu 24.04 源有 Redis 7.2
apt-get install -y redis-server

# 启动 Redis
service redis-server start

# 测试
redis-cli ping
```

### 允许远程访问（可选）

bash

```text
# 修改配置
sed -i 's/bind 127.0.0.1 -::1/bind 0.0.0.0/' /etc/redis/redis.conf
sed -i 's/protected-mode yes/protected-mode no/' /etc/redis/redis.conf

# 重启
service redis-server restart

# 测试远程连接（在容器内测试本机）
redis-cli -h 127.0.0.1 ping
```

---

## 四、安装 Docker

**重要提示**：Ubuntu 24\.04 的 Docker 安装略有不同。

### 4\.1 检查容器权限

bash

```text
# 检查是否有特权
cat /proc/self/status | grep CapEff
```

如果输出类似 `0000000000000000` 或较小的值，说明没有特权，需要使用方案二。

### 4\.2 方案一：安装完整 Docker（需要特权容器）

bash

```text
# 添加 Docker 官方 GPG 密钥（Ubuntu 24.04 方式）
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu noble stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker（注意：容器内可能没有 systemd）
dockerd &
# 或者
service docker start
```

### 4\.3 方案二：仅安装 Docker CLI（推荐，无需特权）

如果你的宿主机已安装 Docker，可以挂载 socket：

**先退出容器，在宿主机执行：**

bash

```text
# 停止当前容器
docker stop linux-lab

# 重新启动并挂载 Docker socket
docker run -d \
  --name linux-lab \
  -p 2222:22 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ubuntu sleep infinity
```

**然后重新 SSH 连接，在容器内安装 Docker CLI：**

bash

```text
# 安装 Docker CLI
apt-get update
apt-get install -y docker.io

# 测试（会使用宿主机的 Docker）
docker ps
```

---

## 五、创建服务启动脚本

由于容器用 `sleep infinity` 运行，重启容器后服务不会自动启动。创建一个便捷脚本：

bash

```text
cat > /start_all_services.sh << 'EOF'
#!/bin/bash
echo "Starting MySQL..."
service mysql start 2>/dev/null || mysqld --user=mysql &

echo "Starting Redis..."
service redis-server start 2>/dev/null || redis-server --daemonize yes

if command -v docker &> /dev/null; then
    if pgrep dockerd > /dev/null; then
        echo "Docker already running"
    else
        echo "Starting Docker..."
        dockerd > /var/log/docker.log 2>&1 &
    fi
fi

echo "All services started."
echo "MySQL: port 3306 (pass: 123456)"
echo "Redis: port 6379"
echo "Docker: " $(docker ps >/dev/null 2>&1 && echo "OK" || echo "Check permissions")
EOF

chmod +x /start_all_services.sh

# 执行一次
./start_all_services.sh
```

---

## 六、验证安装

bash

```text
# MySQL 验证
mysql -u root -p123456 -e "SHOW DATABASES;"

# Redis 验证
redis-cli SET test "Hello" && redis-cli GET test

# Docker 验证
docker --version

# 查看运行中的服务
ps aux | grep -E "mysql|redis|docker"
```

---

## 七、端口映射说明

你的容器已经映射了端口：`0.0.0.0:2222->22/tcp`

要访问 MySQL \(3306\) 和 Redis \(6379\)，需要额外映射端口。如果想从宿主机访问，需要重新创建容器：

bash

```text
docker stop linux-lab
docker rm linux-lab

docker run -d \
  --name linux-lab \
  -p 2222:22 \
  -p 3306:3306 \
  -p 6379:6379 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ubuntu sleep infinity
```

---

## 遇到问题时的检查清单

<table class="ne-table" id="ClTP2"><tbody><tr><td width="375"><p class="ne-p" id="u0aa0b656"><span class="ne-text">问题</span></p></td><td width="375"><p class="ne-p" id="u701390c8"><span class="ne-text">检查命令</span></p></td></tr><tr><td width="375"><p class="ne-p" id="u27afc13e"><span class="ne-text">MySQL 无法启动</span></p></td><td width="375"><p class="ne-p" id="u83f2fa56"><code class="ne-code"><span class="ne-text">tail -f /var/log/mysql/error.log</span></code></p></td></tr><tr><td width="375"><p class="ne-p" id="u891ea132"><span class="ne-text">Redis 无法启动</span></p></td><td width="375"><p class="ne-p" id="uf8e4f8ce"><code class="ne-code"><span class="ne-text">redis-server --daemonize yes</span></code></p><p class="ne-p" id="u5fa0be43"><span class="ne-text"> </span><span class="ne-text">看错误信息</span></p></td></tr><tr><td width="375"><p class="ne-p" id="ue7218a36"><span class="ne-text">Docker 权限不足</span></p></td><td width="375"><p class="ne-p" id="uca1364da"><code class="ne-code"><span class="ne-text">cat /proc/self/status | grep CapEff</span></code></p></td></tr><tr><td width="375"><p class="ne-p" id="u2f707e65"><span class="ne-text">端口被占用</span></p></td><td width="375"><p class="ne-p" id="u5f273522"><code class="ne-code"><span class="ne-text">netstat -tlnp</span></code></p></td></tr></tbody></table>
