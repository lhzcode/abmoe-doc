# single-spa

single-spa是一个应用调度框架，主要做的事情就是维护子应用状态和路由调度

## 子应用状态调度

### 生命周期

single-spa 为应用定义了 boostrap, load, mount, unmount 四个生命周期回调。Register 不是生命周期，指的是调用 registerApplication 函数这一步。Load 是开始加载子应用，怎么加载由开发者自己实现。Unload 钩子只能通过调用 unloadApplication 函数才会被调用

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/singlespa-lifecycel.png)

### 状态机

可以概括为4个大的状态：加载、启动、挂载、卸载。在注册微应用的时候有个加载微应用的函数作为注册函数```registerApplication```的参数```applicationOrLoadingFn: () => <Function | Promise>```传入。而执行完这个加载函数会返回一个对象，该对象上有三个函数：bootstrap、mount、unmount。流程图中对应的四个大的状态就对应着上面四个函数。

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/single-spa-status.png)

## 路由调度

主要逻辑是：
- 监听hashchange、popstate -> 
- 拦截 window.addEventListener、window.removeEventListener -> 
- 拦截 window.history.pushState、window.history.replaceState -> 
- 暴露全局方法 window.singleSpaNavigage