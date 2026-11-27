控制面板删 ;

删 Program Files / x 86 中 Mysql 文件 ;

regedit 登记表中 查看 :

\(1\) HKEY\_LOCAL\_MACHINE\\SYSTEM\\ControlSet001\\Services\\Eventlog\\Application\\MySQL

\(2\) HKEY\_LOCAL\_MACHINE\\SYSTEM\\ControlSet002\\Services\\Eventlog\\Application\\MySQL

\(3\) HKEY\_LOCAL\_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\Eventlog\\Application\\MySQL （如果没有，就不用管）

C:\\ProgramData\\MySQL的所有文件

C:\\Documents and Settings\\All Users\\Application Data\\MySQL 有删无不管;

services\.msc 检查服务中有无Mysql ;

Get\-Service \-Name "\*mysql\*" //获取到当前服务中的mysql程序 ;

C:\\Windows\\System32\\sc\.exe delete 运行中的mysql名称
