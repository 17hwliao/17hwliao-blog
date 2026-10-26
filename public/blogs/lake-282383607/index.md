### 准备

```text
MAD(Median Absolute Deviation):中位数绝对偏差:一堆数据的median,每个数据和median取绝对值差的队列的median ;
噪声基线:CPU调度,IO波动,内存与缓存干扰
BufferPool 缓存冷热:在启动 Mysql后,数据不在内存的BufferPool,全部都会读磁盘,sql慢.数据加载到了BufferPool,直接读内存,sql速度明显增强化; 
```
