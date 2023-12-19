# CSS隔离

如果微应用和主应用在同一个 DOM 环境中，有如下思路可以避免样式污染：

- 对微应用的每一个 CSS 样式和对应的元素进行特殊处理，从而保证样式唯一性，例如 Vue 的 Scoped CSS
- 对微应用的所有 CSS 样式添加一个特殊的选择器规则，从而限定其影响范围
- 使用 Shadow DOM 实现 CSS 样式隔离

思路一和思路二，都需要遵循设计和编码规范，进行特殊处理。思路三是利用浏览器的标准来实现的CSS隔离，下面主要讨论实现细节。

## Shadow DOM 隔离

### Web Components技术

[Shadow DOM](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_components/Using_shadow_DOM)是Web Components其中的一项技术。用于将封装的“影子”DOM 树附加到元素（与主文档 DOM 分开呈现）并控制其关联的功能。通过这种方式，你可以保持元素的功能私有，这样它们就可以被脚本化和样式化，而不用担心与文档的其他部分发生冲突。

影子 DOM 允许将隐藏的 DOM 树附加到常规 DOM 树中的元素上——这个影子 DOM 始于一个影子根，在其之下你可以用与普通 DOM 相同的方式附加任何元素。

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/shadowdom_microapp.svg)

### 示例

第一步，微应用中创建一个标签

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
    // 挂载应用
    this.mount();
  }

  // [生命周期回调函数] 当 custom element 从文档 DOM 中删除时，被调用
  // 类似于 React 中的  componentWillUnmount 周期函数
  // 类似于 Vue 中的 destroyed 周期函数
  disconnectedCallback() {
    // 卸载处理
    this.unmount();
  }

  mount() {
    // MDN: https://developer.mozilla.org/zh-CN/docs/Web/API/Element/attachShadow
    // 给当前自定义元素挂载一个 Shadow DOM
    const $shadow = this.attachShadow({ mode: "open" });
    const $micro = document.createElement("div");
    $micro.textContent = "微应用1";
    // 将微应用的内容挂载到当前自定义元素的 Shadow DOM 下，从而与主应用进行 DOM 隔离
    $shadow.appendChild($micro);
  }

  unmount() {
    // 这里可以去除相应的副作用处理
  }
}

// MDN：https://developer.mozilla.org/zh-CN/docs/Web/API/CustomElementRegistry/define
// 创建自定义元素，可以在浏览器中使用 <micro-app-1> 自定义标签
window.customElements.define("micro-app-1", MicroApp1Element);
```

第二步，主应用挂载上一步创建的自定义标签

```javascript
  class MicroAppManager extends UtilsManager {
    micrpApps = [
      // 应用名称
      name: "micro1",
      // 应用标识
      id: "micro1",
      // Web Components 方案
      // 自定义元素名称
      customElement: 'micro-app-1',
      // 应用脚本（示例给出一个脚本，多个脚本也一样）
      script: `http://${host}:${port.micro}/micro1.js`,
    ];

    constructor() {
      super();
      this.init();
    }

    init() {
      this.hashChangeListener();
    }

    loadStyle({ style, id }) {
      return new Promise((resolve, reject) => {
        const $style = document.createElement("link");
        $style.href = style;
        $style.setAttribute("micro-style", id);
        $style.rel = "stylesheet";
        $style.onload = resolve;
        $style.onerror = reject;
        
        // 动态 Script 方案
        // document.body.appendChild($style);

        // Web Components 方案
        // 将微应用的 CSS 样式添加到可以隔离的 Shadow DOM 中   
        const $webcomponent = document.querySelector(`[micro-id=${id}]`);
        const $shadowRoot = $webcomponent?.shadowRoot;
        $shadowRoot?.insertBefore($style, $shadowRoot?.firstChild);
      });
    }

    hashChangeListener() {
      // Web Components 方案
      // 微应用的插槽
      const $slot = document.getElementById("micro-app-slot");

      window.addEventListener("hashchange", () => {
        this.microApps?.forEach(async (microApp) => {

          // await 动态 Script

          // Web Components 方案
          const $webcomponent = document.querySelector(
            `[micro-id=${microApp.id}]`
          );

          if (microApp.id === window.location.hash.replace("#", "")) {
            // Web Components 方案
            if (!$webcomponent) {
              // 动态 Script 方案
              // window?.[microApp.mount]?.("#micro-app-slot");

              // Web Components 方案
              // 下载并执行相应的 JS 后会声明微应用对应的自定义元素
              // 在服务端的接口里通过 customElement 属性进行约定
              const $webcomponent = document.createElement(
                microApp.customElement
              );
              $webcomponent.setAttribute("micro-id", microApp.id);
              $slot.appendChild($webcomponent);
                
              // 将 CSS 插入到自定义元素对应的 Shadow DOM 中
              this.loadStyle(microApp);

            } else {
              // Web Components 方案
              $webcomponent.style.display = "block";
            }
          } else {
            // 动态 Script 方案
            // this.removeStyle(microApp);
            // window?.[microApp.unmount]?.();

            // Web Components 方案
            $webcomponent.style.display = "none";
          }
        });
      });
    }
  }
```

## 事件隔离

Shadow DOM，它不仅仅可以做到 DOM 元素的 CSS 样式隔离，还可以做到事件的隔离处理。

### React17委托事件

React 17 以下会使用 Document 进行事件委托处理，此时会因为拿不到 Shadow DOM 中的事件对象，而导致事件失效。为了解决类似的问题，React 17 不再使用 Document 进行事件委托，而是使用 React 挂载的 Root 节点进行事件委托

### 示例

``` javascript
class CustomElement extends HTMLElement {
  constructor() {
    super();
    // Shadow Root: Shadow Tree 的根节点
    const shadowRoot = this.attachShadow({ mode: "open" });
    const $template = document.getElementById("custom-element-template");
    // cloneNode:
    // 克隆一个元素节点会拷贝它所有的属性以及属性值，当然也就包括了属性上绑定的事件 (比如 onclick="alert(1)"),
    // 但不会拷贝那些使用 addEventListener() 方法或者 node.onclick = fn 这种用 JavaScript 动态绑定的事件。
    shadowRoot.appendChild($template.content.cloneNode(true));
  }
}
customElements.define("custom-element", CustomElement);
```