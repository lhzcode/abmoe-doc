# 渲染方式

在 Next.js v13 之后，Next.js 推出了基于 React Server Component 的 App Router，已经弱化了CSR、SSR、SSG、ISR这些名词和概念。变成了服务器组件、客户端组件、以及他们的混合模式，这样有助于我们专注于业务开发，而不是纠结用哪一种渲染模式。

## 服务端组件

### 服务端渲染优势

使用服务端渲染有很多好处：

- 数据获取：通常服务端环境（网络、性能等）更好，离数据源更近，在服务端获取数据会更快，通过减少数据加载时间以及客户端发出的请求数量来提高性能
- 安全：允许在服务端保留敏感数据和逻辑，而不用担心暴露给客户端
- 缓存：服务端渲染的结果可以在后续的请求中复用，以提高性能
- bundle 大小：服务端组件的代码不会打包到 bundle 中，减少了 bundle 包的大小
- 初始页面加载和 FCP：服务端渲染生成 HTML，可以下载用于快速展示
- 流式处理：服务器组件可以将渲染工作拆分为块，并在准备就绪时将它们流式传输到客户端。用户可以更早看到页面的部分内容，而不必等待整个页面渲染完毕。
  
### 声明服务端组件

Next.js 默认使用服务端组件，所以无须其他配置：

``` js
// app/page.js
export default function Page() {
  return (
    <h1>Hello World!</h1>
  )
}
```

### 服务端渲染策略

Next.js 中存在三种不同的服务端渲染策略：

- 静态渲染
- 动态渲染
- Streaming

### 服务端组件渲染原理

在服务端，Next.js 使用 React API 来编排渲染，渲染工作按路由段和 Suspense 边界拆分成多个 chunk，每个 chunk 分两步进行渲染：

- React 将服务端组件渲染成一个特殊的数据格式称为 React Server Component Payload (RSC Payload)
- Next.js 在服务端使用 RSC Payload 和客户端组件 JavaScript 指令渲染 HTML

然后在客户端：

- 加载 HTML 用于快速展示一个非交互的预览页面
- 加载 RSC Payload 用于协调客户端和服务端组件树，并更新 DOM
- 加载 JavaScript 指令用于水合客户端组件并使应用程序具有交互性
- 所谓水合（hydration），指的是将事件监听器添加到 DOM，使静态的 HTML 具有交互性的过程。Next.js 使用的是 React 的 hydrateRoot API 来完成的。

### 服务端渲染策略

#### 静态渲染（Static Rendering）
  这是默认渲染策略，路由在构建时渲染，或者在重新验证后后台渲染，其结果会被缓存并可以推送到 CDN。适用于未针对用户个性化且数据已知的情况，比如静态博客文章、产品介绍页面等。

#### 动态渲染（Dynamic Rendering）
  路由在请求时渲染，适用于针对用户个性化或依赖请求中的信息（如 cookie、URL 参数）的情况。在渲染过程中，如果使用了动态函数或者退出缓存的数据请求，Next.js 就会切换为动态渲染：

| 动态函数 | 数据缓存 | 渲染策略 |
| -------- | -------- | -------- |
| 否       | 缓存     | 静态渲染 |
| 是       | 缓存     | 动态渲染 |
| 否       | 未缓存   | 动态渲染 |
| 是       | 未缓存   | 动态渲染 |

通过这张表也可以得知：

- 如果要让一个路由完全静态，所有的数据必须被缓存
- 一个动态渲染的路由可以同时使用缓存和未缓存的数据请求

作为开发者，无须选择静态还是动态渲染，Next.js 会自动根据使用的功能和 API 为每个路由选择最佳渲染策略

- 动态函数（Dynamic functions）

  动态函数指的是获取只能在请求时才能得到的信息（如 cookie、请求头、URL 参数）的函数，在 Next.js 中这些动态函数是：

  - cookies() 和 headers() ：获取 cookie 和 header
  - useSearchParams() ：获取页面查询参数
  - searchParams：获取页面查询参数
  
  使用这些函数的任意一个，都会导致整个路由转为动态渲染

- 退出缓存的数据请求（uncached data request）

在 Next.js 中，fetch 请求的结果默认会被缓存，但你可以设置退出缓存，一旦你设置了退出缓存，就意味着使用了退出缓存的数据请求，会导致路由进入动态渲染，如：

  - fetch 请求使用 cache: 'no-store'选项
  - 单个 fetch 请求使用 revalidate: 0选项
  - fetch 请求在路由处理程序中并使用了 POST 方法
  - 使用headers 或 cookies 的方法之后使用 fetch请求
  - 配置了路由段选项 const dynamic = 'force-dynamic'
  - 配置了路由段选项fetchCache ，默认会跳过缓存
  - 使用 Authorization或者 Cookie请求头的 fetch 请求并且在组件树中其上方还有一个未缓存的请求

数据缓存和渲染策略是分开的，也就是说假如你选择了动态渲染，Next.js 会在请求的时候再渲染 RSC Payload 和 HTML，但是其中涉及的数据请求，依然是可以从缓存中获取的。

#### Streaming

Streaming 用于从服务端逐步渲染 UI，渲染内容会被拆分成多个 chuck，并在准备就绪时流式传输给客户端。这使得用户可以在内容完全渲染之前先查看并与部分内容交互。

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fsequential-parallel-data-fetching.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

使用 loading.js 或者带 React Suspense 的 UI 组件会开启流式传输路由段。

## 客户端组件

### 客户端渲染优势

- 交互性：客户端组件可以使用 state、effects 和事件监听器，意味着用户可以与之交互
- 浏览器 API：客户端组件可以使用浏览器 API 如地理位置、localStorage 等
  
### 声明客户端组件

使用客户端组件，在文件顶部添加一个 "use client" 声明即可：

``` js
'use client'
// app/counter.tsx
import { useState } from 'react'
 
export default function Counter() {
  const [count, setCount] = useState(0)
 
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  )
}
```

"use client"用于声明服务端和客户端组件模块之间的边界，当你在文件中定义了一个 "use client"，导入的其他模块包括子组件，都会被视为客户端 bundle 的一部分。

正如之前所说，写服务端组件和客户端组件是有一些区别的，写服务端组件的时候，注意不能使用类似于 onClick之类的事件，不能使用 useState、useEffect 之类的 effect，如果你在未声明的情况下使用，会导致报错：

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fuse-client-directive.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

来区分一下是使用客户端组件还是服务端组件：

| 行为                                                          | 服务端组件 | 客户端组件 |
| ------------------------------------------------------------- | ---------- | ---------- |
| 获取数据                                                      | ✅          | ❌          |
| 访问后端资源（直接）                                          | ✅          | ❌          |
| 在服务器上保留敏感信息（访问令牌、API 密钥等）                | ✅          | ❌          |
| 在服务端使用依赖包，从而减少客户端 JavaScript 大小            | ✅          | ❌          |
| 添加交互和事件侦听器（onClick(), onChange() 等）              | ❌          | ✅          |
| 使用状态和生命周期（useState(), useReducer(), useEffect()等） | ❌          | ✅          |
| Use browser-only APIs 使用仅限浏览器的 API                    | ❌          | ✅          |
| 使用依赖于状态、效果或仅限浏览器的 API 的自定义 hook          | ❌          | ✅          |
| 使用 React 类组件                                             | ❌          | ✅          |

### 客户端组件渲染原理

为了优化初始页面加载的效果，Next.js 也会为客户端组件渲染一份静态的 HTML，这意味着，当用户第一次访问应用程序的时候，会立即看到页面内容，而无须等待客户端下载、解析和执行客户端组件 JavaScript bundle。

在服务端：

- React 将服务端组件渲染成一个特殊的数据格式称为 React Server Component Payload (RSC Payload)
- Next.js 在服务端使用 RSC Payload 和客户端组件 JavaScript 指令渲染 HTML

然后在客户端：

- 加载 HTML 用于快速展示一个非交互的预览页面
- 加载 RSC Payload 用于协调客户端和服务端组件树，并更新 DOM
- 加载 JavaScript 指令用于水合客户端组件并使应用程序具有交互性

所以所谓“客户端组件”并不是完全在客户端使用 JavaScript 渲染，而是在客户端进行水合。

## 建议与最佳实践

接下来和大家分享一些使用服务端组件和客户端组件时的建议和最佳实践：

### 使用服务端组件

#### 不用担心重复请求

当在服务端获取数据的时候，有可能出现多个组件共用一个数据的情况。

面对这种情况，你不需要使用 React Context（当然服务端也用不了），也不需要通过 props 传递数据，直接在需要的组件中请求数据即可。这是因为 React 拓展了 fetch 的功能，添加了记忆缓存功能，相同的请求和参数，返回的数据会做缓存。

``` js
// app/example.tsx
async function getItem() {
  const res = await fetch('https://.../item/1')
  return res.json()
}
 
// 函数被调用了两次，但只有第一次才执行
const item = await getItem() // cache MISS
 
// 第二次使用了缓存
const item = await getItem() // cache HIT
```

当然这个缓存也是有一定条件限制的，比如只能在 GET 请求中，具体的限制和原理我们会在《缓存篇 | Caching》中具体讲解。

#### 限制组件只在服务端使用
由于 JavaScript 模块可以在服务器和客户端组件模块之间共享，所以如果你希望一个模块只用于服务端，就比如这段代码：

``` js
// lib/data.ts
export async function getData() {
  const res = await fetch('https://external-service.com/data', {
    headers: {
      authorization: process.env.API_KEY,
    },
  })
 
  return res.json()
}
```

这个函数使用了 API_KEY，所以它应该是只用在服务端的。如果用在客户端，为了防止泄露，Next.js 会将私有环境变量替换为空字符串，所以这段代码可以在客户端导入并执行，但并不会如期运行。

为了防止客户端意外使用服务器代码，我们可以借助 server-only包，这样在客户端意外使用的时候，会抛出构建错误。

使用 server-only，首先安装该包：

``` shell
npm install server-only
```

其次将该包导入只用在服务端的组件代码中：

``` js
// lib/data.js
import 'server-only'
 
export async function getData() {
  const res = await fetch('https://external-service.com/data', {
    headers: {
      authorization: process.env.API_KEY,
    },
  })
 
  return res.json()
}
```

现在，任何导入 getData的客户端组件都会在构建的时候抛出错误，以保证该模块只能在服务端使用。

#### 当使用第三方包

毕竟 React Server Component 是一个新特性， React 生态里的很多包可能还没有跟上，这样就可能会导致一些问题。

比如你使用了一个导出 ``<Carousel />``组件的 acme-carousel包。这个组件使用了 useState，但是它并没有 "use client" 声明。

当你在客户端组件中使用的时候，它能正常工作：

``` js
'use client'
// app/gallery.tsx
import { useState } from 'react'
import { Carousel } from 'acme-carousel'
 
export default function Gallery() {
  let [isOpen, setIsOpen] = useState(false)
 
  return (
    <div>
      <button onClick={() => setIsOpen(true)}>View pictures</button>
 
      {/* Works, since Carousel is used within a Client Component */}
      {isOpen && <Carousel />}
    </div>
  )
}
```

然而如果你在服务端组件中使用，它会报错：

``` js
// app/page.tsx
import { Carousel } from 'acme-carousel'
 
export default function Page() {
  return (
    <div>
      <p>View pictures</p>
 
      {/* Error: `useState` can not be used within Server Components */}
      <Carousel />
    </div>
  )
}
```

这是因为 Next.js 并不知道 ``<Carousel />``是一个只能用在客户端的组件，毕竟它是三方的，你也无法修改它的代码，为它添加 "use client" 声明，Next.js 于是就按照服务端组件进行处理，结果它使用了客户端组件的特性 useState，于是便有了报错。

为了解决这个问题，你可以自己包一层，将该三方组件包在自己的客户端组件中，比如：

``` js
'use client'
// app/carousel.tsx
import { Carousel } from 'acme-carousel'
 
export default Carousel
```

现在，你就可以在服务端组件中使用 ``<Carousel />``了：

``` js
import Carousel from './carousel'
 
export default function Page() {
  return (
    <div>
      <p>View pictures</p>
      <Carousel />
    </div>
  )
}
```

#### 使用 Context Provider

Context Provider 主要是为了共享一些全局状态，就比如当前的主题（实现换肤功能）。但服务端组件不支持 React context，如果你直接创建会报错：

``` js
// app/layout.js
import { createContext } from 'react'
 
//  服务端组件并不支持 createContext
export const ThemeContext = createContext({})
 
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
      </body>
    </html>
  )
}
```

为了解决这个问题，你需要在客户端组件中进行创建和渲染：

``` js
'use client'
// app/theme-provider.js
import { createContext } from 'react'
 
export const ThemeContext = createContext({})
 
export default function ThemeProvider({ children }) {
  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
}
```

然后再在根节点使用：

``` js
// app/layout.js
import ThemeProvider from './theme-provider'
 
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

这样应用里的其他客户端组件就可以使用这个上下文。

### 使用客户端组件

#### 客户端组件尽可能下移

为了尽可能减少客户端 JavaScript 包的大小，尽可能将客户端组件在组件树中下移。

举个例子，当你有一个包含一些静态元素和一个交互式的使用状态的搜索栏的布局，没有必要让整个布局都成为客户端组件，将交互的逻辑部分抽离成一个客户端组件（比如），让布局成为一个服务端组件：

``` js
// app/layout.js
// SearchBar 客户端组件爱你
import SearchBar from './searchbar'
// Logo 服务端组件
import Logo from './logo'
 
// Layout 依然作为服务端组件
export default function Layout({ children }) {
  return (
    <>
      <nav>
        <Logo />
        <SearchBar />
      </nav>
      <main>{children}</main>
    </>
  )
}
```

#### 从服务端组件到客户端组件传递的数据需要可序列化

当你在服务端组件中获取的数据，需要以 props 的形式向下传给客户端组件，这个数据需要是可序列化的。

这是因为 React 需要先在服务端将组件树先序列化传给客户端，再在客户端反序列化构建出组件树。如果你传递了不能序列化的数据，这就会导致错误。

如果你不能序列化，那就改为在客户端使用三方包获取数据吧。

### 交替使用服务端组件和客户端组件

服务端组件可以直接导入客户端组件，但客户端组件并不能导入服务端组件：

``` js
'use client'
// app/client-component.js
// 这是不可以的
import ServerComponent from './Server-Component'
 
export default function ClientComponent({ children }) {
  const [count, setCount] = useState(0)
 
  return (
    <>
      <button onClick={() => setCount(count + 1)}>{count}</button>
 
      <ServerComponent />
    </>
  )
}
```

但你可以将服务端组件以 props 的形式传给客户端组件：

``` js
'use client'
// app/client-component.js
import { useState } from 'react'
 
export default function ClientComponent({ children }) {
  const [count, setCount] = useState(0)
 
  return (
    <>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      {children}
    </>
  )
}
// app/page.js
import ClientComponent from './client-component'
import ServerComponent from './server-component'
 
export default function Page() {
  return (
    <ClientComponent>
      <ServerComponent />
    </ClientComponent>
  )
}
```

使用这种方式，``<ClientComponent>`` 和 ``<ServerComponent>`` 代码解耦且独立渲染。在这个例子中，``<ServerComponent>`` 会在 ``<ClientComponent>`` 在客户端渲染之前就在服务端被渲染。