# Web API 系列 - Service Workers

## 背景和适用范围

一种统筹机制对资源进行缓存和自定义的网络请求进行控制。基于Web Worker，是独立于JavaScript主线程的独立线程，不会堵塞主线程。

即使在离线状态，也可以提供默认的体验，然后从网络获取更多数据（通常称为“离线优先”）。

service worker 的功能类似于代理服务器，允许你去修改请求和响应，将其替换成来自其自身缓存的项目。



## 参考

- [MDN接口文档 - Service Worker](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [网易云课堂 Service Worker 运用与实践](https://mp.weixin.qq.com/s/3Ep5pJULvP7WHJvVJNDV-g)
- [谈谈 Service Worker 与 PWA](https://blog.dteam.top/posts/2021-05/service-worker-and-pwa.html)

