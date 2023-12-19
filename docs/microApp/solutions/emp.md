# Emp

EMP 方案是基于 webpack 5 module federation 的微前端方案。

## 应用加载方式

### module federation

使用基于module federation配置扩展的empShare配置

``` js
module.exports={
   empShare: {
    name: 'microApp',
    remotes: {
      '@microHost': `microHost@http://localhost:8001/emp.js`,
    },
    exposes: {
      './App': './src/App',
    },
    // 实现 Module Feration 与 shareLib 只能保留一个
    shared: {
      react: {requiredVersion: '^17.0.1'},
      'react-dom': {requiredVersion: '^17.0.1'},
    },
    // 实现 emp share 的 三级共享模式 与 shared 只能保留一个,地址可以自行判断
    shareLib: {
      react: 'React@https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.development.js',
      'react-dom': 'ReactDOM@https://cdn.jsdelivr.net/npm/react-dom@17.0.2/umd/react-dom.development.js',
    }
   },
}
```

### shareLib

框架提供cdn和esm两种加载方式，DLL支持，但需要需要自行实现

::: tip
在 moduleFederation 配置中,如果项目需要导出模块供其它项目使用,除了在 empShare.exposes 中配置外,还需要在项目根目录中添加 bootstrap.js 或 bootstrap.ts 文件作为 webpack 导出模块的引导文件。
这样做是因为所有提供的和降级模块是要异步下载的。为了避免任何额外的开销，以提高总体性能。
:::
