# JS隔离

## 全局变量冲突

不同于MPA模式，JS可以做到天然隔离。在SPA模式下，由于JS处于同一个浏览器Renderer进程下，JS执行上下文没有做隔离，很容易产生全局变量的命名冲突。为了解决这个问题，我们需要做JS隔离

## V8的隔离

在 Chrome 的 Blink 渲染引擎中可以通过嵌入 V8 来实现 JS 代码的解释和执行。Blink引擎对JS的执行上下文做了隔离处理。这一部分的实现原理可以参考[V8/Context](https://v8.dev/docs/embed#contexts)。涉及这些基础概念：

### Isolate

isolate 是 V8 运行时的独立副本，包括堆管理器、垃圾收集器等。一次只有一个线程可以访问给定的isolate，但不同的线程可以同时访问不同的isolate。

### Context

Context顾名思义，是一个上下文。所有的JS代码都是在某个V8 Context中运行的。

然而，isolate不足以运行脚本。还需要一个全局（根）对象。上下文通过将隔离堆中的对象指定为全局对象来定义完整的脚本执行环境。

因此，对于一个给定的Isolate, 不仅其可以有多个Context，并且这些Context之间可以共享某些对象。那是因为它们的对象实际上属于isolate，并受到isolate 的独占锁的保护。

## 微应用的方案的隔离

iframe方案中，由于 V8 Context 的不同，可以做到标签页应用和 iframe 应用之间的全局执行上下文隔离

NPM 方案、动态 Script 方案以及 Web Components 方案，由于各个聚合的微应用处于同一个 Renderer 进程的主渲染线程，并且处于同一个 V8 Isolate 实例下的同一个 Context 中，因此无法通过浏览器的默认能力实现全局执行上下文的隔离。

使用 WebAssembly 进行隔离，WebAssembly 会被限制运行在一个安全的沙箱执行环境中。但是，运行时不能直接调用 Web API。因此需要进行 Web API 的桥接和隔离工作，并且为了可以将三方的 JS 运行在 WebAssembly 的隔离环境中，需要在该环境中提供解释执行 JS 的引擎，例如 QuickJS、Duktape

使用 Web Worker 进行隔离，每个 Worker 有自己独立的 Isolate 实例。但是，Web Worker 运行时只能使用部分 Web API（XMLHttpRequest 和 Web Workers API）。需要实现 Web 应用所在的 Renderer 执行环境和 Web Worker 环境的异步通信能力，从而解决无法在 Web Worker 环境中调用完整的 Web API 短板，例如 [react-worker-dom](https://github.com/web-perf/react-worker-dom)

## iframe隔离

// TODO 流程图

### 实现思路

- 通过请求获取后端的微应用列表数据，动态创建主导航
- 根据导航切换微应用，切换时会跨域请求微应用 JS 的文本内容并进行缓存处理
- 切换微应用的同时创建一个同域的 iframe 应用，请求主应用下空白的 HTML 进行渲染
- DOM 渲染完成后，微应用的 JS 会在 iframe 环境中通过 Script 标签进行隔离执行

### 注意事项

- 主应用刷新时，iframe 微应用无法保持自身 URL 的状态
- 主应用和 iframe 微应用处于不同的浏览上下文，无法使 iframe 中的模态框 Modal 相对于主应用居中
- 主子应用的通信处理以及持久化数据的隔离处理
- 解决主应用空白 HTML 请求的性能优化处理（例如 GET 请求空内容、请求渲染时中断请求等）

### 示例

主要设计了几个类，具体的功能如下所示：

- MainApp：负责管理主应用，包括获取微应用列表、创建微应用的导航、切换微应用
- MicroApps：负责维护微应用列表，包括预加载、添加和删除微应用等
- MicroApp：负责维护微应用，包括请求和缓存静态资源、激活微应用、状态管理等
- MicroAppSandbox：负责维护微应用隔离，包括创建、激活和销毁隔离实例等

``` javascript

// 隔离类
class MicroAppSandbox {
  // 配置信息
  options = null;
  // iframe 实例
  iframe = null;
  // iframe 的 Window 实例
  iframeWindow = null;
  // 是否执行过 JS
  exec = false;
  // iframe 加载延迟执行标识
  iframeLoadDeferred = null;

  constructor(options) {
    this.options = options;
    // 创建 iframe 时浏览器会创建新的全局执行上下文，用于隔离主应用的全局执行上下文
    this.iframe = this.createIframe();
    this.iframeWindow = this.iframe.contentWindow;
    this.iframeLoadDeferred = this.deferred();
    this.iframeWindow.onload = () => {
      // 用于等待 iframe 加载完成
      this.iframeLoadDeferred.resolve();
    };
  }

  deferred() {
    const deferred = Object.create({});
    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred;
  }

  createIframe() {
    const { rootElm, id, url } = this.options;
    const iframe = window.document.createElement("iframe");
    const attrs = {
      // 请求主应用服务下的 blank.html（保持和主应用同源）
      src: "blank.html",
      "app-id": id,
      "app-src": url,
      style: "border:none;width:100%;height:100%;",
    };
    Object.keys(attrs).forEach((name) => {
      iframe.setAttribute(name, attrs[name]);
    });
    rootElm?.appendChild(iframe);
    return iframe;
  }

  // 激活
  async active() {
    this.iframe.style.display = "block";
    // 如果已经通过 Script 加载并执行过 JS，则无需重新加载处理
    if (this.exec) return;
    // 延迟等待 iframe 加载完成（这里会有 HTML 请求的性能损耗，可以进行优化处理）
    await this.iframeLoadDeferred.promise;
    this.exec = true;
    const scriptElement =
      this.iframeWindow.document.createElement("script");
    scriptElement.textContent = this.options.scriptText;
    this.iframeWindow.document.head.appendChild(scriptElement);
  }

  // 失活
  // INFO: JS 加载以后无法通过移除 Script 标签去除执行状态
  // INFO: 因此这里不是指代失活 JS，如果是真正想要失活 JS，需要销毁 iframe 后重新加载 Script
  inactive() {
    this.iframe.style.display = "none";
  }

  // 销毁
  destroy() {
    this.options = null;
    this.exec = false;
    if (this.iframe) {
      this.iframe.parentNode?.removeChild(this.iframe);
    }
    this.iframe = null;
    this.iframeWindow = null;
  }
}

// 微应用管理
class MicroApp {
  // 缓存微应用的脚本文本（这里假设只有一个执行脚本）
  scriptText = "";
  // 隔离实例
  sandbox = null;
  // 微应用挂载的根节点
  rootElm = null;

  constructor(rootElm, app) {
    this.rootElm = rootElm;
    this.app = app;
  }

  // 获取 JS 文本（微应用服务需要支持跨域请求获取 JS 文件）
  async fetchScript(src) {
    try {
      const res = await window.fetch(src);
      return await res.text();
    } catch (err) {
      console.error(err);
    }
  }

  // 激活
  async active() {
    // 缓存资源处理
    if (!this.scriptText) {
      this.scriptText = await this.fetchScript(this.app.script);
    }

    // 如果没有创建隔离实例，则实时创建
    // 需要注意只给激活的微应用创建 iframe 隔离，因为创建 iframe 会产生内存损耗
    if (!this.sandbox) {
      this.sandbox = new MicroAppSandbox({
        rootElm: this.rootElm,
        scriptText: this.scriptText,
        url: this.app.script,
        id: this.app.id,
      });
    }

    this.sandbox.active();
  }

  // 失活
  inactive() {
    this.sandbox?.inactive();
  }
}

// 微前端管理
class MicroApps {
  // 微应用实例映射表
  appsMap = new Map();
  // 微应用挂载的根节点信息
  rootElm = null;

  constructor(rootElm, apps) {
    this.rootElm = rootElm;
    this.setAppMaps(apps);
  }

  setAppMaps(apps) {
    apps.forEach((app) => {
      this.appsMap.set(app.id, new MicroApp(this.rootElm, app));
    });
  }

  // TODO: prefetch 微应用
  prefetchApps() {}

  // 激活微应用
  activeApp(id) {
    const app = this.appsMap.get(id);
    app?.active();
  }

  // 失活微应用
  inactiveApp(id) {
    const app = this.appsMap.get(id);
    app?.inactive();
  }
}

// 主应用管理
class MainApp {
  microApps = [];
  microAppsManager = null;

  constructor() {
    this.init();
  }

  async init() {
    this.microApps = await this.fetchMicroApps();
    this.createNav();
    this.navClickListener();
    this.hashChangeListener();
    // 创建微前端管理实例
    this.microAppsManager = new MicroApps(
      document.getElementById("container"),
      this.microApps
    );
  }

  // 从主应用服务器获请求微应用列表信息
  async fetchMicroApps() {
    try {
      const res = await window.fetch("/microapps", {
        method: "post",
      });
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  }

  // 根据微应用列表创建主导航
  createNav(microApps) {
    const fragment = new DocumentFragment();
    this.microApps?.forEach((microApp) => {
      // TODO: APP 数据规范检测 (例如是否有 script）
      const button = document.createElement("button");
      button.textContent = microApp.name;
      button.id = microApp.id;
      fragment.appendChild(button);
    });
    nav.appendChild(fragment);
  }

  // 导航点击的监听事件
  navClickListener() {
    const nav = document.getElementById("nav");
    nav.addEventListener("click", (e) => {
      // 并不是只有 button 可以触发导航变更，例如 a 标签也可以，因此这里不直接处理微应用切换，只是改变 Hash 地址
      // 不会触发刷新，类似于框架的 Hash 路由
      window.location.hash = event?.target?.id;
    });
  }

  // hash 路由变化的监听事件
  hashChangeListener() {
    // 监听 Hash 路由的变化，切换微应用（这里设定一个时刻只能切换一个微应用）
    window.addEventListener("hashchange", () => {
      this.microApps?.forEach(async ({ id }) => {
        id === window.location.hash.replace("#", "")
          ? this.microAppsManager.activeApp(id)
          : this.microAppsManager.inactiveApp(id);
      });
    });
  }
}

new MainApp();
```

## Proxy代理

// TODO 参考现有方案

## 快照隔离

