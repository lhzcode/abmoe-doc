# API路由

路由处理程序是指使用 Web 请求 和 响应 API 对于给定的路由自定义处理逻辑。

## 规范约定

路由处理程序在 app 目录内的 route.js|ts 文件中定义。

路由处理程序可以嵌套在 app 目录中，类似于 page.js 和 layout.js 。但在与 page.js 相同的路线段级别上不能存在 route.js 文件。

![](https://nextjs.org/_next/image?url=%2Fdocs%2Flight%2Froute-special-file.png&w=1920&q=75&dpl=dpl_D8FSJkm5fGY8PYCjNmfLdsHxEyk8)

## GET 请求
一个基本的 GET 请求处理程序示例代码如下：

``` js
// app/api/route.js
import { NextResponse } from 'next/server'
 
export async function GET() {
  const res = await fetch('https://data.mongodb-api/...')
  const data = await res.json()
 
  return NextResponse.json({ data })
}
```

在这个例子中：

- 我们 export 一个名为 GET 的 async 函数来定义 GET 请求处理，在同一文件还可以 export 其他请求方法。

- 我们使用了 next/server 的 NextResponse 对象用于设置响应内容，但其实这里也不一定非要用 NextResponse，直接使用 Response 也是可以的。（把 NextResponse.json({ data }) 改为 Response.json({ data }) 也可以正常运行）

- NextResponse 是 Next.js 基于 Response 的封装，它对 TypeScript 更加友好，同时提供了更为方便的用法，比如获取 Cookie 等。

### 支持方法

Next.js 支持 GET、POST、PUT、PATCH、DELETE、HEAD 和 OPTIONS 这些 HTTP 请求方法。如果传入了不支持的请求方法，Next.js 会返回 405 Method Not Allowed。

### 参数

每个请求方法的处理函数会被传入两个参数，一个 request，一个 context 。两个参数都是可选的。

``` js
export async function GET(request, context) {}
```

- request (optional)
    其中 request 对象是一个 NextRequest 对象，它是基于 Web Request API 的扩展。使用 request ，你可以快捷读取 cookies 和处理 URL。

  ``` js
  export async function GET(request, context) {
    //  访问 /home, pathname 的值为 /home
    const pathname = request.nextUrl.pathname
    // 访问 /home?name=lee, searchParams 的值为 { 'name': 'lee' }
    const searchParams = request.nextUrl.searchParams
  }
  ```

  其中 nextUrl 是基于 Web URL API 的扩展（如果你想获取其他值，参考 URL API），同样提供了一些方便使用的方法。

- context (optional)
  目前context 只有一个值就是 params，它是一个包含当前动态路由参数的对象。举个例子：
  
  ``` js
  // app/dashboard/[team]/route.js
  export async function GET(request, { params }) {
    const team = params.team
  }
  ```

  当访问 /dashboard/1 时，params 的值为 { team: '1' }。其他情况还有：

  | Example                        | URL          | params                  |
  | ------------------------------ | ------------ | ----------------------- |
  | ``app/dashboard/[team]/route.js``  | ``/dashboard/1`` | ``{ team: '1' }``           |
  | ``app/shop/[tag]/[item]/route.js`` | ``/shop/1/2``    | ``{ tag: '1', item: '2' }`` |
  | ``app/blog/[...slug]/route.js``    | ``/blog/1/2``    | ``{ slug: ['1', '2'] }``    |

  注意第二行：此时 params 返回了当前链接所有的动态路由参数。

- 缓存
  - 默认缓存
    使用 Response 对象的 GET 请求的返回结果默认会被缓存：

    ``` js
    // app/items/route.js
    export async function GET() {
      const res = await fetch('https://data.mongodb-api.com/...', {
        headers: {
          'Content-Type': 'application/json',
          'API-Key': process.env.DATA_API_KEY,
        },
      })
      const data = await res.json()
    
      return Response.json({ data })
    }
    ```

    也就是说，当下次再访问该 GET 请求时，会直接使用缓存中的结果，而非重新请求数据源。

  - 退出缓存
    但是这些情况下会退出缓存：

    - 使用 Request 对象的 GET 请求，示例如下：

    ``` js
    // app/products/api/route.js
    export async function GET(request) {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      const res = await fetch(`https://data.mongodb-api.com/product/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'API-Key': process.env.DATA_API_KEY,
        },
      })
      const product = await res.json()
    
      return Response.json({ product })
    }
    ```

    - 使用其他 HTTP 方法，比如 POST：

    ``` js
    // app/items/route.js
    export async function POST() {
      const res = await fetch('https://data.mongodb-api.com/...', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Key': process.env.DATA_API_KEY,
        },
        body: JSON.stringify({ time: new Date().toISOString() }),
      })
    
      const data = await res.json()
    
      return Response.json(data)
    }
    ```

    - 使用如 cookies、headers 这样的动态函数：

    ``` js
    // app/api/route.js
    import { cookies } from 'next/headers'
    
    export async function GET(request) {
      const cookieStore = cookies()
      const token = cookieStore.get('token')
    
      return new Response('Hello, Next.js!', {
        status: 200,
        headers: { 'Set-Cookie': `token=${token}` },
      })
    }
    ```

    - 使用基于底层 Web API 的抽象来读取 cookie （NextRequest）也会导致退出缓存：

    ``` js
    // app/api/route.js
    export async function GET(request) {
      const token = request.cookies.get('token')
    }
    ```

    - 路由段配置项中声明了动态模式：

    ``` js
    // app/api/route.js
    export const dynamic = 'force-dynamic'
    ```


  - 重新验证
    - 缓存的时候，缓存的时效也是可以设置的，使用 next.revalidate 选项：

    ``` js
    // app/items/route.js
    export async function GET() {
      const res = await fetch('https://data.mongodb-api.com/...', {
        next: { revalidate: 60 }, //  每 60 秒重新验证
      })
      const data = await res.json()
    
      return Response.json(data)
    }
    ```

    - 或者使用路由段配置选项：

    ``` js
    // app/items/route.js
    export const revalidate = 60
    ```

## 常见问题

### 获取查询参数

``` js
// app/api/search/route.js
// 访问 /api/search?query=hello
export function GET(request) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query') // query
}
```

### 处理 Cookie

- 第一种方法是通过 NextRequest对象：

  ``` js
  // app/api/route.js
  export async function GET(request) {
    const token = request.cookies.get('token')
    request.cookies.set(`token2`, 123)
  }
  ```

  在这个例子中，request 就是一个 NextRequest 对象。正如上节所说，NextRequest 相比 Request 提供了更为方便的用法，这就是一个例子。此外，虽然我们使用 set 设置了 cookie，但设置的是请求的 cookie，并没有设置响应的 cookie。

- 第二种方法是通过next/headers包提供的 cookies方法。

  因为 cookies 实例只读，如果你要设置 Cookie，你需要返回一个使用 Set-Cookie header 的 Response 实例。使用示例如下：

  ``` js
  // app/api/route.js
  import { cookies } from 'next/headers'
  
  export async function GET(request) {
    const cookieStore = cookies()
    const token = cookieStore.get('token')
  
    return new Response('Hello, Next.js!', {
      status: 200,
      headers: { 'Set-Cookie': `token=${token}` },
    })
  }
  ```

### 处理 Headers

- 第一种方法是通过 NextRequest对象：

  ``` js
  // app/api/route.js
  export async function GET(request) {
    const headersList = new Headers(request.headers)
    const referer = headersList.get('referer')
  }
  ```

- 第二种方法是next/headers包提供的 headers 方法。

  因为 headers 实例只读，如果你要设置 headers，你需要返回一个使用了新 header 的 Response 实例。使用示例如下：

  ``` js
  // app/api/route.js
  import { headers } from 'next/headers'
  
  export async function GET(request) {
    const headersList = headers()
    const referer = headersList.get('referer')
  
    return new Response('Hello, Next.js!', {
      status: 200,
      headers: { referer: referer },
    })
  }
  ```

### 重定向

重定向使用 next/navigation 提供的 redirect 方法，示例如下：

``` js
import { redirect } from 'next/navigation'
 
export async function GET(request) {
  redirect('https://nextjs.org/')
}
```

### 获取请求体内容

``` js
// app/items/route.js 
import { NextResponse } from 'next/server'
 
export async function POST(request) {
  const res = await request.json()
  return NextResponse.json({ res })
}
```

如果请求正文是 FormData 类型：

``` js
// app/items/route.js
import { NextResponse } from 'next/server'
 
export async function POST(request) {
  const formData = await request.formData()
  const name = formData.get('name')
  const email = formData.get('email')
  return NextResponse.json({ name, email })
}
```
### CORS 设置

``` js
// app/api/route.ts
export async function GET(request) {
  return new Response('Hello, Next.js!', {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

### 响应无 UI 内容
你可以返回无 UI 的内容。在这个例子中，访问 /rss.xml的时候，会返回 XML 结构的内容：

``` js
// app/rss.xml/route.ts
export async function GET() {
  return new Response(`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
 
<channel>
  <title>Next.js Documentation</title>
  <link>https://nextjs.org/docs</link>
  <description>The React Framework for the Web</description>
</channel>
 
</rss>`)
}
```

注：sitemap.xml、robots.txt、app icons 和 open graph images 这些特殊的文件，Next.js 都已经提供了内置支持，在Metadata中有相应的api。

### Streaming

openai 的打字效果背后用的就是流：

``` js
// app/api/chat/route.js
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
 
export const runtime = 'edge'
 
export async function POST(req) {
  const { messages } = await req.json()
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages,
  })
 
  const stream = OpenAIStream(response)
 
  return new StreamingTextResponse(stream)
}
```

当然也可以直接使用底层的 Web API 实现 Streaming：

``` js
// app/api/route.js
// https://developer.mozilla.org/docs/Web/API/ReadableStream#convert_async_iterator_to_stream
function iteratorToStream(iterator) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next()
 
      if (done) {
        controller.close()
      } else {
        controller.enqueue(value)
      }
    },
  })
}
 
function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
 
const encoder = new TextEncoder()
 
async function* makeIterator() {
  yield encoder.encode('<p>One</p>')
  await sleep(200)
  yield encoder.encode('<p>Two</p>')
  await sleep(200)
  yield encoder.encode('<p>Three</p>')
}
 
export async function GET() {
  const iterator = makeIterator()
  const stream = iteratorToStream(iterator)
 
  return new Response(stream)
}
```

## 中间件（Middleware）

中间件允许你在请求完成之前运行代码。你可以基于传入的请求，重写、重定向、修改请求或响应头，亦或者直接响应。一个比较常见的应用就是鉴权。比如判断用户是否登录，如果未登录，则跳转到登录页面。

### 定义中间件

写中间件，你需要在项目的根目录（和 pages 或 app 同级或者如果有 src 的话，在 src 一级目录下）定义一个名为 middleware.js的文件。

``` js
// middleware.js
import { NextResponse } from 'next/server'
 
// 中间件可以是 async 函数，如果使用了 await
export function middleware(request) {
  return NextResponse.redirect(new URL('/home', request.url))
}

// 设置匹配路径
export const config = {
  matcher: '/about/:path*',
}
```
### 执行顺序

项目里的每个路由都会调用中间件。此外，因为在 Next.js 中有很多地方都可以设置路由的响应，所以要注意执行顺序：

- headers（next.config.js）
- redirects（next.config.js）
- 中间件 (rewrites, redirects 等)
- beforeFiles (next.config.js中的rewrites)
- 基于文件系统的路由 (public/, _next/static/, pages/, app/ 等)
- afterFiles (next.config.js中的rewrites)
- 动态路由 ``(/blog/[slug])``
- fallback中的 (next.config.js中的rewrites)

### 指定匹配路径

有两种方式可以指定中间件匹配的路径：

- 第一种是使用 matcher配置项，使用示例如下：

  ``` js
  // middleware.js
  export const config = {
    matcher: '/about/:path*',
  }
  ```

  matcher 支持数组形式，用于匹配多个路径

  ``` js
  // middleware.js
  export const config = {
    matcher: ['/about/:path*', '/dashboard/:path*'],
  }
  ``` 

  matcher支持正则表达式。举个例子：

  ``` js
  export const config = {
    matcher: [
      /*
      * 匹配所有的路径除了以这些作为开头的：
      * - api (API routes)
      * - _next/static (static files)
      * - _next/image (image optimization files)
      * - favicon.ico (favicon file)
      */
      '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
  }
  ```

  matcher 的值必须是常量，这样可以在构建的时候被静态分析。使用变量之类的动态值会被忽略。


  注意：
  - 路径必须以 /开头
  - 支持使用命名参数(named parameters)，比如/about/:path匹配 /about/a和 /about/b，但是不匹配 /about/a/c。
  - 命名参数可以使用修饰符，比如 /about/:path*匹配 /about/a/b/c因为 * 表示 0 个或 1 个或多个，?表示 0 个或 1 个，+表示 1 个或多个
  - 也可以使用标准的正则表达式替代， /about/(.*) 等同于 /about/:path*

- 第二种方法是使用条件语句：

  ``` js
  // middleware.js
  import { NextResponse } from 'next/server'
  
  export function middleware(request) {
    if (request.nextUrl.pathname.startsWith('/about')) {
      return NextResponse.rewrite(new URL('/about-2', request.url))
    }
  
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.rewrite(new URL('/dashboard/user', request.url))
    }
  }
  ```

### 处理 Cookie

Cookies 是常见的 headers。在请求中，它们存在 header 中的 Cookie 字段，在响应中，它们存在 header 中的 Set-Cookie 字段。

Next.js 提供了 NextRequest 和 NextResponse 便捷的方式获取和处理 cookies。

对于传入的请求，NextRequest 提供了 get、getAll、set和 delete方法处理 cookies，你也可以用 has检查 cookie 或者 clear删除所有的 cookies。

对于返回的响应，NextResponse 同样提供了 get、getAll、set和 delete方法处理 cookies。

``` js
import { NextResponse } from 'next/server'
 
export function middleware(request) {
  // 假设传入的请求 header 里 "Cookie:nextjs=fast"
  let cookie = request.cookies.get('nextjs')
  console.log(cookie) // => { name: 'nextjs', value: 'fast', Path: '/' }
  const allCookies = request.cookies.getAll()
  console.log(allCookies) // => [{ name: 'nextjs', value: 'fast' }]
 
  request.cookies.has('nextjs') // => true
  request.cookies.delete('nextjs')
  request.cookies.has('nextjs') // => false
 
  // 设置 cookies
  const response = NextResponse.next()
  response.cookies.set('vercel', 'fast')
  response.cookies.set({
    name: 'vercel',
    value: 'fast',
    path: '/',
  })
  cookie = response.cookies.get('vercel')
  console.log(cookie) // => { name: 'vercel', value: 'fast', Path: '/' }
  
  // 响应 header 为 `Set-Cookie:vercel=fast;path=/test`
  return response
}
```

### 处理 headers

你可以使用 NextResponse API 设置请求标头和响应标头。（自 Next.js v13.0.0 起可用）

``` js
// middleware.js 
import { NextResponse } from 'next/server'
 
export function middleware(request) {
  //  clone 请求标头
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hello-from-middleware1', 'hello')
 
  // 你也可以在 NextResponse.rewrite 中设置请求标头
  const response = NextResponse.next({
    request: {
      // 设置新请求标头
      headers: requestHeaders,
    },
  })
 
  // 设置新响应标头 `x-hello-from-middleware2`
  response.headers.set('x-hello-from-middleware2', 'hello')
  return response
}
```

### 返回响应
你可以通过返回一个 Response 或者 NextResponse 实例在中间件里直接响应请求。（自 Next.js v13.1.0 起可用）

``` js
// middleware.js
import { NextResponse } from 'next/server'
import { isAuthenticated } from '@lib/auth'
 
// 限制中间件的路径以 `/api/` 开头
export const config = {
  matcher: '/api/:function*',
}
 
export function middleware(request) {
  // 调用认证函数检查请求
  if (!isAuthenticated(request)) {
    // 返回一端带有错误信息的 JSON 数据
    return new NextResponse(
      JSON.stringify({ success: false, message: 'authentication failed' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    )
  }
}
```

### 高级中间件标记（Advanced Middleware Flags）
Next.js v13.1 为中间件加入了两个新的标记，skipMiddlewareUrlNormalize和skipTrailingSlashRedirect，用来处理一些特殊的情况。

- skipTrailingSlashRedirect

  Trailing Slashes 指的是放在 URL 末尾的正斜杠，一般来说，尾部斜杠用于区分目录还是文件，有尾部斜杠，表示目录，没有尾部斜杠，表示文件。

  通常我们都会做重定向。比如你在 Next.js 中访问 /about/它会自动重定向到 /about，URL 也会变为 /about。

  然而当你设置 skipTrailingSlashRedirect后，再访问 /about/，URL 依然是 /about/。

  skipTrailingSlashRedirect的具使用示例代码如下：

  ``` js
  // next.config.js
  module.exports = {
    skipTrailingSlashRedirect: true,
  }
  // middleware.js
  const legacyPrefixes = ['/docs', '/blog']
  
  export default async function middleware(req) {
    const { pathname } = req.nextUrl
  
    if (legacyPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next()
    }
  
    // 应用尾部斜杠
    if (
      !pathname.endsWith('/') &&
      !pathname.match(/((?!\.well-known(?:\/.*)?)(?:[^/]+\/)*[^/]+\.\w+)/)
    ) {
      req.nextUrl.pathname += '/'
      return NextResponse.redirect(req.nextUrl)
    }
  }
  ```

- skipMiddlewareUrlNormalize
  
  关于 skipMiddlewareUrlNormalize，让我们直接看一个例子：

  ``` js
  // next.config.js
  module.exports = {
    skipMiddlewareUrlNormalize: true,
  }
  // middleware.js
  export default async function middleware(req) {
    const { pathname } = req.nextUrl
  
    // GET /_next/data/build-id/hello.json
  
    console.log(pathname)
    // 如果有此 flag 值为 /_next/data/build-id/hello.json
    // 没有此 flag 值为 /hello
  }
  ```

  有的时候，你可能需要使用原始的 URL 进行判断。