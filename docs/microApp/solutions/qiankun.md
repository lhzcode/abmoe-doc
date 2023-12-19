# qiankun

qiankun 是一个基于 single-spa 的微前端实现库，通过 import-html-entry 进行资源导入，是目前应用最广泛的微前端解决方案之一。主要服务于蚂蚁的内部应用

## 应用加载方式

### App Entry

为了实现真正的技术栈无关跟独立部署两个核心目标，选择了运行时，而不是构建时加载子应用。主应用与子应用之间完全解耦，子应用完全技术栈无关，但是会多一些运行时的复杂度和开销。

### HTML Entry

直接将子应用打出来 HTML 作为入口，主框架可以通过 fetch html 的方式获取子应用的静态资源，同时将 HTML document 作为子节点塞到主框架的容器中。这样不仅可以极大的减少主应用的接入成本，子应用的开发方式及打包方式基本上也不需要调整。

### 应用加载流程

基本等同于single-spa的加载流程。简要流程为：

- 配置qiankun的预加载策略与兼容性处理

- 调用single-spa的start方法

- 在single-spa的start方法中，调用reroute方法，最后调用finishUpAndReturn方法，触发single-spa:no-app-change事件。

- 调用single-spa:no-app-change事件的回调函数setDefaultMountApp（qiankun）

- 调用setDefaultMountApp函数（qiankun）中的navigateToUrl函数，调用window.history.pushState，修改浏览器历史记录

- 此时触发popstate事件，在single-spa中调用urlReroute函数，最后调用performAppChanges函数，加载并挂载应用

## 路由系统

使用了single-spa的路由系统，single-spa 对popstate和hashchange事件做了监听，当发现路由改变的时候，则会去找NOT_mount状态的子应用，去调用它们暴露出来的 mount 方法进行挂载，同时，会把之前显示的子应用进行卸载，也就是那些状态已经是MOUNTED的子应用，去调用 unmount 方法进行卸载。

## js沙箱

### 快照沙箱(snapshotSandbox)

  qiankun的快照沙箱是基于diff来实现的，主要用于不支持window.Proxy的低版本浏览器(IE 浏览器)，而且也只适应单个的子应用

### 代理沙箱(proxySandbox)
  
  代理沙箱(proxySandbox)：qiankun基于es6的Proxy实现了两种应用场景不同的沙箱，

  - legacySandbox(单例)
  
  - proxySandbox(多例)

::: warning
可能遇到的问题：
- 沙箱只有一层的劫持，例如 Date.prototype.xxx 这样的改动是不会被还原的
- 给 body 、 document 等绑定的事件，必须在 unmount 周期清除，使用 document.body.addEventListener 或者 document.body.onClick 添加的事件并不会被沙箱移除，会对其他的页面产生影响
- 第三方引入的 JS 不生效，有些 JS 文件本身是个立即执行函数，或者会动态的创建 scipt 标签，但是所有获取资源的请求是被qiankun劫持处理，所以都不会正常执行，也不会在 window 下面挂载相应的变量
:::

## css

### ShadowDOM

通过 strictStyleIsolation 开启。由于只创建了ShadowDOM，没有通过Proxy代理浏览器api，可能会导致一部分css失效或者无法被移除。不建议使用。

完整实现可以参考wujie的方案。无界将子应用完整渲染在shadowdom内，拥有完整的 html、head、body，并且劫持 iframe 沙箱的 document 事件监听机制，从而避免了这些问题，当然里面还有很多细节要处理，所以无界直接采用shadow-dom的样式隔离方案。

### scoped css

通过 experimentalStyleIsolation 开启。会对子应用所有样式规则增加一个特殊的选择器来限定范围。形如：``div[data-qiankun-react16]``

## 通信方式

采用基于props的方案，在主应用创建共享状态，微应用通过props获取共享状态并监听。本质实现就是回调函数。

<!-- ## App Entry

构建时组合 VS 运行时组合

| 方案   | 特点      |       优点           | 缺点 |
| ------ | ------- | ------------- | ----------- |
| 构建时 | 子应用通过 Package Registry(可以是npm package,也可以是git tags等其他方式）的方式，与主应用一起打包发布。 | 主应用、子应用之间可以做打包优化             | 子应用与主应用之间产品工具链耦合。工具链也是技术栈的一部分。子应用每次发布以来主应用重新发布打包 |
| 运行时 | 子应用自己构建打包，主应用运行时动态加载子应用资源。                                                     | 主应用和子应用完全解耦，子应用完全技术栈无关 | 主应用与子应用之间完全解耦，子应用会多出一些运行时的复杂度和开销                                 |

很显然，要实现真正的技术栈无关跟独立部署两个核心目标，大部分场景下我们需要使用运行时加载子应用这种方案。

## JS Entry vs HTML Entry

在确定了运行时载入的方案后，另一个需要决策的点是，我们需要子应用提供什么形式的资源作为渲染入口？

JS Entry 的方式通常是子应用将资源打成一个 entry script，比如 single-spa 的 example 中的方式。但这个方案的限制也颇多，如要求子应用的所有资源打包到一个 js bundle 里，包括 css、图片等资源。除了打出来的包可能体积庞大之外的问题之外，资源的并行加载等特性也无法利用上。

HTML Entry 则更加灵活，直接将子应用打出来 HTML 作为入口，主框架可以通过 fetch html 的方式获取子应用的静态资源，同时将 HTML document 作为子节点塞到主框架的容器中。这样不仅可以极大的减少主应用的接入成本，子应用的开发方式及打包方式基本上也不需要调整，而且可以天然的解决子应用之间样式隔离的问题(后面提到)。想象一下这样一个场景：

``` js
// 子应用 index.html
<script src="//unpkg/antd.min.js"></script>
<body>
  <main id="root"></main>
</body>
// 子应用入口
ReactDOM.render(<App/>, document.getElementById('root'))
```

如果是 JS Entry 方案，主框架需要在子应用加载之前构建好相应的容器节点(比如这里的 "#root" 节点)，不然子应用加载时会因为找不到 container 报错。但问题在于，主应用并不能保证子应用使用的容器节点为某一特定标记元素。而 HTML Entry 的方案则天然能解决这一问题，保留子应用完整的环境上下文，从而确保子应用有良好的开发体验。

HTML Entry 方案下，主框架注册子应用的方式则变成：

``` js
framework.registerApp('subApp1', { entry: '//abc.alipay.com/index.html'})
```

本质上这里 HTML 充当的是应用静态资源表的角色，在某些场景下，我们也可以将 HTML Entry 的方案优化成 Config Entry，从而减少一次请求，如：

``` js
framework.registerApp('subApp1', { html: '', scripts: ['//abc.alipay.com/index.js'], css: ['//abc.alipay.com/index.css']})
``` -->

