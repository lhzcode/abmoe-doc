# 数据获取

数据获取是任何应用程序的核心部分。下面介绍如何在React和Next. js中获取、缓存和重新验证数据。

## 服务端使用 fetch

Next.js 拓展了原生的 fetch Web API，增加了缓存（caching）和重新验证（ revalidating）功能。可以在：服务端组件、路由处理程序、Server Actions
中搭配 async/await 使用 fetch。举个例子：

``` js
// app/page.js
async function getData() {
  const res = await fetch('https://api.example.com/...') 
  if (!res.ok) {
    // 这会触发最近的 `error.js` 错误边界
    throw new Error('Failed to fetch data')
  }
 
  return res.json()
}
 
export default async function Page() {
  const data = await getData()
 
  return <main></main>
}
```

### 缓存数据

默认情况下，Next.js 会自动缓存服务端 fetch 的返回值，也就是说，数据会在构建或者请求的时候被缓存，后续相同的请求会直接使用缓存中的数据，这有利于提高应用的性能。

``` js
// fetch 的 cache 选项用于控制该请求的缓存行为
// 默认就是 'force-cache', 平时写的时候可以省略
fetch('https://...', { cache: 'force-cache' })
```

注：不仅 GET 请求会被缓存，正常使用 POST 方法的 fetch 请求也会被自动缓存，但在路由处理程序中使用 POST 方法的 fetch 请求不会被缓存。

### 重新验证

有的时候缓存数据会过期，那么该如何更新缓存呢？在 Next.js 中，清除数据缓存并重新获取最新数据的过程就叫做重新验证（Revalidation）。

Next.js 提供了两种方式更新缓存：

一种是基于时间的重新验证（Time-based revalidation），即经过一定时间并有新请求产生后重新验证数据，适用于不经常更改且新鲜度不那么重要的数据。

一种是按需重新验证（On-demand revalidation），根据事件手动重新验证数据。按需重新验证又可以使用基于标签（tag-based）和基于路径（path-based）两种方法重新验证数据。适用于需要尽快展示最新数据的场景。

- 基于时间的重新验证

  使用基于时间的重新验证，你需要在使用 fetch 的时候设置 next.revalidate 选项（以秒为单位）：

  ``` js
  fetch('https://...', { next: { revalidate: 3600 } })
  ```

  或者通过路由段配置项进行配置，使用这种方法，它会重新验证该路由段所有的 fetch 请求。

  ``` js
  // layout.js | page.js
  export const revalidate = 3600
  ```

  注：在一个静态渲染的路由中，如果你有多个请求，每个请求设置了不同的重新验证时间，将会使用最短的时间用于所有的请求。而对于动态渲染的路由，每一个 fetch请求都将独立重新验证。

- 按需重新验证

  使用按需重新验证，在路由处理程序或者 Server Action 中通过路径（ revalidatePath） 或缓存标签 revalidateTag 实现。

  Next.js 有一个路由标签系统，可以跨路由实现多个 fetch 请求重新验证。我们来具体介绍下这个过程：

  - 当你使用 fetch 的时候，可以使用设置一个或者多个标签来标记请求
  - 然后你就可以调用 revalidateTag方法重新验证该标签对应的所有的请求

  举个例子：

  ``` js
  // app/page.js
  export default async function Page() {
    const res = await fetch('https://...', { next: { tags: ['collection'] } })
    const data = await res.json()
    // ...
  }
  ```

  在这个例子中，你为 fetch 请求添加了一个 collection标签。现在，可以在 Server Action 中调用 revalidateTag，就可以让所有带 collection 标签的 fetch 请求重新验证。

  ``` js
  // app/actions.ts
  'use server'
  
  import { revalidateTag } from 'next/cache'
  
  export default async function action() {
    revalidateTag('collection')
  }
  ```

- 错误处理和重新验证
  如果在尝试重新验证的过程中出现错误，缓存会继续提供上一个重新生成的数据，而在下一个后续请求中，Next.js 会尝试再次重新验证数据。

### 退出数据缓存

当 fetch 请求满足这些条件时不会被缓存：

- fetch 请求添加了 cache: 'no-store' 选项
- fetch 请求添加了 revalidate: 0 选项
- fetch 请求在路由处理程序中并使用了 POST 方法
- 使用headers 或 cookies 的方法之后使用 fetch请求
- 配置了路由段选项 const dynamic = 'force-dynamic'
- 配置了路由段选项fetchCache ，默认会跳过缓存
- fetch 请求使用了 Authorization或者 Cookie请求头，并且在组件树中其上方还有一个未缓存的请求

在具体使用的时候，如果你想不缓存某个单独请求：

``` js
// layout.js | page.js
fetch('https://...', { cache: 'no-store' })
不缓存多个请求，可以借助路由段配置项：

// layout.js | page.js
export const dynamic = 'force-dynamic'
```

Next.js 推荐单独配置每个请求的缓存行为，这可以让你更精细化的控制缓存行为。

## 服务端使用三方请求库

也不是所有时候都能使用 fetch 请求，如果你使用了不支持或者暴露 fetch 方法的三方库（如数据库、CMS 或 ORM 客户端），但又想实现数据缓存机制，那可以使用 React 的 cache 函数和路由段配置项来实现请求的缓存和重新验证。

举个例子：

``` js
// app/utils.js
import { cache } from 'react'
 
export const getItem = cache(async (id) => {
  const item = await db.item.findUnique({ id })
  return item
})
```

现在我们调用两次 getItem ：

``` js
// app/item/[id]/layout.js
import { getItem } from '@/utils/get-item'
 
export const revalidate = 3600 // 最多每小时重新验证一次
 
export default async function Layout({ params: { id } }) {
  const item = await getItem(id)
  // ...
}
// app/item/[id]/page.js
import { getItem } from '@/utils/get-item'
 
export const revalidate = 3600 // revalidate the data at most every hour
 
export default async function Page({ params: { id } }) {
  const item = await getItem(id)
  // ...
}
```

在这个例子中，尽管 getItem 被调用两次，但只会产生一次数据库查询。

## 客户端使用路由处理程序
如果你需要在客户端组件中获取数据，可以在客户端调用路由处理程序。路由处理程序会在服务端被执行，然后将数据返回给客户端，适用于不想暴露敏感信息给客户端（比如 API tokens）的场景。

如果你使用的是服务端组件，无须借助路由处理程序，直接获取数据即可。

## 客户端使用三方请求库

你也可以在客户端使用三方的库如 SWR 或 React Query 来获取数据。这些库都有提供自己的 API 实现记忆请求、缓存、重新验证和更改数据。

## 建议与最佳实践

有一些在 React 和 Next.js 中获取数据的建议和最佳实践，本节来介绍一下：

### 尽可能在服务端获取数据
尽可能在服务端获取数据，这样做有很多好处，比如：

- 可以直接访问后端资源（如数据库）
- 防止敏感信息泄漏
- 减少客户端和服务端之间的来回通信，加快响应时间
- ...
  
### 在需要的地方就地获取数据
如果组件树中的多个组件使用相同的数据，无须先全局获取，再通过 props 传递，可以直接在需要的地方使用 fetch 或者 React cache 获取数据，不用担心多次请求造成的性能问题，因为 fetch 请求会自动被记忆化。这也同样适用于布局，毕竟本来父子布局之间也不能传递数据。

### 适当的时候使用 Streaming
Streaming 和 Suspense都是 React 的功能，允许你增量传输内容以及渐进式渲染 UI 单元。页面可以直接渲染部分内容，剩余获取数据的部分会展示加载态，这也意味着用户不需要等到页面完全加载完才能与其交互。

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fserver-rendering-with-streaming.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)


### 串行获取数据

在 React 组件内获取数据时，有两种数据获取模式，并行和串行。

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Fsequential-parallel-data-fetching.png&w=3840&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

所谓串行数据获取，数据请求相互依赖，形成瀑布结构，这种行为有的时候是必要的，但也会导致加载时间更长。

所谓并行数据获取，请求同时发生并加载数据，这会减少加载数据所需的总时间。

我们先说说串行数据获取，直接举个例子：

``` js
// app/artist/page.js
// ...
 
async function Playlists({ artistID }) {
  // 等待 playlists 数据
  const playlists = await getArtistPlaylists(artistID)
 
  return (
    <ul>
      {playlists.map((playlist) => (
        <li key={playlist.id}>{playlist.name}</li>
      ))}
    </ul>
  )
}
 
export default async function Page({ params: { username } }) {
  // 等待 artist 数据
  const artist = await getArtist(username)
 
  return (
    <>
      <h1>{artist.name}</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Playlists artistID={artist.id} />
      </Suspense>
    </>
  )
}
```

在这个例子中，Playlists 组件只有当 Artist 组件获得数据才会开始获取数据，因为 Playlists 组件依赖 artistId 这个 prop。这也很容易理解，毕竟只有先知道了是哪位艺术家，才能获取这位艺术家对应的曲目。

在这种情况下，可以使用 loading.js 或者 React 的 ``<Suspense>`` 组件，展示一个即时加载状态，防止整个路由被数据请求阻塞，而且用户还可以与未被阻塞的部分进行交互。

关于阻塞数据请求：

一种防止出现串行数据请求的方法是在应用程序根部全局获取数据，但这会阻塞其下所有路由段的渲染，直到数据加载完毕。
任何使用 await 的 fetch 请求都会阻塞渲染和下方所有组件的数据请求，除非它们使用了 ``<Suspense>`` 或者 loading.js。另一种替代方式就是使用并行数据请求或者预加载模式。

### 并行数据请求

要实现并行请求数据，可以在使用数据的组件外定义请求，然后在组价内部调用，举个例子：

``` js
import Albums from './albums'

// 组件外定义
async function getArtist(username) {
  const res = await fetch(`https://api.example.com/artist/${username}`)
  return res.json()
}
 
async function getArtistAlbums(username) {
  const res = await fetch(`https://api.example.com/artist/${username}/albums`)
  return res.json()
}
 
export default async function Page({ params: { username } }) {
  // 组件内调用，这里是并行的
  const artistData = getArtist(username)
  const albumsData = getArtistAlbums(username)
 
  // 等待 promise resolve
  const [artist, albums] = await Promise.all([artistData, albumsData])
 
  return (
    <>
      <h1>{artist.name}</h1>
      <Albums list={albums}></Albums>
    </>
  )
}
```

在这个例子中，getArtist 和 getArtistAlbums 函数都是在 Page 组件外定义，然后在 Page 组件内部调用。用户需要等待两个 promise 都 resolve 后才能看到结果。

为了提升用户体验，可以使用 Suspense 组件来分解渲染工作，尽快展示出部分结果。

### 预加载数据

防止出现串行请求的另外一种方式是使用预加载。可以创建一个 preload 函数进一步优化并行数据获取。使用这种方式，你不需要再使用 props 往下传递，举个例子：

``` js
// components/Item.js
import { getItem } from '@/utils/get-item'

export const preload = (id) => {
	void getItem(id)
}

export default async function Item({ id }) {
  const result = await getItem(id)
  // ...
}
// app/item/[id]/page.js
import Item, { preload, checkIsAvailable } from '@/components/Item'
 
export default async function Page({ params: { id } }) {
  // 开始加载 item 数据
  preload(id)
  // 执行另一个异步任务
  const isAvailable = await checkIsAvailable()
 
  return isAvailable ? <Item id={id} /> : null
}
```
### 使用 React cache server-only 和预加载模式

可以将 cache 函数，preload 模式和 server-only 包一起使用，创建一个可在整个应用使用的数据请求工具函数。

``` js
// utils/get-item.js
import { cache } from 'react'
import 'server-only'
 
export const preload = (id) => {
  void getItem(id)
}
 
export const getItem = cache(async (id) => {
  // ...
})
```
使用这种方式，可以快速获取数据、缓存返回结果并保证数据获取只发生在服务端。布局、页面或其他组件可以使用 utils/get-item。

## Server Actions 和数据突变

Server Actions是在服务器上执行的异步函数。它们可以在服务器和客户端组件中使用，以处理 Next.js 应用程序中的表单提交和数据突变。

### 效果概述

Server Actions 是 Next.js 内置的关于服务端数据更改的解决方案。简单的来说，Server Actions 正如它的名字，指的是可以在服务端运行的函数，但它可以在客户端被调用，就像正常的函数一样，而无须手动创建一个 API 路由。

为了更加直观的了解 Server Actions 的应用场景，以表单提交为例。传统我们写一个表单提交，代码大致如下：

``` js
import { FormEvent } from 'react'

export default function Page() {
  async function oSubmit(event) {
    event.preventDefault()

    const formData = new FormDate(event.currentTarget)
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    // ...
  }
  return (
    <form onSubmit={onSubmit}>
      <input type="text" name="name" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

我们首先会创建一个名为 /api/submit的 API 路由，然后用该 API 处理提交的数据，由此实现客户端与服务端通信。

这是使用 Next.js Pages Router 时的解决方案。但是使用 App Routers，借助 Server Actions，实现代码可以改为：

``` js
// page.js
export default function Page({ params }) {
  async function onSubmit() {
    'use server';
    // ...
  }
 
  return (
    <form action={onSubmit}>
      <input type="text" name="name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

无须创建 API 进行交互，直接定义一个 onSubmit 异步函数进行调用即可。不过要注意的是，这次使用的不再是 onSubmit 事件，而是 form 的 action 属性。

回顾一下基础的 HTML 知识，action 属性和 onsubmit 事件都与表单提交行为有关。onsubmit 用于表单提交时执行 JavaScript，一般用于验证数据格式。action 属性表示处理表单提交的 URL，浏览器会将表单数据封装成一个 HTTP 请求，将其发送到 action 属性指定的地址。如果 obsubmit 事件处理程序返回 false，浏览器将取消表单提交，也就不会触发 action 指定地址的数据发送。

``` js
<form action="submit.php" onsubmit="return validateForm()">
  <input type="text" name="username">
  <button type="submit">提交</button>
</form>

<script>
function validateForm() {
  if (/* 验证不通过 */) {
    return false;
  }
  return true;
}
</script>
```

使用 Server Actions 还会带来一个好处，就是因为借助的是 HTML 的 action 属性，这使得即使 JavaScript 没有加载完毕或是禁用 JavaScript，表单依然是可以正常使用的。这就实现了渐进式功能增强。

除此之外，传统开发应用的时候，往往一个路由一个表单，因为提交表单的时候，页面正常会刷新，但使用 Server Action，支持一个路由多个表单，且浏览器不会在提交表单的时候刷新。这样就可以在一次网络请求中实现数据和 UI 更新。

### 开启使用

使用 Server Actions，你需要先通过 experimental 的 serverActions 配置项开启：

``` js
// next.config.js
module.exports = {
  experimental: {
    serverActions: true,
  },
}
```

Next.js v14 以后，Server Actions 默认可用，使用 Next.js v14及以后的版本就不用开启了。

Server Actions 可以在两个地方被定义：

- 使用它的组件内部（仅限服务端组件）
- 在一个单独的文件（客户端组件和服务端组件），目的在于实现复用。你也可以在一个文件里定义多个 Server Action

### 服务端组件中使用

在服务端组件中创建 Server Actions，你需要定义一个异步函数，该函数的函数体顶部使用 "use server"指令。"use server"是为了确保该函数只会在服务端被执行。示例代码如下：

``` js
// app/page.js
export default function ServerComponent() {
  async function myAction() {
    'use server'
    // ...
  }
}
```

要注意：该函数需要使用可序列化的参数以及可序列化的返回值。其原因在服务端组件一节也有讲过，函数返回的结果会被序列化后发送给客户端。

### 客户端组件中使用

如果想在客户端组件中使用 Server Actions，第一种方式是导入。首先在一个单独的文件中创建 Server Action，该文件顶部需要一个 "use server"指令。然后在客户端组件导入该 Server Action，示例如下：

``` js
'use server'
// app/actions.js
export async function myAction() {
  // ...
}
```

注意：当使用这种顶层的 'use server' 指令的时候，下面所有的导出都会被认为是 Server Actions，所以可以在一个文件里定义多个 Server Action。

``` js
'use client'
// app/client-component.jsx
import { myAction } from './actions'
 
export default function ClientComponent() {
  return (
    <form action={myAction}>
      <button type="submit">Add to Cart</button>
    </form>
  )
}
```

第二种方式是作为 props 传递给客户端组件，示例代码如下：

``` js
<ClientComponent updateItem={updateItem} />
'use client'
// app/client-component.jsx
export default function ClientComponent({ updateItem }) {
  return (
    <form action={updateItem}>
      <input type="text" name="name" />
      <button type="submit">Update Item</button>
    </form>
  )
}
```

### 绑定参数

可以使用 bind 方法为 Server Actions 绑定参数。这会创建一个新的 Server Action，其中部分参数被绑定。这个技巧有的时候会很实用，示例如下：

``` js
'use client'
 // app/client-component.jsx
import { updateUser } from './actions'
 
export function UserProfile({ userId }) {
  const updateUserWithId = updateUser.bind(null, userId)
 
  return (
    <form action={updateUserWithId}>
      <input type="text" name="name" />
      <button type="submit">Update User Name</button>
    </form>
  )
}
```

updateUser Server Action 的代码如下：

``` js
'use server'
// app/actions.js
export async function updateUser(userId, formData) {
  // ...
}
```

### 调用
现在我们已经知道如何开启和创建 Server Action 了，而关于如何调用，Server Actions 有三种调用方式：

第一种方式是使用 action，React 的 action prop 支持在 ``<form>`` 元素上调用一个 Server Action。在这里就不举例了，前面的例子都是这种形式。

第二种方式是使用 formAction，React 的 formAction prop 允许在 ``<form>`` 中处理 ``<button>``, ``<input type="submit">``, 和 ``<input type="image">``元素。示例代码如下：

``` js
<form action={handleSubmit}>
    <input type="submit" name="name" formAction={handleName} />
    <button type="submit">Submit</button>
</form>
```

不过说起 formaction，这其实是 HTML5 中的属性，formaction 属性只能作用于具有提交功能的按钮（也就是``<button>``、``<input type="submit">``、``<input type="image">``）。如果通过具有 formaction 属性的按钮提交表单，数据发送的地址会是 formaction 指定的地址而非 form 上的 action 指定的地址。

第三种方式是使用 startTransition，不需要借助 action 或 formAction 属性，而是使用 React 的 startTransition，不过这种方式就不具备渐进式增强的特性了。使用示例代码如下：

``` js
'use client'

import { useTransition } from 'react'
import { addTodo } from '@/actions/addTodo';

export default function CourseComment() {
  let [isPending, startTransition] = useTransition()

  return (
    <button onClick={() => startTransition((text) => { 
      addTodo(text)})
    }>
      Add Todo
    </button>
  )
}
```

### 关于渐进式增强

渐进式增强下，即使没有 JavaScript 或者 JavaScript 被禁用，``<form>`` 依然可以正常运行。这就使得在表单的 JavaScrpt 尚未加载完毕或者加载失败的时候，用户也能与表单交互并提交数据。

React Actions 支持渐进式增强，这又具体分两种情况：

- 如果在服务端组件调用 Server Action，那表单就是可以在没有 JavaScript 的时候正常运行
- 如果在客户端组件调用 Server Action，表单依然是可交互的，但是该 Action 会被放到一个队列中，直到该表单完全可交互（水合）。React 会提高该 action 的优先级，所以它依然会很快发生。

### 大小限制
默认情况下，发送到 Server Action 的请求体最大是 1M 大小，这是为了防止在解析大量数据时消耗过多的服务器资源。

然而，可以通过 serverActionsBodySizeLimit 配置项来修改这个限制。它可以是一个关于字节的数字或是支持字节的任何格式化字符串，，比如 1000, '500kb' 或者是 '3mb'。

``` js
// next.config.js
module.exports = {
  experimental: {
    serverActions: true,
    serverActionsBodySizeLimit: '2mb',
  },
}
```

## 使用常见问题

###  参考示例

Next.js 提供了 forms 与 Server Actions 的示例代码，我们可以通过该命令行创建：

``` shell
npx create-next-app@latest -e next-forms
```

这是该示例代码源码地址，官方也做了对应的视频介绍。

一个基础的示例代码如下：

``` js
// app/page.jsx
export default function Home() {
  async function handleFormAction(formData) {
    'use server';
    const name = formData.get('name');
  }

  return (
    <form action={handleFormAction}>
      <input type="text" name="name" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

从这个例子中，我们看到，使用 Server Actions，我们可以很方便的定义服务端处理函数，也可以很方便的从表单数据中取值。

我们也可以结合 React 的 useFormState hook，当然这个 hook 还在实验中。

``` js
'use client'

import { experimental_useFormState as useFormState } from 'react-dom'

export default function Home() {

  async function createTodo(prevState, formData) {
    return prevState.concat(formData.get('todo'));
  }

  const [state, formAction] = useFormState(createTodo, [])

  return (
    <form action={formAction}>
      <input type="text" name="todo" />
      <button type="submit">Submit</button>
      <p>{state.join(',')}</p>
    </form>
  ) 
}
```

使用 useFormState 的时候要注意，该组件需要在客户端组件中使用。

### 重新验证
Server Actions 允许你按需重新验证数据。可以使用 revalidatePath：

``` js
'use server'
// app/actions.js
import { revalidatePath } from 'next/cache'
 
export default async function submit() {
  await submitForm()
  revalidatePath('/')
}
```

或者使用 revalidateTag：

``` js
'use server'
 // app/actions.js
import { revalidateTag } from 'next/cache'
 
export default async function submit() {
  await addPost()
  revalidateTag('posts')
}
```

### 重定向

如果你希望 Server Action 结束之后重定向到其他路由，可以使用 redirect 到一个相对或者固定地址。

``` js
'use server'
 // app/actions.js
import { redirect } from 'next/navigation'
import { revalidateTag } from 'next/cache'
 
export default async function submit() {
  const id = await addPost()
  revalidateTag('posts') // Update cached posts
  redirect(`/post/${id}`) // Navigate to new route
}
```

### 表单验证

Next.js 推荐基本的表单验证使用 HTML 元素自带的验证如 required、type="email"等。

对于更高阶的服务端数据验证，可以使用 zod 这样的 schema 验证库来验证表单数据的结构：

``` js
// app/actions.js
import { z } from 'zod'
 
const schema = z.object({
  // ...
})
 
export default async function submit(formData) {
  const parsed = schema.parse({
    id: formData.get('id'),
  })
  // ...
}
```

### 显示加载状态

当表单提交数据的时候，可以使用 useFormStatushook 来显示加载状态。useFormStatus hook 只能用于 form 元素的子级。

关于 useFormStatus的具体使用用法，可以参考 React 官方文档中的介绍。

示例代码如下：

``` js
'use client'
// app/submit-button.jsx
import { useFormStatus } from 'react-dom'
 
export function SubmitButton() {
  const { pending } = useFormStatus()
 
  return (
    <button type="submit" aria-disabled={pending}>
      {pending ? 'Adding' : 'Add'}
    </button>
  )
}
<SubmitButton />可以被用在使用 Server Action 的表单中：

// app/page.jsx
import { SubmitButton } from '@/app/submit-button'
 
export default async function Home() {
  return (
    <form action={...}>
      <input type="text" name="field-name" />
      <SubmitButton />
    </form>
  )
}
```

### 错误处理

Server Action 可以返回可序列化的对象。举个例子，当一个条目创建失败，你需要处理这个错误：

``` js
'use server'
// app/actions.js
export async function createTodo(prevState, formData) {
  try {
    await createItem(formData.get('todo'))
    return revalidatePath('/')
  } catch (e) {
    return { message: 'Failed to create' }
  }
}
```

然后你就可以在客户端组件中，读取这个值并显示这个错误信息：

``` js
'use client'
// app/add-form.jsx
import { useFormState, useFormStatus } from 'react-dom'
import { createTodo } from '@/app/actions'
 
const initialState = {
  message: null,
}
 
function SubmitButton() {
  const { pending } = useFormStatus()
 
  return (
    <button type="submit" aria-disabled={pending}>
      Add
    </button>
  )
}
 
export function AddForm() {
  const [state, formAction] = useFormState(createTodo, initialState)
 
  return (
    <form action={formAction}>
      <label htmlFor="todo">Enter Task</label>
      <input type="text" id="todo" name="todo" required />
      <SubmitButton />
      <p aria-live="polite" className="sr-only">
        {state?.message}
      </p>
    </form>
  )
}
```

当然你也可以结合 error.jsx 展示错误时的 UI：

``` js
'use client'
// error.jsx
export default function Error() {
  return (
    <h2>error</h2>
  )
}
// page.jsx
import { experimental_useFormState as useFormState } from 'react-dom'

function AddForm() {
  async function serverActionWithError() {
    'use server';   
    throw new Error(`This is error is in the Server Action`);
  }

  return (
    <form action={serverActionWithError}>
      <button type="submit">Submit</button>
    </form>
  ) 
}

export default AddForm
```

这样当 Server Action 发生错误的时候，就会展示错误 UI。

### 乐观更新

所谓乐观更新，举个例子，当用户点击一个点赞按钮的时候，传统的做法是等待接口返回成功时再更新 UI，乐观更新是先更新 UI，同时发送数据请求，至于数据请求后的错误处理，则根据自己的需要自定义实现。

React 提供了 useOptimistic 这个 hook，结合 Server Actions 使用的示例代码如下：

``` js
'use client'
// app/page.jsx
import { experimental_useOptimistic as useOptimistic } from 'react'
import { send } from './actions'
 
export function Thread({ messages }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage) => [...state, { message: newMessage }]
  )
 
  return (
    <div>
      {optimisticMessages.map((m) => (
        <div>{m.message}</div>
      ))}
      <form
        action={async (formData) => {
          const message = formData.get('message')
          addOptimisticMessage(message)
          await send(message)
        }}
      >
        <input type="text" name="message" />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
```

### 设置 Cookies

可以在 Server Action 中使用 cookies 函数设置 cookie：

``` js
'use server'
// app/actions.js
import { cookies } from 'next/headers'
 
export async function create() {
  const cart = await createCart()
  cookies().set('cartId', cart.id)
}
```

### 读取 Cookies

依然是使用 cookies 函数：

``` js
'use server'
// app/actions.js
import { cookies } from 'next/headers'
 
export async function read() {
  const auth = cookies().get('authorization')?.value
  // ...
}
```

### 删除 Cookies

还是使用 cookies 函数：

``` js
'use server'
// app/actions.js
import { cookies } from 'next/headers'
 
export async function delete() {
  cookies().delete('name')
  // ...
}
```