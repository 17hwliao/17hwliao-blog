const contexts=[
 [/^\/$/,'home','欢迎来到小站。这里记着博主做过的项目和一路上的学习笔记。','m-1'],
 [/^\/blog\/[^/]+/,'article','慢慢读呀，阅读工具可以帮你找章节和调整字号。','m-1'],
 [/^\/blog\/?$/,'blog','这里按时间整理了文章，挑一篇感兴趣的看看吧。','m-3'],
 [/^\/projects\/[^/]+/,'project','这里是项目详情，可以看看介绍和来源链接。','m-1'],
 [/^\/projects\/?$/,'projects','来看看项目吧，卡片可以打开详情或仓库。','m-3'],
 [/^\/knowledge(?:\/|$)/,'knowledge','这里按主题和阅读路线收着博主的学习笔记。','m-2'],
 [/^\/reading(?:\/|$)/,'reading','这里是阅读工作台，阅读记录保存在当前浏览器。','m-1'],
 [/^\/pictures(?:\/|$)/,'pictures','换个心情，看看小站里的照片吧。','m-3'],
 [/^\/share(?:\/|$)/,'share','这里收着一些值得分享的链接和资源。','m-3'],
 [/^\/bloggers(?:\/|$)/,'bloggers','这些是博主收藏的站点，可以顺着链接去逛逛。','m-1'],
 [/^\/about(?:\/|$)/,'about','这里记着博主学过什么、在做什么，也有联系方式。','m-1'],
];
export function pageContext(path){
 if(typeof path!=='string'||path.length>512||!/^\/(?!\/)/.test(path)||/[\\?#\x00-\x20]/.test(path))return null;
 const found=contexts.find(([pattern])=>pattern.test(path));if(!found)return{path,key:'other',text:'又发现一个小站的角落，有问题随时叫我。',action:'m-1'};
 return{path,key:found[1],text:found[2],action:found[3]};
}
export const welcomeText='你好呀，欢迎来逛逛～有问题随时找我。';
