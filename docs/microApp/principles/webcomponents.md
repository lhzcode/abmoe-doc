# Web Components

## 方案简述

实现思路同之前的动态Script方案基本一样，区别在于如何挂载到微应用内容区。Web Components方案使用自定义元素来挂载微应用内容。

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/custom-element-solution.png)

## 注意事项

### 技术选型

// TODO 三种技术介绍说明

Web Components 本身属于 W3C 的标准，符合微前端技术无关的特性，未来可以跟随浏览器进行升级和维护，目前较新的微前端框架很多都选择 Web Components 进行设计的重要原因。当然，在使用 Web Components 进行设计时也需要考虑一些副作用，例如浏览器兼容性。

## 示例

### 自定义元素挂载微应用
``` javascript
// micro1.js

// MDN: https://developer.mozilla.org/zh-CN/docs/Web/Web_Components
// MDN: https://developer.mozilla.org/zh-CN/docs/Web/Web_Components/Using_custom_elements
class MicroApp1Element extends HTMLElement {
  constructor() {
    super();
  }

  // [生命周期回调函数] 当 custom element 自定义标签首次被插入文档 DOM 时，被调用
  // 类似于 React 中的  componentDidMount 周期函数
  // 类似于 Vue 中的 mounted 周期函数
  connectedCallback() {
    console.log(`[micro-app-1]：执行 connectedCallback 生命周期回调函数`);
    // 挂载应用
    // 相对动态 Script，组件内部可以自动进行 mount 操作，不需要对外提供手动调用的 mount 函数，从而防止不必要的全局属性冲突
    this.mount();
  }

  // [生命周期回调函数] 当 custom element 从文档 DOM 中删除时，被调用
  // 类似于 React 中的  componentWillUnmount 周期函数
  // 类似于 Vue 中的 destroyed 周期函数
  disconnectedCallback() {
    console.log(
      `[micro-app-1]：执行 disconnectedCallback 生命周期回调函数`
    );
    // 卸载处理
    this.unmount();
  }

  mount() {
    const $micro = document.createElement("h1");
    $micro.textContent = "微应用1";
    // 将微应用的内容挂载到当前自定义元素下
    this.appendChild($micro);
  }

  unmount() {
    // 这里可以去除相应的副作用处理
  }
}

// MDN：https://developer.mozilla.org/zh-CN/docs/Web/API/CustomElementRegistry/define
// 创建自定义元素，可以在浏览器中使用 <micro-app-1> 自定义标签
window.customElements.define("micro-app-1", MicroApp1Element);
```

### 主应用响应路由变化
``` html
 <script type="text/javascript">
    function hashChangeListener() {
      // Web Components 方案
      // 微应用的插槽
      const $slot = document.getElementById("micro-app-slot");

      window.addEventListener("hashchange", () => {
        this.microApps?.forEach(async (microApp) => {
          // Web Components 方案
          const $webcomponent = document.querySelector(
            `[micro-id=${microApp.id}]`
          );

          if (microApp.id === window.location.hash.replace("#", "")) {
            console.time(`fetch microapp ${microApp.name} static`);
            // 加载 CSS 样式
            microApp?.style &&
              !this.hasLoadStyle(microApp) &&
              (await this.loadStyle(microApp));
            // 加载 Script 标签
            microApp?.script &&
              !this.hasLoadScript(microApp) &&
              (await this.loadScript(microApp));
            console.timeEnd(`fetch microapp ${microApp.name} static`);

            // 动态 Script 方案
            // window?.[microApp.mount]?.("#micro-app-slot");

            // Web Components 方案
            // 如果没有在 DOM 中添加自定义元素，则先添加处理
            if (!$webcomponent) {
              // Web Components 方案
              // 自定义元素的标签是微应用先定义出来的，然后在服务端的接口里通过 customElement 属性进行约定
              const $webcomponent = document.createElement(
                microApp.customElement
              );
              $webcomponent.setAttribute("micro-id", microApp.id);
              $slot.appendChild($webcomponent);
            // 如果已经存在自定义元素，则进行显示处理
            } else {
              $webcomponent.style.display = "block";
            }
          } else {
            this.removeStyle(microApp);
            // 动态 Script 方案
            // window?.[microApp.unmount]?.();

            // Web Components 方案
            // 如果已经添加了自定义元素，则隐藏自定义元素
            if ($webcomponent) {
              $webcomponent.style.display = "none";
            }
          }
        });
      });
    }
  <script type="text/javascript">
```