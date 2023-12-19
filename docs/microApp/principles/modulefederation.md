# Module Federation

## 方案简述

webpack5给出的定义是：多个独立的构建可以形成一个应用程序。这些独立的构建不会相互依赖，因此可以单独开发和部署它们。这通常被称为微前端，但并不仅限于此。

简而言之，Module Federation提供了能在当前应用中远程加载其他服务器上应用的能力。

## 基本概念

- Container
  
  一个使用 ModuleFederationPlugin 构建的应用就是一个 Container，它可以加载其他的 Container，也可以被其他的 Container 加载。

- Host&Remote
  
  从消费者和生产者的角度看 Container，Container 可以分为 Host 和 Remote，Host 作为消费者，他可以动态加载并运行其他 Remote 的代码，Remote 作为提供方，他可以暴露出一些属性、方法或组件供 Host 使用，这里要注意的一点是一个 Container 既可以作为 Host 也可以作为 Remote。

- Shared

  shared 表示共享依赖，一个应用可以将自己的依赖共享出去，比如 react、react-dom、mobx等，其他的应用可以直接使用共享作用域中的依赖从而减少应用的体积。

## 插件配置

配置示例

``` js
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

module.exports = {
  // 其他webpack配置...
  plugins: [
    new ModuleFederationPlugin({
        name: 'empBase',
        library: { type: 'var', name: 'empBase' },
        filename: 'emp.js',
        remotes: {
          app_two: "app_two_remote",
          app_three: "app_three_remote"
        },
        exposes: {
          './Component1': 'src/components/Component1',
          './Component2': 'src/components/Component2',
        },
        shared: ["react", "react-dom","react-router-dom"]
      })
  ]
}
```

| 字段名   | 类型   | 含义                                                                   |
| -------- | ------ | ---------------------------------------------------------------------- |
| name     | string | 必传值，即输出的模块名，被远程引用时路径为${name}/${expose}            |
| library  | object | 声明全局变量的方式，name为umd的name                                    |
| filename | string | 构建输出的文件名                                                       |
| remotes  | object | 远程引用的应用名及其别名的映射，使用时以key值作为name                  |
| exposes  | object | 被远程引用时可暴露的资源路径及其别名                                   |
| shared   | object | 与其他应用之间可以共享的第三方依赖，使你的代码中不用重复加载同一份依赖 |

## 使用示例

见官方demo：https://github.com/module-federation/module-federation-examples/tree/master/different-react-versions-16-18

## 构建解析

### 动态远程容器

该容器接口支持 get 和 init 方法。 init 是一个兼容 async 的方法，调用时，只含有一个参数：共享作用域对象(shared scope object)。此对象在远程容器中用作共享作用域，并由 host 提供的模块填充。 可以利用它在运行时动态地将远程容器连接到 host 容器。

``` js
(async () => {
  // 初始化共享作用域（shared scope）用提供的已知此构建和所有远程的模块填充它
  await __webpack_init_sharing__('default');
  const container = window.someContainer; // 或从其他地方获取容器
  // 初始化容器 它可能提供共享模块
  await container.init(__webpack_share_scopes__.default);
  const module = await container.get('./module');
})();
```

### 构建后的代码

exposes暴露组件

```js
// 通过exposes生成的模块集合
var moduleMap = {
	"./components/Comonpnent1": function() {
		return Promise.all([__webpack_require__.e("webpack_sharing_consume_default_react_react"), __webpack_require__.e("src_components_Close_index_tsx")]).then(function() { return function() { return (__webpack_require__(16499)); }; });
	},
};
// ost通过该函数，可以拿到remote中的组件
var get = function(module, getScope) {
	__webpack_require__.R = getScope;
	getScope = (
		__webpack_require__.o(moduleMap, module)
			? moduleMap[module]()
			: Promise.resolve().then(function() {
				throw new Error('Module "' + module + '" does not exist in container.');
			})
	);
	__webpack_require__.R = undefined;
	return getScope;
};
// host通过该函数将依赖注入remote中
var init = function(shareScope, initScope) {
	if (!__webpack_require__.S) return;
	var oldScope = __webpack_require__.S["default"];
	var name = "default"
	if(oldScope && oldScope !== shareScope) throw new Error("Container initialization failed as it has already been initialized with a different share scope");
	__webpack_require__.S[name] = shareScope;
	return __webpack_require__.I(name, initScope);
}
```

可以看到，代码中包括三个部分：

- moduleMap：通过exposes生成的模块集合
- get: host通过该函数，可以拿到remote中的组件
- init：host通过该函数将依赖注入remote中

## 注意事项
