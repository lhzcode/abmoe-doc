# 页面路由

## 两套方案

Next.js 目前有两套路由解决方案，之前的方案称之为 Pages Router，目前的方案称之为 App Router ，两套方案是兼容的，都可以在 Next.js 中使用。在 Next.js 官方文档进行搜索的时候，左上角会有 App 和 Pages 选项，这对应的就是 App Router 和 Pages Router。

Next.js从v13开始使用App Router的路由模式。官方更加推荐使用该模式。后面我们采用这种方案就好了、

## 定义路由

文件夹被用来定义路由。每个文件夹都代表一个对应到 URL 片段的路由片段。创建嵌套的路由，只需要创建嵌套的文件夹。举个例子，下图的 app/dashboard/settings目录对应的路由地址就是 /dashboard/settings：

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Froute-segments-to-path-segments.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8 )

定义出来的这个路由可能是页面，也有可能是api接口，nextjs有一套固定的规范

## 页面（Pages）

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fpage-special-file.png&w=1920&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

以``page.js|jsx|tsx``命名的文件将会被解析成一个HTML页面

## 组件层次结构

在路由段中有这些特殊文件约定：

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Ffile-conventions-component-hierarchy.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

需要注意的是：
- 根布局 ``app/layout``
  - app 目录必须包含根布局。
  - 根布局必须包含 html 和 body标签，其他布局不能包含这些标签。如果要修改，可以通过修改Metadata的方式修改，提供了静态和动态的各种不同方法
  - 可以使用路由组创建多个根布局
  - 默认根布局是服务端组件，且不能设置成客户端组件
- 模板 ``temlate``
  - 模板可以处理副作用，例如 useEffect 和 useState，而布局不可以
  - 可以更改框架的默认行为，举个例子，布局内的 Suspense 只会在布局加载的时候展示一次 fallback UI，当切换页面的时候不会展示。但是使用模板，fallback 会在每次路由切换的时候展示。

## 导航和链接

### ``<Link>``组件

- 跳转行为 ``scroll``
  - App Router 的默认行为是滚动到新路由的顶部，或者在前进后退导航时维持之前的滚动距离。由scroll参数控制
- 预加载 ``prefetch``
  - 静态路由，``prefetch``为true，整个路由被预取并缓存
  - 动态路由： prefetch 默认为自动。仅共享布局向下，直到为 30s 预取并缓存第一个 loading.js 文件。这降低了获取整个动态路线的成本，这意味着你可以显示即时加载状态，以便为用户提供更好的视觉反馈。

### useRouter

- router.prefetch，预取提供的路由以实现更快的客户端转换。
- router.refresh，刷新当前路由。向服务器发出新请求，重新获取数据请求，并重新渲染服务器组件。客户端将合并更新的 React 服务器组件有效负载，而不会丢失不受影响的客户端 React（例如 useState ）或浏览器状态（例如滚动位置）。

### 工作原理

- 预加载
  如上面所述，组件和钩子函数处理方式
- 缓存
  参考Route Cache，是一个内存客户端缓存。会在fetch一章讲讲
- 部分渲染
  部分渲染意味着仅在客户端上重新渲染导航时发生变化的路线段，并且保留所有共享段。
  例如，当在两个同级路由 /dashboard/settings 和 /dashboard/analytics 之间导航时，将呈现 settings 和 analytics 页面，并且共享 dashboard 布局将被保留。
  ![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fpartial-rendering.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)
- 软路由
  App Router 使用软导航。这意味着 React 仅渲染已更改的片段，同时保留 React 和浏览器状态，并且不会重新加载整个页面。
- 后退和前进导航
  默认情况下，Next.js 将维护向后和向前导航的滚动位置，并重用路由器缓存中的路由段。

## 路由组

将路由和项目文件按照逻辑进行分组，但不会影响 URL 路径结构。用法就是把文件夹用括号括住就可以了，就比如 ``(dashboard)``。

- 按逻辑分组
  ![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Froute-group-organisation.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)
- 创建不同布局
  ![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Froute-group-opt-in-layouts.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)
- 创建多个根布局
  ![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Froute-group-multiple-root-layouts.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

需要注意的是：
- 路由组的命名除了用于组织之外并无特殊意义。它们不会影响 URL 路径。
- 注意不要解析为相同的 URL 路径。举个例子，因为路由组不影响 URL 路径，所以 (marketing)/about/page.js和 (shop)/about/page.js都会解析为 /about，这会导致报错。
- 创建多个根布局的时候，因为删除了顶层的 app/layout.js文件，访问 /会报错，所以app/page.js需要定义在其中一个路由组中。
- 跨根布局导航会导致页面完全重新加载，就比如使用 app/(shop)/layout.js根布局的 /cart 跳转到使用 app/(marketing)/layout.js根布局的 /blog 会导致页面重新加载（full page load）。

## 动态路由

当你事先不知道确切的路段名称并希望从动态数据创建路线时，你可以使用在请求时填充或在构建时预渲染的动态路段。

可以通过将文件夹名称括在方括号中来创建动态段： [folderName] 。例如， [id] 或 [slug] 。

### 基本使用

Route：``app/blog/[slug]/page.js``，url地址：``/blog/a``，params：``{ slug: 'a' }``

动态参数作为 params 属性传递给 layout 、 page 、 route 和 generateMetadata 函数。可以在构建时生成路由

### 全捕获分组

Route：``app/shop/[...slug]/page.js``，url地址：``/shop/a/b/c``，params：``{ slug: ['a', 'b', 'c'] }``

### 可选全捕获分组

不带参数也可以匹配

Route：``app/shop/[[...slug]]/page.js``，url地址：``/shop``，params：``{}`

Route：``app/shop/[...slug]/page.js``，url地址：``/shop/a/b/c``，params：``{ slug: ['a', 'b', 'c'] }``

## 平行路由

平行路由的使用方式就是将文件夹以 @作为开头进行命名

### 适用场景

平行路由可以使你在同一个布局中同时或者有条件的渲染一个或者多个页面（类似于 Vue 的插槽功能）

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fparallel-routes.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

平行路由还允许你根据某些条件（例如身份验证状态）有条件地渲染插槽。这使得同一 URL 上的代码完全分离。

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fconditional-routes-ui.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

平行路由允许你在每个路由独立流式传输时定义独立的错误和加载状态。

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fparallel-routes-cinematic-universe.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

### 不匹配路由

可以定义一个 default.js 文件，以在 Next.js 无法根据当前 URL 恢复插槽的活动状态时将其呈现为后备。

参考以下文件夹结构。 @team 插槽有一个 settings 目录，但 @analytics 没有。

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fparallel-routes-unmatched-routes.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

- 如果未匹配到路由，在路由导航中，还是呈现之前的状态
- 重新加载时，将首先尝试渲染不匹配插槽的 default.js 文件。如果不可用，则会呈现 404。

### useSelectedLayoutSegment(s)

useSelectedLayoutSegment 和 useSelectedLayoutSegments 可以读取槽内的数据

``` js
'use client'
 
import { useSelectedLayoutSegment } from 'next/navigation'
 
export default async function Layout(props: {
  //...
  auth: React.ReactNode
}) {
  const loginSegments = useSelectedLayoutSegment('auth')
  // ...
}
```
当用户导航到 URL 栏中的 @auth/login 或 /login 时， loginSegments 将等于字符串 "login" 。

### 模态框

可以通过导航到匹配的路由来显示模态框组件。

default.js设置为null。

如果模式是通过客户端导航启动的，例如通过使用 ``<Link href="/login">`` ，你可以通过调用 router.back() 或使用 Link 组件来关闭模式。

## 拦截路由

拦截路由允许你在当前布局内加载应用其他部分的路由。例如这个图片查看功能

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fintercepting-routes-soft-navigate.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

### 实现方式
在 Next.js 中，实现拦截路由需要你在命名文件夹的时候以 (..) 开头，其中：

- (.) 表示匹配同一层级
- (..) 表示匹配上一层级
- (..)(..) 表示匹配上上层级。
- (...) 表示匹配根目录
但是要注意的是，这个匹配的是路由的层级而不是文件夹的层级，就比如路由组、平行路由这些不会影响 URL 的文件夹就不会被计算层级。

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fintercepted-routes-files.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)