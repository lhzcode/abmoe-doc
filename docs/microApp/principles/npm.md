# NPM

## 方案简述

该方案将微应用打包成npm包，在主应用中引入和使用，需要了解模块化和构建相关的知识。

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/npm-solution.png)

NPM 的微前端设计方案上图所示，微应用 A / B / C 可以采用不同的技术栈，但是构建时需要像发布业务组件一样输出 ES5 & 模块化标准的 JavaScript 库，从而使主应用安装各自的依赖时，可以通过模块化的方式引入微应用。

## 模块化

随着我们的应用越来越大，我们想要将其拆分成多个文件，即所谓的“模块（module）”。一个模块可以包含用于特定目的的类或函数库。

很长一段时间，JavaScript 都没有语言级（language-level）的模块语法。这不是一个问题，因为最初的脚本又小又简单，所以没必要将其模块化。

但是最终脚本变得越来越复杂，因此社区发明了许多种方法来将代码组织到模块中，使用特殊的库按需加载模块。

### CJS

CommonJS 方案，它通过 require 来引入模块，通过 module.exports 定义模块的输出接口。这种模块加载方案是服务器端的解决方案，它是以同步的方式来引入模块的，因为在服务端文件都存储在本地磁盘，所以读取非常快，所以以同步的方式加载没有问题。但如果是在浏览器端，由于模块的加载是使用网络请求，因此使用异步加载的方式更加合适。

### AMD

采用异步加载的方式来加载模块，模块的加载不影响后面语句的执行，所有依赖这个模块的语句都定义在一个回调函数里，等到加载完成后再执行回调函数。require.js 实现了 AMD 规范。

### CMD

这种方案和 AMD 方案都是为了解决异步模块加载的问题，sea.js 实现了 CMD 规范。它和 require.js的区别在于模块定义时对依赖的处理不同和对依赖模块的执行时机的处理不同。

### ESM

ES6 提出的方案，使用 import 和 export 的形式来导入导出模块。这种方案和上面三种方案都不同。

**AMD和CMD的区别**

它们之间的主要区别有两个方面。

（1）第一个方面是在模块定义时对依赖的处理不同。AMD 推崇依赖前置，在定义模块的时候就要声明其依赖的模块。而 CMD 推崇 就近依赖，只有在用到某个模块的时候再去 require。

（2）第二个方面是对依赖模块的执行时机处理不同。首先 AMD 和 CMD 对于模块的加载方式都是异步加载，不过它们的区别在于 模块的执行时机，AMD 在依赖模块加载完成后就直接执行依赖模块，依赖模块的执行顺序和我们书写的顺序不一定一致。而 CMD 在依赖模块加载完成后并不执行，只是下载而已，等到所有的依赖模块都加载好后，进入回调函数逻辑，遇到 require 语句 的时候才执行对应的模块，这样模块的执行顺序就和我们书写的顺序保持一致了。

**ES6 模块与 CommonJS 模块、AMD、CMD 的差异**

1. CommonJS 模块输出的是一个值的拷贝，ES6 模块输出的是值的引用。CommonJS 模块输出的是值的拷贝，也就是说，一旦输出一个值，模块内部的变化就影响不到这个值。ES6 模块的运行机制与 CommonJS 不一样。JS 引擎对脚本静态分析的时候，遇到模块加载命令 import，就会生成一个只读引用。等到脚本真正执行时，再根据这个只读引用，到被加载的那个模块里面去取值。

2. CommonJS 模块是运行时加载，ES6 模块是编译时输出接口。CommonJS 模块就是对象，即在输入时是先加载整个模块，生成一个对象，然后再从这个对象上面读取方法，这种加载称为“运行时加载”。而 ES6 模块不是对象，它的对外接口只是一种静态定义，在代码静态解析阶段就会生成。

## 构建工具

应用的开发态可以直接在浏览器中使用 ES Modules 规范，但是生产态需要生成浏览器兼容性更好的 ES5 脚本，为此需要通过构建工具将多个 ES Modules 打包成兼容浏览器的 ES5 脚本。

当然，除了应用开发需要使用构建工具，在业务组件的开发中也需要使用构建工具，需要注意的是两者的构建是有差异的，应用的构建需要生成 HTML 文件并打包 JS、CSS 以及图片等静态资源，业务组件的构建更多的是打包成应用需要通过模块化方式引入使用的 JavaScript 库。

业务组件的设计是一种通用的库包建设，当开发完一个版本之后，通常会发布成 NPM 包。应用在构建时为了提升构建速度，同时也为了简化构建配置，通常在使用 babel-loader （转译工具）进行转译时 ， 会屏蔽 node_modules 目录下的 NPM 包，因此需要将发布的 NPM 组件转译成大多数浏览器能够兼容的 ES5 标准

## 注意事项

### peerDependencies

在微应用开发阶段，需要注意如果和主应用共用相同的依赖，可以通过在package.json中添加peerDependencies配置减少重复安装。

``` json
{
  "peerDependencies": {
    "node-sass": "^4.0.0"
  }
}
```

### externals

如果多个微应用有相同依赖，且主应用也有该依赖，例如：lodash。可以在打包时添加externals选项，将改依赖外部化，在打包时不会将该依赖打包到代码中。这个依赖在开发生产环境中必须存在且可用。

``` js
  const path = require('path');

  module.exports = {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'webpack-numbers.js',
      library: {
        name: "webpackNumbers",
        type: "umd"
      },
    },
   externals: { // [!code ++]
     lodash: { // [!code ++]
       commonjs: 'lodash', // [!code ++]
       commonjs2: 'lodash', // [!code ++]
       amd: 'lodash', // [!code ++]
       root: '_', // [!code ++]
     }, // [!code ++]
   }, // [!code ++]
  };
```

### 解决冲突

微应用全局变量、CSS样式和存储数据之间有可能存在冲突。需要手动解决冲突。例如使用Proxy代理window、localStorage、sessionStorage变量，样式内联到JS中等。

``` javascript
// vue.config.js
const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  // 内联 CSS 样式处理
  css: { extract: false }
});
```

### library

微应用构建产物需要配置output.library.type选项，这里我们考虑兼容性选择构建成ES5 标准的 CommonJS 规范。当然如果实际情况支持也可以构建成 UMD 和 ES Modules 规范。

``` javascript
{
  output: {
    // ...
    // 老版本 Webpack 可以使用 libraryTarget 生成 CommonJS 规范
    // libraryTarget: "commonjs",
    library: {
      type: 'commonjs'
    }
  }
}
```

### 代码分隔

由于构建的是库包，不需要进行代码分隔和静态资源分离。资源需要内联到JS当中

``` javascript
// webpack.config.js
const path = require('path');

module.exports = {z
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    assetModuleFilename: 'images/[hash][ext][query]' // [!code --]
  },
  module: {
    rules: [
      {
       test: /\.png/, // [!code --]
       type: 'asset/resource' // [!code --]
       test: /\.svg/, // [!code ++]
       type: 'asset/inline' // [!code ++]
     },// [!code --]
     }
     { // [!code --]
       test: /\.html/, // [!code --]
       type: 'asset/resource', // [!code --]
       generator: { // [!code --]
         filename: 'static/[hash][ext][query]' // [!code --]
       } // [!code --]
     } // [!code --]
    ]
  }
};
```
所有 .svg 文件都将作为 data URI 注入到 bundle 中。

``` javascript
 // src/index.js
 import mainImage from './images/main.png'; // [!code --]
 import metroMap from './images/metro.svg'; // [!code ++]

 img.src = mainImage; // '/dist/151cfcfa1bd74779aadb.png' // [!code --]
 block.style.background = `url(${metroMap})`; // url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDo...vc3ZnPgo=) // [!code ++]
```

### 构建部署

微应用发布后，主应用需要重新安装依赖并重新构建部署。

## 示例

### 基座应用

``` javascript
// main/index.js 主应用
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ReactApp from "./React";
import VueApp from "./Vue";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "react",
        element: <ReactApp />,
      },
      {
        path: "vue",
        element: <VueApp />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);
```

``` javascript
// ./React React微应用初始化
const { mount, unmount } = require("react-micro-app");
import React, { useEffect } from "react";

const containerId = 'react-app';

function ReactApp() {
  useEffect(() => {
    mount(containerId);
    return () => {
      unmount();
    };
  }, []);
  return <div id={containerId}></div>;
}

export default React.memo(ReactApp);
```

``` javascript
// ./Vue Vue微应用初始化
import React, { useEffect } from "react";
const { mount, unmount } = require('vue-micro-app')

const containerId = 'vue-app';

function VueApp() {
  useEffect(() => {
    mount(containerId);
    return () => {
      unmount();
    };
  }, []);
  return <div id={containerId} style={{ textAlign: "center" }}></div>;
}

export default VueApp;
```
### React微应用

``` javascript
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

let root;

export function mount(containerId) {
  console.log("react app mount");
  root = ReactDOM.createRoot(document.getElementById(containerId));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export function unmount() {
  console.log("react app unmount: ", root);
  root && root.unmount();
}
```

### Vue微应用

``` javascript
import { createApp } from "vue";
import App from "./App.vue";
let app;

export function mount(containerId) {
  console.log("vue app mount");
  app = createApp(App);
  app.mount(`#${containerId}`);
}

export function unmount() {
  console.log("vue app unmount: ", app);
  app && app.unmount();
}
```