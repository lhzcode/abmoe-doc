# 全球web开发趋势

> 数据来源: https://2022.stateofjs.com/zh-Hans

stateofjs是著名的JavaScript 生态的年度开发者调查项目。22年度调查收集到了39,472份回答。向我们展示了目前国际上面前端的发展趋势

## 从业者统计

受访者主要来自美国、德国、法国、英国、印度、波兰、巴西等地区，69.5%使用英语。年龄呈正态分布，中位数在24~34岁之间。工作年限分布，2~5年和5~10年区间均占20%以上。80%的人有高等教育学位，40%是科班出身。公司规模在100~1000占比16.7%，1000以上占比15.3%。薪资的峰值在50k~100k之间，占比20.6%。男性占比93%，白种人或欧洲裔占比68.8%。视觉障碍占比20.9%。

## JavaScript语言新特性
[语言特性介绍](/web/javascript)
| 语言特性                      | 使用占比(%) |
| ----------------------------- | ----------- |
| 空值合并运算符(??)            | 69.9        |  |
| String.prototype.replaceAll() | 52.1        |
| 顶层await                     | 50.3        |
| Promise.allSettled()          | 46.4        |
| 动态import()                  | 46.4        |
| String.prototype.matchAll()   | 32.4        |
| Array.prototype.at()          | 31.1        |
| Promise.any()                 | 30.9        |
| 类私有域                      | 25.9        |
| Object.hasOwn()               | 25.2        |
| Proxy                         | 24.9        |
| 数字分隔符                    | 23.9        |
| Temporal                      | 23.1        |
| 逻辑与赋值运算符(&&=)         | 16.7        |
| Array.prototype.findLast()    | 15.5        |
| 正则表达式匹配索引            | 11.1        |
| Error.prototype.cause         | 7.5         |

## 浏览器新API

| 浏览器特性            | 使用占比(%) | 特性介绍                                                    |
| --------------------- | ----------- | ----------------------------------------------------------- |
| WebSocket API         | 62.9        | [WebSocket API](/web/browser-api/websocket)                 |
| Shadow DOM            | 42.1        | [Shadow DOM](/web/browser-api/shadow-dom)                   |
| Service Worker API    | 40.8        | [Service Worker API](/web/browser-api/service-workers)      |
| Intl                  | 38.2        | [Intl](/web/browser-api/intl)                               |
| Geolocation API       | 38          | [Geolocation API](/web/browser-api/geolocation)             |
| Custom Elements       | 35.3        | [Custom Elements](/web/browser-api/custom-elements)         |
| 文件系统访问 API      | 29.7        | [文件系统访问 API](/web/browser-api/file-system)            |
| Web Animations API    | 27.7        | [Web Animations API](/web/browser-api/animations)           |
| WebGL                 | 20          | [WebGL](/web/browser-api/webgl)                             |
| 页面可见性API         | 16.9        | [页面可见性API](/web/browser-api/page-visible)              |
| WebRTC API            | 16.1        | [WebRTC API](/web/browser-api/webrtc)                       |
| Web Share API         | 11.1        | [Web Share API](/web/browser-api/web-share)                 |
| Web Speech API        | 10          | [Web Speech API](/web/browser-api/speech)                   |
| Broadcast Channel API | 7.6         | [Broadcast Channel API](/web/browser-api/broadcast-channel) |
| WebXR Device API      | 2.5         | [WebXR Device API](/web/browser-api/webxr-device)           |

## 其他特性
| 其他特性               | 使用占比(%) | 特性介绍                                       |
| ---------------------- | ----------- | ---------------------------------------------- |
| 渐进式 Web 应用（PWA） | 58.3        | [渐进式 Web 应用（PWA）](/web/browser-api/pwa) |
| WebAssembly            | 17.5        | [WebAssembly](/web/browser-api/webassembly)    |

## 前端库总体发展趋势

### 随时间变化

用时间、使用率、受欢迎程度三个维度来衡量一个库的发展趋势。每条线段代表一个库，时间从2016年到2022年，横轴表示受欢迎程度，纵轴表示使用率。

![随时间变化](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/tools_arrows.png)

如何分析这张图呢，例如Rollup这个库：

![rollup](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/screenshot_2023-11-08_17-57-22.png)

使用人数比例看纵轴，起点是2017年，整体趋势向上。表示从2017年比例开始逐年上升，2021年之后暂时维持不变，但使用率仍然在半数以下。

欢迎程度看横轴，起点是2017年，整体趋势向右。表示从2017年欢迎程度向好，2020~2021维持不变，2021~2022欢迎程度有所下降，总体被大部分人看好。

<!-- 详情参考：https://2022.stateofjs.com/zh-Hans/libraries/ -->

### 满意度排名

使用率大于10%的库进行的满意度排名。

![rank](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/tier_list.png)

### 满意度对比使用率

该图表展示每项技术的**留存率**与其总的**用户数**。 它可以分为四个象限：
1. 低使用率，高留存率。值得密切关注的技术。 
2. 高使用率，高留存率。可采用的安全技术。 
3. 低使用率，低留存率。目前难以推荐的技术。 
4. 高使用率，低留存率。如果若正在使用这些技术，需要重新评估它们。

<!-- 详情参考：https://2022.stateofjs.com/zh-Hans/libraries/ -->

![overview](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/scatterplot_overview.png)

::: info
这一部分详细数据参考：https://2022.stateofjs.com/zh-Hans/libraries/
:::


## 不同类型的前端库发展趋势

### 衡量标准

按照前端框架、渲染框架、测试工具、移动端和客户端、构建工具、单仓多项目工具分类。关注同一类型下长期比率、体验的趋势。用于评估已有项目和新项目选型。

#### 长期比率

不包含认知率低于10％的技术。 每个比率定义如下：

- 满意率：会再次使用 / (会再次使用 + 不会再次使用)
- 关注率：想学习 / (想学习 + 不感兴趣)
- 使用率：(将再次使用 + 将不再使用) / 总计
- 认知率：(总计 - 从未听说过) / 总计

#### 随时间变化的体验

技术体验随时间变化的概览。

#### 积极/消极体验拆分图

用户的积极体验(想学习，会再次使用)和消极体验(不感兴趣，不会再次使用) 分别呈现在中轴两侧。 柱状的厚度代表了解某一技术的访问者数量

### 前端框架

![front_end_frameworks_experience_linechart](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/front_end_frameworks_experience_linechart.png)

![front_end_frameworks_section_streams](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/front_end_frameworks_section_streams.png)

![front_end_frameworks_experience_marimekko](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/front_end_frameworks_experience_marimekko.png)

### 渲染框架

![rendering_frameworks_experience_linechart](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/rendering_frameworks_experience_linechart.png)

![rendering_frameworks_section_streams](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/rendering_frameworks_section_streams.png)

![rendering_frameworks_experience_marimekko](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/rendering_frameworks_experience_marimekko.png)

### 测试工具

![testing_experience_linechart](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/testing_experience_linechart.png)

![testing_section_streams](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/testing_section_streams.png)

![testing_experience_marimekko](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/testing_experience_marimekko.png)

### 移动端和客户端

![mobile_desktop_experience_linechart](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/mobile_desktop_experience_linechart.png)

![mobile_desktop_section_streams](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/mobile_desktop_section_streams.png)

![mobile_desktop_experience_marimekko](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/mobile_desktop_experience_marimekko.png)

### 构建工具

![build_tools_experience_linechart](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/build_tools_experience_linechart.png)

![build_tools_section_streams](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/build_tools_section_streams.png)

![build_tools_experience_marimekko](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/build_tools_experience_marimekko.png)
### Monorepo 工具

![monorepo_tools_experience_linechart](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/monorepo_tools_experience_linechart.png)

![monorepo_tools_section_streams](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/monorepo_tools_section_streams.png)

![monorepo_tools_experience_marimekko](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/monorepo_tools_experience_marimekko.png)

::: info
这一部分详细数据参考：https://2022.stateofjs.com/zh-Hans/libraries/front-end-frameworks/
:::

## 其他工具

统计其他工具在受访者中的使用频率

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js2022-libraries.png)

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js2022-date_management.png)

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js2022-data_visualization.png)

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js2022-data_fetching.png)

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js2022-backend_frameworks.png)

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js2022-utilities.png)

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js2022-runtimes.png)

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js2022-edge_runtimes.png)

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js2022-javascript_flavors.png)

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js2022-non_js_languages.png)

## 用法

这一部分是受访者使用JavaScript的用法习惯。

有73.3%的用户使用TypeScript比JavaScript更多

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js_ts_balance.png)

84.7%的用户是专业的开发人员

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/usage_type.png)

98%用JavaScript写前端应用，65%用JavaScript写后端应用，移动端和桌面端分别有26.9%和20.1%的用户

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/what_do_you_use_js_for.png)

应用的渲染模式来说，在项目中有91.3%的SPA，54.6%的SSR，42.4%的SSG，38.5%的MPA

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js_app_patterns.png)

用户行业分布情况，主要还是集中在互联网、电商、金融、教育、销售、媒体等行业

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/industry_sector.png)

## 资料

有关JavaScript相关的学习路径、技术资料、自媒体等统计

入门学习方法统计来看，56.4%的用户是靠自学，另外通过免费在线课程、视频、书籍学习的人分别有40.6%、38.8%、25.7%

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/first_steps%20(1).png)

常用的博客和杂志有这些，比较大的博客平台，比如头部的 Medium 和 Dev.to 通常有知名的技术专家，资讯和消息都比较新

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/blogs_news_magazines.png)

常用网站，可以看出有这几类：问答网站 Stack Overflow、官方资料网站 MDN / W3Schools / Web.dev、学习培训网站 Udemy / freeCodeCamp / Codecademy

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/sites_courses.png)

播客的用户比较少，这里主要是访谈和讨论的节目

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/podcasts.png)

常见的视频博主：

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/video_creators.png)

其他调查问卷：

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/other_surveys.png)

## 观点

可以明显看到18年到19年的时候，人们的观点发生了一些变化。先不去讨论这个统计网站的问卷样本是否存在波动，回顾一下18年发生了什么。

2018年，webAssembly发布了1.0版本；React v16版本发布，其中重要特性是Hooks和Suspense API；Vue的GitHub Stars超过React，Vue3放出了新的PPT；静态站点生成刚开始兴起，Gatsbyjs和Next.js初见雏形；TypeScript的npm下载数量大幅增长；Edge浏览器采用Chromium内核。

诸如此类的变化，目前无法评价5年前是否有什么大的技术突破，但从今天的观点来看，整个社区还是朝着一个大体的方向前进，不断演进。下面来看一下具体的统计结果：

超过76%的用户认同JavaScript正在朝着正确的方向发展

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js_moving_in_right_direction.png)

构建JavaScript是否过于复杂这个问题，大家对此褒贬不一

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/building_js_apps_overly_complex.png)

JavaScript生态系统的变化是否过快这个问题，大家的理解也没有达成一致

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/js_ecosystem_changing_to_fast.png)

JavaScript痛点，排名前三是：代码架构、依赖管理、状态管理

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/top_js_pain_points.png)

JavaScript缺少的特性，排名前三是：静态类型、标准库、更好地日期管理

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/top_currently_missing_from_js.png)

网络技术满意度，76.2%的人偏向满意

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/20231114180044.png)

JavaScript总体状况，75.3%的人偏向满意

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/20231114180414.png)