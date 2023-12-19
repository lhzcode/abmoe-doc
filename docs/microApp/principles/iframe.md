# iframe

## 方案简述

如果不考虑UI交互、页面跳转和数据通信，iframe方案是一种接入简单，隔离非常完美的方案。这一套方案涉及浏览器相关的知识

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/iframes-solution.png)

## 浏览器多进程

浏览器是一个多进程（Multi Process）的设计架构，通常在打开浏览器标签页访问 Web 应用时，多个浏览器标签页之间互相不会受到彼此的影响，例如某个标签页所在的应用崩溃，其他的标签页应用仍然可以正常运行，这和浏览器的多进程架构息息有关。

以 Chrome 浏览器为例，在运行时会常驻 Browser 主进程，而打开新标签页时会动态创建对应的 Renderer 进程。

- Browser 主进程：主要负责处理网络资源请求、用户的输入输出 UI 事件、地址栏 URL 管理、书签管理、回退与前进按钮、文件访问、Cookie 数据存储等。Browser 进程是一个常驻的主进程，它也被称为代理进程，会派生进程并监督它们的活动情况。除此之外，Browser 进程会对派生的进程进行沙箱隔离，具备沙箱策略引擎服务。Browser 进程通过内部的 I/O 线程与其他进程通信，通信的方式是 IPC & Mojo。

- Renderer 进程：主要负责标签页和 iframe 所在 Web 应用的 UI 渲染和 JavaScript 执行。Renderer 进程由 Browser 主进程派生，每次手动新开标签页时，Browser 进程会创建一个新的 Renderer 进程。

以上只是一个简单的多进程架构示意，事实上 Chrome 浏览器包括 Browser 进程、网络进程、数据存储进程、插件进程、Renderer 进程和 GPU 进程等。除此之外，Chrome 浏览器会根据当前设备的性能和存储空间来动态设置部分进程是否启用，例如低配 Andriod 手机的设备资源相对紧张时，部分进程（存储进程、网络进程、设备进程等）会被合并到 Browser 主进程

## 浏览器沙箱隔离

由于 Web 应用运行在 Renderer 进程中，浏览器为了提升安全性，需要通过常驻的 Browser 主进程对 Renderer 进程进行沙箱隔离设计，从而实现 Web 应用进行隔离和管控

::: tip
从 Chrome 浏览器开发商的角度出发，需要将非浏览器自身开发的 Web 应用设定为三方不可信应用，防止 Web 页面可以通过 Chrome 浏览器进入用户的操作系统执行危险操作。
:::

Chrome 浏览器在进行沙箱设计时，会尽可能的复用现有操作系统的沙箱技术，例如以 Windows 操作系统的沙箱架构为例，所有的沙箱都会在进程粒度进行控制，所有的进程都通过 IPC 进行通信。在 Windows 沙箱的架构中，存在一个 Broker 进程和多个 Target 进程， Broker 进程主要用于派生 Target 进程、管理 Target 进程的沙箱策略、代理 Target 进程执行策略允许的操作，而所有的 Target 进程会在运行时受到沙箱策略的管控

在 Chrome 浏览器的多进程架构中，Browser 进程对应 Broker 进程，可以理解为浏览器沙箱策略的总控制器， Renderer 进程对应沙箱化的 Target 进程，它主要运行不受信任的三方 Web 应用，因此，在 Renderer 进程中的一些系统操作需要经过 IPC 通知 Browser 进程进行代理操作，例如网络访问、文件访问（磁盘）、用户输入输出的访问（设备）等。

## 浏览器站点隔离

在 Chrome 浏览器中沙箱隔离以 Renderer 进程为单位，而在旧版的浏览器中会存在多个 Web 应用共享同一个 Renderer 进程的情况，此时浏览器会依靠同源策略来限制两个不同源的文档进行交互，帮助隔离恶意文档来减少安全风险。

Chrome 浏览器未启动站点隔离之前，标签页应用和内部的 iframe 应用会处于同一个 Renderer 进程，Web 应用有可能发现安全漏洞并绕过同源策略的限制，访问同一个进程中的其他 Web 应用，因此可能产生如下安全风险：

- 获取跨站点 Web 应用的 Cookie 和 HTML 5 存储数据；
- 获取跨站点 Web 应用的 HTML、XML 和 JSON 数据；
- 获取浏览器保存的密码数据；
- 共享跨站点 Web 应用的授权权限，例如地理位置；
- 绕过 X-Frame-Options 加载 iframe 应用（例如百度的页面被 iframe 嵌套）；
- 获取跨站点 Web 应用的 DOM 元素。

在 Chrome 67 版本之后，为了防御多个跨站的 Web 应用处于同一个 Renderer 进程而可能产生的安全风险，浏览器会给来自不同站点的 Web 应用分配不同的 Renderer 进程。例如当前标签页应用中包含了多个不同站点的 iframe 应用，那么浏览器会为各自分配不同的 Renderer 进程，从而可以基于沙箱策略进行应用的进程隔离，确保攻击者难以绕过安全漏洞直接访问跨站 Web 应用

::: tip
 Chrome 为标签页分配 Renderer 进程的策略和 iframe 中的站点隔离策略是有差异的，例如用户自己新开标签页时，不管是否已经存在同站的应用都会创建新的 Renderer 进程。用户通过window.open 跳转新标签页时，浏览器会判断当前应用和跳转后的应用是否属于同一个站点，如果属于同一个站点则会复用当前应用所在的 Renderer 进程。
:::

需要注意跨站和跨域是有区别的，使用跨站而不是跨域来独立 Renderer 进程是为了兼容现有浏览器的能力，例如同站应用通过修改 document.domain 进行通信，如果采用域名隔离，那么会导致处于不同 Renderer 进程的应用无法实现上述能力。这里额外了解一下同源和同站的区别，如下所示：

- 同源：协议（protocol）、主机名（host）和端口（port）相同，则为同源；
  
- 同站：有效顶级域名（Effective Top-Level-Domain，eTLD）和二级域名相同，则为同站。

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/origins-solution.png)

从上图可以看出，eTLD + 1 代表有效顶级域名 + 二级域名。

需要注意，有效顶级域名和顶级域名是不一样的概念，举个简单的例子，有用户a和b，他们的地址分别是：

> a.github.io
> 
> b.github.io

但这两个其实并不是一个用户的站点，如果将 .io 视为eTLD，那么 eTLD + 1 就是 github.io，用户a和用户b同站了。实际上a用户的cookie不能发给b用户，不然就有安全问题。github.io 是一个 eTLD。

有效顶级域名有一个维护列表，具体可以查看 [publicsuffix/list](https://publicsuffix.org/list/public_suffix_list.dat)

## 浏览器上下文

每一个 iframe 都有自己的浏览上下文，不同的浏览上下文包含了各自的 Document 对象以及 History 对象，通常情况下 Document 对象和 Window 对象存在 1:1 的映射关系。

如果主应用是在空白的标签页打开，那么主应用是一个顶级浏览上下文，顶级浏览器上下文既不是嵌套的浏览上下文，自身也没有父浏览上下文，通过访问 window.top 可以获取当前浏览上下文的顶级浏览上下文 window 对象，通过访问 window.parent 可以获取父浏览上下文的 window 对象。

因此，可以通过判断 ``if(window.top !== window) {}`` 来知道当前应用是否在iframe中打开

## 注意事项

### 主子应用同域

可以携带和共享 Cookie，存在同名属性值被微应用覆盖的风险。请求正常

### 主子应用跨域同站

默认主子应用无法共享 Cookie，可以通过设置 Domain 使得主子应用进行 Cookie 共享。请求头要进行跨域配置

``` javascript
import express from "express";
import path from "path";
import config from "./config.js";
const { port, host } = config;
const app = express();

// 设置支持跨域请求头
// 示例设置了所有请求的跨域配置，也可以对单个请求进行跨域设置
app.use((req, res, next) => {
  // 跨域请求中涉及到 Cookie 信息传递时值不能为 *，必须是具体的主应用地址
  res.header("Access-Control-Allow-Origin", `http://a.com:${port.main}`);
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Allow", "GET, POST, OPTIONS");
  // 允许跨域请求时携带 Cookie
  // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.use(
  express.static(path.join("public", "micro"), {
    etag: true,
    lastModified: true,
  })
);

app.get("/", function (req, res) {
  res.cookie("main-app", "true");
  // 为了使同站的微应用可以共享主应用的 Cookie
  // 在设置 Cookie 时，可以使用 Domain 和 Path 来标记作用域
  // 默认不指定的情况下，Domain 属性为当前应用的 host，由于 a.example.com 和 example.com 不同
  // 因此默认情况下两者不能共享 Cookie，可以通过设置 Domain 使其为子域设置 Cookie，例如 Domain=example.com，则 Cookie 也包含在子域 a.example.com 中
  res.cookie("app-share", "true", { domain: "example.com" });
})


```

### 主子应用跨站

子应用默认无法携带 Cookie（防止 CSRF 攻击），需要使用 HTTPS 协议并设置服务端 Cookie 的 SameSite 和 Secure 设置才行，并且子应用无法和主应用形成 Cookie 共享。同时请求也要做相应的配置

``` javascript
import express from "express";
import path from "path";
import config from "./config.js";
const { port, host } = config;
const app = express();

// 设置支持跨域请求头
// 示例设置了所有请求的跨域配置，也可以对单个请求进行跨域设置
app.use((req, res, next) => {
  // 跨域请求中涉及到 Cookie 信息传递时值不能为 *，必须是具体的主应用地址
  res.header("Access-Control-Allow-Origin", `http://a.com:${port.main}`);
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Allow", "GET, POST, OPTIONS");
  // 允许跨域请求时携带 Cookie
  // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.use(
  express.static(path.join("public", "micro"), {
    etag: true,
    lastModified: true,
  })
);


app.get("/", function (req, res) {
  // 增加 SameSite 和 Secure 属性，从而使浏览器支持 iframe 子应用的跨站携带 Cookie
  // 注意 Secure 需要 HTTPS 协议的支持
  res.cookie("main-app", "true", { sameSite: "none", secure: true });
});
```

如果主应用的后端没有做微应用的流量转发，会有Cookie的SameSite和secure警告，比较简便的方法是通过Nginx反向代理
```
server {
 listen       9001;
 server_name  192.168.1.102;

 location ~ /api/v1/ {
  proxy_pass  http://127.0.0.1:8080
 }

 location ~ /api/v2/ {
  proxy_pass  http://127.0.0.1:8081
 }
}
```



## 示例[WIP]
 