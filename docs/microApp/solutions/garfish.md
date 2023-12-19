# garfish[WIP]

## 加载方式

### 接入方式

Garfish bridge 是 garfish 提供的帮助用户降低接入成本的工具函数，它能自动提供 provider 函数所需的应用生命周期函数 render 和 destroy ，并实现框架不同版本的兼容。封装底层实现，降低接入成本和出错概率。

``` js
function reactBridge(userOpts: Options): (
  appInfo: any,
  props: any,
) => Promise<{
  render: (props: any) => any;
  destroy: (props: any) => any;
  update: (props: any) => any;
}>;
```

### 资源加载

使用HTML Entry方式加载，整体设计类似React-loadable。具有以下能力

- 异步加载组件资源
- 可以预加载资源
- 可以缓存组件资源
- 缓存组件实例

## 生命周期

### 三个阶段

Garfish 应用的生命周期可以归结为：加载、渲染、销毁 三个阶段，因此 Garfish 应用的生命周期也是围绕着这三个阶段而展开的。应用的加载主要是通过 Garfish.loadApp，通过 loadApp API 会自动创建应用的实例，可以通过应用实例上的 mount 和 show 方法对应用进行渲染，通过 unmount 和 hide 方法对应用进行销毁，用户在实际使用的过程中通过 Garfish.run会发现当路由发生变化时符合加载条件的应用会自动加载渲染，实际上是 Garfish Router Plugin 通过监听路由变化来触发 loadApp 和 mount 自动完成应用的加载、渲染、销毁。

![](https://user-images.githubusercontent.com/27547179/165056974-f40d790e-3db1-4aea-b2db-5d3618a150d5.png)

### mount

1. 创建 app 容器并添加到文档流上
2. 编译子应用的代码
3. 拿到子应用的 provider
4. 调用 app.options.beforeMount 钩子
5. 调用 provider.render
6. 将 app.display 和 app.mounted 设置为 true
7. 将 app set 到 Garfish.activeApps 中
8. 调用 app.options.afterMount 钩子
9. 如果渲染失败，app.mount 会返回 false，否则渲染成功会返回 true，你可以根据返回值做对应的处理。

### unmount

1. 调用 app.options.beforeUnmount 钩子
2. 调用 provider.destroy
3. 清除编译的副作用
4. 将 app 的容器从文档流上移除
5. 将 app.display 和 app.mounted 设置为 false
6. 在 Garfish.activeApps 中移除当前的 app 实例
7. 调用 app.options.afterUnmount 钩子
8. 同上，可以根据返回值来判断是否卸载成功。

### show

1. 将 app 的容器添加到文档流上
2. 调用 provider.render
3. 将 app.display 设置为 true
4. 同上，可以根据返回值来判断是否渲染成功。

### hide

1. 调用 provider.destroy
2. 将 app 的容器从文档流上移除
3. 将 app.display 设置为 false
4. 同上，可以根据返回值来判断是否隐藏成功。

## 路由机制

- 提供 Router Map，减少典型中台应用下的开发者理解成本
  在典型的中台应用中，通常可以将应用的结构分为两块，一块是菜单另一块则是内容区域，依托于现代前端 Web 应用的设计理念的启发，通过提供路由表来自动化完成子应用的调度，将公共部分作为拆离后的子应用渲染区域。
- 为不同子应用提供不同的 basename 用于隔离应用间的路由抢占问题
  在自动挂载模式下 Garfish 会根据用户提供的 activeWhen 自动计算出子应用的 basename，子应用使用该 basename ，子应用设置 basename 后可以保证应用间的路由互不影响且能达到多个微前端应用组合成单个 SPA 应用的体验，并且这些微前端应用能具备自己的路由。
- 路由发生变化时能准确激活并触发应用视图更新
  - 收集框架监听的 popstate 事件
  - 主动触发 popstate 事件 因为目前支持 SPA 应用的前端框架都会监听浏览器后退事件，在浏览器后退时根据路由状态触发应用视图的更新，那么其实也可以利用这种能力主动触发应用视图的更新，可以通过收集框架的监听事件，也可以触发 popstate 来响应应用的 popstate 事件
## JS沙箱

### 快照沙箱

类似于快照，隔离了DOM节点、代理事件、history的pushState和replaceState、interval计时器、webpackJsonp

- 在 activate 的时候遍历 window 上的变量，存为 snapshotOriginal
- 在 deactivate 的时候再次遍历 window 上的变量，分别和 snapshotOriginal 对比，将不同的存到 snapshotMutated 里，将 window 恢复回到 snapshotOriginal
- 当应用再次切换的时候，就可以把 snapshotMutated 的变量恢复回 window 上，实现一次沙箱的切换。

### vm沙箱

with + Proxy实现，通过创建一个沙箱，然后传入需要执行的代码。

## CSS沙箱

### CSSModule & CSS Namespace

编译阶段做处理

### CSS Scope

编译时给子应用添加scope，运行时则在加载子应用时，由loader处理

### Shadow DOM

Garfish 基于 ShadowDom 实现样式隔离

- 将容器节点变为 shadow dom
- 子应用节点操作转发到容器内，动态增加的样式和节点都会放置容器内
- 查询节点操作转发到容器内
- 事件向上传播，避免 React 依赖事件委托的库失效

