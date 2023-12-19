# wujie

无界微前端是一款基于 Web Components + iframe 微前端框架，具备成本低、速度快、原生隔离、功能强等一系列优点。它出自于腾讯，目前star数量3.4k，npm周下载量1148。

## 应用加载方式

采用web components 的方案，将微应用挂载到一个自定义元素上面，并完成一套装载和卸载的生命周期。降级则会采用一个的iframe替换webcomponent

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/wujie-runtime.png)

从上面框架运行图可以看出，子应用的shadowRoot和iframe和承载子应用的组件是解耦的，iframe中运行着子应用的实例instance。

在微前端框架中，子应用放置在主应用页面中随着主应用页面的打开和关闭反复的激活和销毁，而在无界微前端框架中子应用是否保活以及是否进行生命周期的改造会进入完全不同的处理流程。有以下三种模式：

### 保活模式

需要在初始化的时候将子应用的alive设置为true。

当子应用采用保活模式时主应用切换路由，组件被销毁

  - 子应用shadowRoot、iframe、instance都保留

  - 当组件重新渲染，无界则将shadowRoot重新插入组件容器即可，相当于一个shadowRoot的插拔动作

::: warning
保活的子应用的实例不会销毁，子应用被切走了也可以响应 bus 事件，非保活的子应用切走了监听的事件也会全部销毁，需要等下次重新 mount 后重新监听。
:::

<!-- 
这种模式下面，有如下特点：

- 路由同步方式：重新激活时，不会将url同步回iframe，只将子应用路径同步回主应用。子应用路由由开发者完全接管

- 激活子应用的事件处理：降级场景下，事件全部恢复。而不是恢复根节点事件

- 激活子应用的Shadow DOM处理：减少了一些初始化操作，直接挂载DOM

- Loading：子应用启动之后的Loading提前关闭

- activated生命周期：提供了没有进行__WUJIE_MOUNT生命周期改造下，完成mount之后的钩子

- deactivated生命周期：进入unmount，清除已销毁的history模式下子应用同步参数后，触发钩子

- unmount处理：不会销毁Shadow DOM -->

### 单例模式

alive为false，且创建了 window.__WUJIE_MOUNT 和 window.__WUJIE_UNMOUNT 两个生命周期函数，则此时为单例模式。

子应用会调用window.__WUJIE_UNMOUNT销毁instance并清空shadowRoot内部所有元素，但是shadowRoot、iframe都保留

<!-- - 生命周期：将实例创建到 window.__WUJIE_MOUNT 和 window.__WUJIE_UNMOUNT 上面，在子应用激活或销毁时执行实例创建和销毁。

- 路由同步方式：改变 url 子应用的路由会发生跳转到对应路由

- 子应用id：在每个页面启动该子应用的时候将name设置为同一个，这样可以共享一个wujie实例，承载子应用js的iframe也实现了共享 -->

### 重建模式

alive为false，且无生命周期函数，此时为重建模式。切换页面时wujie实例和子应用实例都会被销毁

当子应用重新渲染

  - 无界将调用window.__WUJIE_MOUNT创建新instance

  - 无界将子应用的html重新填充到shadowRoot内

  - 新instance会mount到shadowRoot上。

  - 如果用户没有定义window.__WUJIE_UNMOUNT和window.__WUJIE_MOUNT，那么每次组件重新渲染，都会将wujie实例包括shadowRoot、iframe全部销毁，然后重新创建wujie实例，这样会有白屏时间

<!-- 路由同步方式与单例模式相同：1、第一次激活子应用时，从主应用同步到子应用；2、卸载时，清理非激活态的子应用同步参数。完成清理后，会销毁子应用 -->

核心代码如下：

::: code-group

``` js [web components]
/**
 * 定义 wujie webComponent，将shadow包裹并获得dom装载和卸载的生命周期
 */
export function defineWujieWebComponent() {
  const customElements = window.customElements;
  if (customElements && !customElements?.get("wujie-app")) {
    class WujieApp extends HTMLElement {
      connectedCallback(): void {
        if (this.shadowRoot) return;
        const shadowRoot = this.attachShadow({ mode: "open" });
        const sandbox = getWujieById(this.getAttribute(WUJIE_APP_ID));
        patchElementEffect(shadowRoot, sandbox.iframe.contentWindow);
        sandbox.shadowRoot = shadowRoot;
      }

      disconnectedCallback(): void {
        const sandbox = getWujieById(this.getAttribute(WUJIE_APP_ID));
        sandbox?.unmount();
      }
    }
    customElements?.define("wujie-app", WujieApp);
  }
}
```

``` js [iframe]
/**
 * 将降级的iframe挂在到容器上并进行初始化
 */
export function initRenderIframeAndContainer(
  id: string,
  parent: string | HTMLElement,
  degradeAttrs: { [key: string]: any } = {}
): { iframe: HTMLIFrameElement; container: HTMLElement } {
  const iframe = createIframeContainer(id, degradeAttrs);
  const container = renderElementToContainer(iframe, parent);
  const contentDocument = iframe.contentWindow.document;
  contentDocument.open();
  contentDocument.write("<!DOCTYPE html><html><head></head><body></body></html>");
  contentDocument.close();
  return { iframe, container };
}

export function createIframeContainer(id: string, degradeAttrs: { [key: string]: any } = {}): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  const defaultStyle = "height:100%;width:100%";
  setAttrsToElement(iframe, {
    ...degradeAttrs,
    style: [defaultStyle, degradeAttrs.style].join(";"),
    [WUJIE_APP_ID]: id,
  });
  return iframe;
}
```

:::

## 路由同步方式

劫持iframe的history.pushState和history.replaceState，将子应用的url同步到主应用的query参数上，当刷新浏览器初始化iframe时，读回子应用的url并使用iframe的history.replaceState进行同步。其过程如下图：

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/wujie-history.png)

## JS沙箱


采用[iframe隔离](/microApp/principles/jsisolate)方式，将子应用的js注入主应用同域的iframe中运行，iframe是一个原生的window沙箱，内部有完整的history和location接口，子应用实例instance运行在iframe中，路由也彻底和主应用解耦，可以直接在业务组件里面启动应用。

::: code-group

``` js [iframe隔离]
/**
 * iframe插入脚本
 * @param scriptResult script请求结果
 * @param iframeWindow
 * @param rawElement 原始的脚本
 */
export function insertScriptToIframe(
  scriptResult: ScriptObject | ScriptObjectLoader,
  iframeWindow: Window,
  rawElement?: HTMLScriptElement
) {
  const { src, module, content, crossorigin, crossoriginType, async, attrs, callback, onload } =
    scriptResult as ScriptObjectLoader;
  const scriptElement = iframeWindow.document.createElement("script");
  const nextScriptElement = iframeWindow.document.createElement("script");
  const { replace, plugins, proxyLocation } = iframeWindow.__WUJIE;
  const jsLoader = getJsLoader({ plugins, replace });
  let code = jsLoader(content, src, getCurUrl(proxyLocation));
  // 添加属性
  attrs &&
    Object.keys(attrs)
      .filter((key) => !Object.keys(scriptResult).includes(key))
      .forEach((key) => scriptElement.setAttribute(key, String(attrs[key])));

  // 内联脚本
  if (content) {
    // patch location
    if (!iframeWindow.__WUJIE.degrade && !module) {
      code = `(function(window, self, global, location) {
      ${code}
}).bind(window.__WUJIE.proxy)(
  window.__WUJIE.proxy,
  window.__WUJIE.proxy,
  window.__WUJIE.proxy,
  window.__WUJIE.proxyLocation,
);`;
    }
    const descriptor = Object.getOwnPropertyDescriptor(scriptElement, "src");
    // 部分浏览器 src 不可配置 取不到descriptor表示无该属性，可写
    if (descriptor?.configurable || !descriptor) {
      // 解决 webpack publicPath 为 auto 无法加载资源的问题
      Object.defineProperty(scriptElement, "src", { get: () => src || "" });
    }
  } else {
    src && scriptElement.setAttribute("src", src);
    crossorigin && scriptElement.setAttribute("crossorigin", crossoriginType);
  }
  module && scriptElement.setAttribute("type", "module");
  scriptElement.textContent = code || "";
  nextScriptElement.textContent =
    "if(window.__WUJIE.execQueue && window.__WUJIE.execQueue.length){ window.__WUJIE.execQueue.shift()()}";

  const container = rawDocumentQuerySelector.call(iframeWindow.document, "head");
  const execNextScript = () => !async && container.appendChild(nextScriptElement);
  const afterExecScript = () => {
    onload?.();
    execNextScript();
  };

  // 错误情况处理
  if (/^<!DOCTYPE html/i.test(code)) {
    error(WUJIE_TIPS_SCRIPT_ERROR_REQUESTED, scriptResult);
    return execNextScript();
  }

  // 打标记
  if (rawElement) {
    setTagToScript(scriptElement, getTagFromScript(rawElement));
  }
  // 外联脚本执行后的处理
  const isOutlineScript = !content && src;
  if (isOutlineScript) {
    scriptElement.onload = afterExecScript;
    scriptElement.onerror = afterExecScript;
  }
  container.appendChild(scriptElement);

  // 调用回调
  callback?.(iframeWindow);
  // 执行 hooks
  execHooks(plugins, "appendOrInsertElementHook", scriptElement, iframeWindow, rawElement);
  // 内联脚本执行后的处理
  !isOutlineScript && afterExecScript();
}
```

``` js [proxy]
/**
 * 非降级情况下window、document、location代理
 */
export function proxyGenerator(
  iframe: HTMLIFrameElement,
  urlElement: HTMLAnchorElement,
  mainHostPath: string,
  appHostPath: string
): {
  proxyWindow: Window;
  proxyDocument: Object;
  proxyLocation: Object;
} {
  const proxyWindow = new Proxy(iframe.contentWindow, {
    get: (target: Window, p: PropertyKey): any => {
      // location进行劫持
      if (p === "location") {
        return target.__WUJIE.proxyLocation;
      }
      // 判断自身
      if (p === "self" || (p === "window" && Object.getOwnPropertyDescriptor(window, "window").get)) {
        return target.__WUJIE.proxy;
      }
      // 不要绑定this
      if (p === "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__" || p === "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__") {
        return target[p];
      }
      // https://262.ecma-international.org/8.0/#sec-proxy-object-internal-methods-and-internal-slots-get-p-receiver
      const descriptor = Object.getOwnPropertyDescriptor(target, p);
      if (descriptor?.configurable === false && descriptor?.writable === false) {
        return target[p];
      }
      // 修正this指针指向
      return getTargetValue(target, p);
    },

    set: (target: Window, p: PropertyKey, value: any) => {
      checkProxyFunction(value);
      target[p] = value;
      return true;
    },

    has: (target: Window, p: PropertyKey) => p in target,
  });

  // proxy document
  const proxyDocument = new Proxy(
    {},
    {
      get: function (_fakeDocument, propKey) {
        const document = window.document;
        const { shadowRoot, proxyLocation } = iframe.contentWindow.__WUJIE;
        // iframe初始化完成后，webcomponent还未挂在上去，此时运行了主应用代码，必须中止
        if (!shadowRoot) stopMainAppRun();
        const rawCreateElement = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_ELEMENT__;
        const rawCreateTextNode = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_TEXT_NODE__;
        // need fix
        if (propKey === "createElement" || propKey === "createTextNode") {
          return new Proxy(document[propKey], {
            apply(_createElement, _ctx, args) {
              const rawCreateMethod = propKey === "createElement" ? rawCreateElement : rawCreateTextNode;
              const element = rawCreateMethod.apply(iframe.contentDocument, args);
              patchElementEffect(element, iframe.contentWindow);
              return element;
            },
          });
        }
        if (propKey === "documentURI" || propKey === "URL") {
          return (proxyLocation as Location).href;
        }

        // from shadowRoot
        if (
          propKey === "getElementsByTagName" ||
          propKey === "getElementsByClassName" ||
          propKey === "getElementsByName"
        ) {
          return new Proxy(shadowRoot.querySelectorAll, {
            apply(querySelectorAll, _ctx, args) {
              let arg = args[0];
              if (_ctx !== iframe.contentDocument) {
                return _ctx[propKey].apply(_ctx, args);
              }

              if (propKey === "getElementsByTagName" && arg === "script") {
                return iframe.contentDocument.scripts;
              }
              if (propKey === "getElementsByClassName") arg = "." + arg;
              if (propKey === "getElementsByName") arg = `[name="${arg}"]`;

              // FIXME: This string must be a valid CSS selector string; if it's not, a SyntaxError exception is thrown;
              // so we should ensure that the program can execute normally in case of exceptions.
              // reference: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll

              let res: NodeList[] | [];
              try {
                res = querySelectorAll.call(shadowRoot, arg);
              } catch (error) {
                res = [];
              }

              return res;
            },
          });
        }
        if (propKey === "getElementById") {
          return new Proxy(shadowRoot.querySelector, {
            // case document.querySelector.call
            apply(target, ctx, args) {
              if (ctx !== iframe.contentDocument) {
                return ctx[propKey]?.apply(ctx, args);
              }
              try {
                return (
                  target.call(shadowRoot, `[id="${args[0]}"]`) ||
                  iframe.contentWindow.__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__.call(
                    iframe.contentWindow.document,
                    `#${args[0]}`
                  )
                );
              } catch (error) {
                warn(WUJIE_TIPS_GET_ELEMENT_BY_ID);
                return null;
              }
            },
          });
        }
        if (propKey === "querySelector" || propKey === "querySelectorAll") {
          const rawPropMap = {
            querySelector: "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR__",
            querySelectorAll: "__WUJIE_RAW_DOCUMENT_QUERY_SELECTOR_ALL__",
          };
          return new Proxy(shadowRoot[propKey], {
            apply(target, ctx, args) {
              if (ctx !== iframe.contentDocument) {
                return ctx[propKey]?.apply(ctx, args);
              }
              // 二选一，优先shadowDom，除非采用array合并，排除base，防止对router造成影响
              return (
                target.apply(shadowRoot, args) ||
                (args[0] === "base"
                  ? null
                  : iframe.contentWindow[rawPropMap[propKey]].call(iframe.contentWindow.document, args[0]))
              );
            },
          });
        }
        if (propKey === "documentElement" || propKey === "scrollingElement") return shadowRoot.firstElementChild;
        if (propKey === "forms") return shadowRoot.querySelectorAll("form");
        if (propKey === "images") return shadowRoot.querySelectorAll("img");
        if (propKey === "links") return shadowRoot.querySelectorAll("a");
        const { ownerProperties, shadowProperties, shadowMethods, documentProperties, documentMethods } =
          documentProxyProperties;
        if (ownerProperties.concat(shadowProperties).includes(propKey.toString())) {
          if (propKey === "activeElement" && shadowRoot.activeElement === null) return shadowRoot.body;
          return shadowRoot[propKey];
        }
        if (shadowMethods.includes(propKey.toString())) {
          return getTargetValue(shadowRoot, propKey) ?? getTargetValue(document, propKey);
        }
        // from window.document
        if (documentProperties.includes(propKey.toString())) {
          return document[propKey];
        }
        if (documentMethods.includes(propKey.toString())) {
          return getTargetValue(document, propKey);
        }
      },
    }
  );

  // proxy location
  const proxyLocation = new Proxy(
    {},
    {
      get: function (_fakeLocation, propKey) {
        const location = iframe.contentWindow.location;
        if (
          propKey === "host" ||
          propKey === "hostname" ||
          propKey === "protocol" ||
          propKey === "port" ||
          propKey === "origin"
        ) {
          return urlElement[propKey];
        }
        if (propKey === "href") {
          return location[propKey].replace(mainHostPath, appHostPath);
        }
        if (propKey === "reload") {
          warn(WUJIE_TIPS_RELOAD_DISABLED);
          return () => null;
        }
        if (propKey === "replace") {
          return new Proxy(location[propKey], {
            apply(replace, _ctx, args) {
              return replace.call(location, args[0]?.replace(appHostPath, mainHostPath));
            },
          });
        }
        return getTargetValue(location, propKey);
      },
      set: function (_fakeLocation, propKey, value) {
        // 如果是跳转链接的话重开一个iframe
        if (propKey === "href") {
          return locationHrefSet(iframe, value, appHostPath);
        }
        iframe.contentWindow.location[propKey] = value;
        return true;
      },
      ownKeys: function () {
        return Object.keys(iframe.contentWindow.location).filter((key) => key !== "reload");
      },
      getOwnPropertyDescriptor: function (_target, key) {
        return { enumerable: true, configurable: true, value: this[key] };
      },
    }
  );
  return { proxyWindow, proxyDocument, proxyLocation };
}
```

``` js [Object.defineProperty]
/**
 * 降级情况下document、location代理处理
 */
export function localGenerator(
  iframe: HTMLIFrameElement,
  urlElement: HTMLAnchorElement,
  mainHostPath: string,
  appHostPath: string
): {
  proxyDocument: Object;
  proxyLocation: Object;
} {
  // 代理 document
  const proxyDocument = {};
  const sandbox = iframe.contentWindow.__WUJIE;
  // 特殊处理
  Object.defineProperties(proxyDocument, {
    createElement: {
      get: () => {
        return function (...args) {
          const element = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_ELEMENT__.apply(
            iframe.contentDocument,
            args
          );
          patchElementEffect(element, iframe.contentWindow);
          return element;
        };
      },
    },
    createTextNode: {
      get: () => {
        return function (...args) {
          const element = iframe.contentWindow.__WUJIE_RAW_DOCUMENT_CREATE_TEXT_NODE__.apply(
            iframe.contentDocument,
            args
          );
          patchElementEffect(element, iframe.contentWindow);
          return element;
        };
      },
    },
    documentURI: {
      get: () => (sandbox.proxyLocation as Location).href,
    },
    URL: {
      get: () => (sandbox.proxyLocation as Location).href,
    },
    getElementsByTagName: {
      get() {
        return function (...args) {
          const tagName = args[0];
          if (tagName === "script") {
            return iframe.contentDocument.scripts as any;
          }
          return sandbox.document.getElementsByTagName(tagName) as any;
        };
      },
    },
  });
  // 普通处理
  const {
    modifyLocalProperties,
    modifyProperties,
    ownerProperties,
    shadowProperties,
    shadowMethods,
    documentProperties,
    documentMethods,
  } = documentProxyProperties;
  modifyProperties
    .filter((key) => !modifyLocalProperties.includes(key))
    .concat(ownerProperties, shadowProperties, shadowMethods, documentProperties, documentMethods)
    .forEach((key) => {
      Object.defineProperty(proxyDocument, key, {
        get: () => {
          const value = sandbox.document?.[key];
          return isCallable(value) ? value.bind(sandbox.document) : value;
        },
      });
    });

  // 代理 location
  const proxyLocation = {};
  const location = iframe.contentWindow.location;
  const locationKeys = Object.keys(location);
  const constantKey = ["host", "hostname", "port", "protocol", "port"];
  constantKey.forEach((key) => {
    proxyLocation[key] = urlElement[key];
  });
  Object.defineProperties(proxyLocation, {
    href: {
      get: () => location.href.replace(mainHostPath, appHostPath),
      set: (value) => {
        locationHrefSet(iframe, value, appHostPath);
      },
    },
    reload: {
      get() {
        warn(WUJIE_TIPS_RELOAD_DISABLED);
        return () => null;
      },
    },
  });
  locationKeys
    .filter((key) => !constantKey.concat(["href", "reload"]).includes(key))
    .forEach((key) => {
      Object.defineProperty(proxyLocation, key, {
        get: () => (isCallable(location[key]) ? location[key].bind(location) : location[key]),
      });
    });
  return { proxyDocument, proxyLocation };
}
```

:::

## CSS沙箱

无界采用[web component](/microApp/principles/cssisolate)来实现页面的样式隔离，无界会创建一个wujie自定义元素，然后将子应用的完整结构渲染在内部。（参考上文应用加载方式图）

拥有以下能力：

- 子应用的实例instance在iframe内运行，dom在主应用容器下的webcomponent内，通过代理 iframe的document到webcomponent，可以实现两者的互联。

- 将document的查询类接口：getElementsByTagName、getElementsByClassName、getElementsByName、getElementById、querySelector、querySelectorAll、head、body全部代理到web component，这样instance和web component就精准的链接起来。

- 当子应用发生切换，iframe保留下来，子应用的容器可能销毁，但web component依然可以选择保留，这样等应用切换回来将webcomponent再挂载回容器上，子应用可以获得类似vue的keep-alive的能力。

## 通信机制

承载子应用的iframe和主应用是同域的，所以主、子应用天然就可以很好的进行通信，在无界我们提供三种通信方式

- props 注入机制

子应用通过$wujie.props可以轻松拿到主应用注入的数据

- window.parent 通信机制

子应用iframe沙箱和主应用同源，子应用可以直接通过window.parent和主应用通信

- 去中心化的通信机制
  
无界提供了EventBus实例，注入到主应用和子应用，所有的应用可以去中心化的进行通信