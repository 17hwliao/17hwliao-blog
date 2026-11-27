## 简介

使用Linux内核的两大原生功能 :

Cgroups : 实现限制和隔离进程的资源使用 , 为容器设置CPU , 内存,

网络等资源的使用上限 , 确保不相互影响 ;

Namespaces : 容器只能查看到内部进程ID , 网络相关资源而看不到宿主机 , 容器本身算一种特殊的进程 ,

但内部像独立的系统 \.

使用dockers exec 容器ID Linux命令 可以直接在容器内部使用Linux 命令 ;

使用 : sudo docker exec ID号 Linux命令

常见用法 :

ps \-ef Linux命令实现查看容器进程

sudo docker exec \-it 容器名 /bin/sh 从运行的docker 容器内部获取到一个交互式的命令行环境 ;

cd 目录 ;

ls 查看文件, vi 文件名 \.\( 内部可能为节俭删除 \)

容器内部安装操作系统工具　:

cat /etc/os\-release 先判断自己的Linux的发行版本

针对 Debian : apt install vim 实现安装工具 ;

vi 目标文件 ;

## 构建操作

### Pull命令

docker pull docker\.io\( 官方仓库可省 \)/library \( 命名空间 \=\= 作者名,官方可不写 \)/nginx:lastest\( 版本或最新 , 不写也是最新 \) ;

docker\.io\( 官方仓库可省 \)/library \( 命名空间 \=\= 作者名,官方可不写 \)/nginx 储存的是镜像库 : 存放一个镜像的不同版本 ;

docker\.io : 仓库地址 ,注册表 ;

### 修改配置文件

修改配置文件解决网速 : sudo vi /etc/docker/daemon\.json ;

I \-&gt; insert , O \-&gt; 换行, \( 填写内容 \)ESC \+ : \+ wq\! \+ 回车;

填写内容 : registy\-mirror : 输入镜像站 ;

### 重启命令

重启一下 : sudo service docker restrart ;

### 列举和删除全部镜像

sudo docker images ; 列举全部的镜像;

sudo docker rmi \+ 镜像名 / ID ; 删除镜像;

### 运行和投射镜像 \(可以直接使用run , 目标镜像不存在可以自动拉取\)

sudo docker run \-d nginx; 实现镜像运行 \( 注意加\-d 后台输出日志防止占用窗口 \);

sudo docker ps\( process status 进程状态\) // 查看进程状态;

端口映射 \( run \):   
docker run \-p 宿主机端口 : 容器端口 容器名字 ;

\-p 实现端口映射; 实现宿主机和容器交互 , 打破隔离 ;

\-p 宿主机端口 : 容器内部端口; 先外后内 ;

localhost:宿主机端口号 ;

## 挂载卷 \(\-v \( volume \)\)

### 实现临时的宿主机 和 容器直接直接实现文件 传输 :

临时复制（docker cp）

docker cp 本地文件 容器名:/容器路径

docker cp 容器名:/容器路径/文件 本地路径

### 使用的宿主机的文件目录

docker cp D:\\test\.txt linux\-lab:/root/ 直接使用cp 命令实现复制文件 , 也可以实现向容器放文件的效果 ;

sudo docker run \-d \-p 80 : 80 \-v /相对路径 : 相对路径 容器名 ;

实现将宿主机的文件目录和容器内部的目录进行绑定;

实现的作用 : 防止删除容器后容器的目录\+数据全部丢失 , 使用绑定后可以永久保留数据 ;

docker run \-v 宿主机目录 : 容器内目录 ;

cd 宿主机目录下 \( 通过修改宿主机直接可以实现修改容器文件的效果 \) ; 创建文件 sudo vi xxxx \. html 文件 ; 直接编辑即可 ; 删除挂载卷 : sudo docker rm \-f\( 正在运行中的容器删除需要force \) ID / name ; \( 镜像 : rmi \)

### 直接创建挂载卷 : 十分方便 ;

创建一个挂载卷 : sudo docker volume create 挂载卷的名字;

之后再创建 \-v 连接操作 : 宿主机的文件目录 \=\= 创建好的挂载卷的名字;

查找挂载卷在宿主机上的目标地址 :

sudo docker volume inspect 新建的挂载卷的名字 ;

需要将显示出的配置文件 中的Mountpoint 后的路径复制

先使用 sudo \-i 切换为 root 用户 ;

cd 复制出的路径

路径\# vi 新创建文件\.文件格式 ;

之后再访问就可以实现映射容器端口;

### 查询挂载卷

sudo docker volume list 查询全部的挂载卷 ;

sudo docker volume rm 挂载卷的名字 ;

sudo docker volume prune \-a \+ y \+ 回车 删除所有没有任何容器在使用的卷 ;

### 预设账号和密码 :

sudo docker run \-d \\ \-p \.\.\.\.

\( 一般的合适的配置信息格式在下面都有 \)

\\ \-e 容器名\_INITDB\_ROOT\_USERNAME \= 17hwliao

\\ \-e 容器名\_INITDB\_ROOT\_PASSWORD \= ok

\\ 容器名;

实现访问 : 容器名 "容器名 : // 用户名 : 密码 @ 公网IP : 映射端口号"

### 设置别名

sudo docket run \-d \-\-name 别名 容器名 ;

sudo docket ps ; 查看是否修改成功 ;

删除同样可以采用 rm \-f 别名 删除对应的容器 ;

### 临时调试容器

sudo docket run \-\-it\( 控制台直接进入容器 \) \-\-rm \( 容器停止时会删除容器 \) 容器名 ; \( apline 轻量级的Linux 系统 \) ;

### 重启策略

sudo docket run \-d \-\-restart xxx nginx ;

填写内容　：　

always\( 停止后立即重启 \) : 防止断电等场景;

unless\-stopped : 除手动外其他都会重连接

## 调试容器

```text
# 后台运行容器
docker run -d --name mycontainer nginx

# 进入正在运行的容器
docker exec -it mycontainer /bin/bash
```

每次的docker run 都会自动启动一个容器

针对一个容器的启动和停止 :

sudo docker stop 容器名; 实现停止当前容器 ;

sudo docker ps \-a \(all\) 全部包含停止的容器 ;

sudo docker start 容器名 : 实现启动停止的容器 ;

忘记了容器的相关配置 :

sudo docker inspect 容器ID ;

单纯创建容器 : sudo docker create \-p 端口号 容器名 ;

查看容器日志 : sudo docker logs 容器名 \-f\( follow 实现追踪日志自动更新\) ;

## Dockerflie

不想学 , 制作想学自己后面去学;

## Docker 网络

## 直接映射到宿主机的全部端口 , 直接通过宿主机访问不同端口 , 可以直接实现 将不同实现的容器 连接到一块 实现项目

SHOW VARIABLES LIKE 'port'; 在mysql 容器中查看连接到的宿主机的端口号

### bridge 模式

默认是bridge ,桥接模式, 每个都是不同的ip地址, 互相隔离 ;

sudo docker network create network1 创建子网 ;

```text
sudo docker run -d --name container1 --network network1 nginx
sudo docker run -d --name container2 --network network1 redis
```

同一个子网内部的容器可以相互访问 , 而且可以直接用名字相互访问 ,其他需要使用ip ; \( 内部的DNS机制, 名字 \=\= IP \)

跨子网不可以访问 ;

sudo docker run \-d \\ \.\.\.\.\. \\ \-\-network network1 \\ 需要同一子网的一个容器 ;

### Host 模式 :

容器直接共享宿主网络, 共享ip ;

sudo docker run \-d \-\-network host nginx ;

sudo docker exec \-it 容器名 /bin/sh 查看容器内部配置 ;

提前需要安装工具 :

apt update ;

apt install iproute2

之后直接使用 ip addr show ; 查看ip即可;

### None 模式

sudo docker network list 展示所有的网络设置 ;

sudo docker network rm 删除不需要的子网;

## Docker Compose

实现多个容器管理 , 将不同的模块都打包成不同的容器实现的管理系统 ;

通过yml文件实现管理多个容器 ; \( 多个docker run 命令 \)

添加同一个子网实现管理 :

![](<https://cdn.nlark.com/yuque/0/2026/png/63728767/1773927331346-6420337f-d52d-4139-91b4-20bec9add3d0.png>)

区别只有左边设计的子网设置 ; //严格识别配置文件, 不可修改文件名;

非要改 : sudo docker compose \-f 文件路径 up \-d

vi docker\-compose\.yaml 创建一个配置文件 ,

sudo docker compose up \-d ; 后台直接运行文件 ;

sudo docker compose down \-d ; 后台直接运行文件 ; 只停止不删除 ;

sudo docker compose start 启动停下的容器 ;

## 使用Docker容器 :

开启容器 :

PS C:\\Users\\17hwliao&gt; docker start mysql

进入容器 :

PS C:\\Users\\17hwliao&gt; docker exec \-it mysql bash  
bash\-5\.1\# mysql \-uroot \-p \-\-进入root用户 ;

当前测试的密码 : zjq17hwliao

```text
# 启动容器（如果未运行）
docker start linux-lab

# 进入容器交互式 shell
docker exec -it linux-lab /bin/bash
```

使用命令即可 :

企业级需要Kubernetes想学自己去学 ;

## 使用Docker ;

1 \. docker ps \-a ;

2. docker exec \-it 容器名 &lt;shell类型&gt;

调用 docker : docker exec \-it mysql bash 即可;

3\.创建一个容器直接生成一份之前写好的配置文件进行配置 就好 ;

内部的配置文件内部包含有 : 挂载卷 , 相关的用户配置 , 宿主机端口连接 ;
