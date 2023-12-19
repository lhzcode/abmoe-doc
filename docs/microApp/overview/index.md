# 微前端技术总览

## 什么是微前端

“微前端”的概念最早由 Thoughtworks 在2016年的 [ThoughtWorks Technology Radar ](https://www.thoughtworks.com/radar/techniques/micro-frontends)中提出。这个概念将微服务这个被广泛应用于服务端的技术范式扩展到前端。

现代的前端应用的发展趋势正在变得越来越富功能化，富交互化，也就是SPA；这样越来越复杂的单体前端应用，背后的后端应用则是数量庞大的微服务集群。被一个团队维护的前端项目，随着时间推进，会变得越来越庞大，越来越难以维护。如下图表示了2016年以前的发展趋势：

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/monolith-frontback-microservices.png)

微前端思想认为：现代复杂的web app或者网站，通常由很多**相对独立的功能模块**组合而成，而对这些模块负责的应该是**相互独立的多个团队**。这些独立的团队由于专业分工不同，会负责着**特定的业务领域**，以及完成**特定的开发任务**。这样的团队，通常在人员组成方面囊括了从前端开发到服务端开发，从UI实现到数据库设计这样**端到端**的**跨职能人员**构成。

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/verticals-headline.png)

## 微前端的价值

- 独立开发、独立部署

  每个单独的微前端代码将比单个整体前端的源代码小很多，较小的代码库对于开发人员来说往往更简单、更容易使用，每一个单独的应用和模块也更加解耦。

  如同微服务一样，微前端也缩小了部署的范围，降低了相关风险。每个微前端应用的部署和发布周期可以由构建和维护的人员来决定。
  
- 增量升级

  对于已有巨石应用来说，因为旧技术栈或祖传代码难以阅读和理解，已经到了重写的地步。为了避免完全重写的风险，可以通过微前端逐步的推进重构。同时，也利于实验性的技术升级，为应用注入新的活力。

- 团队自治

  将代码库和发布周期解耦出去之后，前端在独立团队中还有很长一条路可以走。我们可以更快速有效的参与到产品从构思到生产整个过程，提供客户价值。为了实现这一点，我们需要围绕业务功能的垂直部分而不是技术能力来组建。每个团队可以选择自己的技术栈以及技术进化路线，应用之间不会有直接或者间接的技术栈、依赖以及实现上的耦合。

## 微前端方案

### 改造技术方案

| 方案                                                       | 描述                                                                                                                                                                                                  | 优点                                                         | 缺点                                                     |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| [开箱即用框架](/microApp/overview/#基座方案)               | 例如single-spa、qiankun等通用框架                                                                                                                                                                     | 提供了基座到微应用的整套解决方案，部分框架有活跃社区，接入快 | 根据实际项目检查是否兼容                                 |
| [iframe](/microApp/principles/iframe)                      | 主应用中使用 iframe 标签来加载不同的微应用                                                                                                                                                            | 实现简单，子应用之间自带沙箱，天然隔离，互不影响             | 子应用之间跳转性能较差                                   |
| [NPM包](/microApp/principles/npm)                          | 微应用打包成独立NPM包，在主应用中安装和使用                                                                                                                                                           | 代码解耦，更加规范和标准                                     | 需要对业务十分熟悉，可能造成全局冲突                     |
| [动态 Script](/microApp/principles/dynamicscript)          | 在主应用中动态切换微应用的 Script 脚本                                                                                                                                                                | 具备线上动态的微应用管理能力                                 | 全局变量和css会产生冲突                                  |
| [Web Components](/microApp/principles/webcomponents)       | 微应用封装成自定义组件，在主应用中注册使用                                                                                                                                                            | 子应用拥有独立的script和css，也可以单独部署                  | 需要考虑浏览器兼容性                                     |
| [Module Federation](/microApp/principles/modulefederation) | Webpack 5 的新特性之一，允许在多个 webpack 编译产物之间共享模块、依赖、页面甚至应用                                                                                                                   | 项目灵活性非常大，优雅解决跨应用共享                         | 资源异步加载导致的性能、安全、调试等一系列问题           |
| [Monorepo](/microApp/principles/monorepo)                  | 单仓库管理多个项目，有助于简化代码共享、版本控制、构建和部署等方面的复杂性，并提供更好的可重用性和协作性                                                                                              | 容易看到项目全貌，编码方便                                   | 没有项目粒度权限管理，代码体积大                         |
| BFF                                                        | 非SPA模式下，前端应用各自部署在相应的服务下，在主应用中通过服务端路由来请求和渲染不同的微应用。不同路由的HTTP请求将被分发到对应的服务上，涉及到Nginx反代后的服务，静态资源服务，CDN服务，对象存储服务 | 整体框架设计更加灵活多变，整体性能更好                       | 前端应用自身解耦过程本身不涉及服务端的更改，增加了工作量 |

### 基座方案

<!-- <style module>
  .solution-table table {
    th:first-of-type {
      width: 100px;
    }
  }
</style>
<div class="solution-table"> -->
| 微前端框架                                  | 厂商 | 实现原理                           | 微应用加载方式                     |                    生命周期                     | JS隔离                         | CSS隔离                           | 通信                               |
| ------------------------------------------- | ---- | :--------------------------------- | ---------------------------------- | :---------------------------------------------: | ------------------------------ | --------------------------------- | ---------------------------------- |
| [single-spa](/microApp/solutions/singlespa) | 社区 | 路由变化导致的生命周期变化         | 生命周期中手动加载                 | Load<br>Bootstrap<br>Mount<br>Unmount<br>Unload | 无                             | 无                                | parcel（可选）                     |
| [qiankun](/microApp/solutions/qiankun)      | 蚂蚁 | single-spa +<br> import-html-entry | import-html-entry                  |                  类single-spa                   | 基于Proxy的沙箱                | 编译时&运行时prefix<br>Shadow DOM | 回调函数                           |
| [icestark](/microApp/solutions/icestark)    | 阿里 | 类single-spa                       | AppRoute<br>类single-spa<br>微模块 |                  类single-spa                   | 基于Proxy的沙箱                | 编译时&运行时prefix<br>Shadow DOM | EventEmitter                       |
| [garfish](/microApp/solutions/garfish)      | 字节 | 类single-spa                       | Garfish bridge                     |                加载、渲染、销毁                 | window变量缓存<br>with + Proxy | 编译时&运行时prefix<br>Shadow DOM | EventEmitter2                      |
| [wujie](/microApp/solutions/wujie)          | 腾讯 | Web Components + iframe            | 保活模式<br>单例模式<br>重建模式   |               三种加载模式各不同                | iframe + Proxy                 | Shadow DOM + Proxy                | props<br>window.parent<br>EventBus |
| [Emp](/microApp/solutions/emp)              | 百度 | module federation                  | EMP Share                          |                  模块远程调用                   | 无                             | 无                                | 无                                 |
<!-- <div> -->
<!--                                        | [MicroApp](/microApp/solutions/microapp) | 京东                           | MicroApp                     |                    lifecycle                    | Mock隔离                      | Mock隔离 + Shadow DOM            | -->                          

<!-- ### 微应用配置管理

### 本地开发调试

### 应用监控 -->

## 引用

[Micro Frontends](https://micro-frontends.org/)

[Micro Frontends from martinfowler.com](https://martinfowler.com/articles/micro-frontends.html)
