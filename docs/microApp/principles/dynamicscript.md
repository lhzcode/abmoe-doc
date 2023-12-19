# 动态Script

## 方案简述

动态Script提供了一种主应用线上动态管理的微应用能力。设计思路围绕将导航和需要加载的微应用进行动态化。设计思路如下图所示：

![](https://cdn.jsdelivr.net/gh/AqUSuYxzZvBrP/pic/dynamic-solution.png)


## 注意事项

// TODO 建议引入single-spa + System.js，并根据实际业务进行改造

## 示例

### 主应用

``` html
<!-- public/main/index.html -->

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      h1 {
        color: red;
      }
    </style>
  </head>

  <body>
    <!-- 主应用的样式会被微应用覆盖 -->
    <h1>Hello，Dynamic Script!</h1>
    <!-- 主导航设计，这里可以根据后端数据动态渲染 -->
    <div id="nav"></div>
    <!-- 内容区设计 -->
    <div class="container">
      <!-- 微应用渲染的插槽 -->
      <div id="micro-app-slot"></div>
    </div>

    <!-- 微应用工具类 -->
    <script type="text/javascript">
      class UtilsManager {
        constructor() {}

        // API 接口管理
        getMicroApps() {
          return window
            .fetch("/microapps", {
              method: "post",
            })
            .then((res) => res.json())
            .catch((err) => {
              console.error(err);
            });
        }

        isSupportPrefetch() {
          const link = document.createElement("link");
          const relList = link?.relList;
          return relList && relList.supports && relList.supports("prefetch");
        }

        // 预请求资源，注意此种情况下不会执行 JS
        prefetchStatic(href, as) {
          // prefetch 浏览器支持检测
          if (!this.isSupportPrefetch()) {
            return;
          }
          const $link = document.createElement("link");
          $link.rel = "prefetch";
          $link.as = as;
          $link.href = href;
          document.head.appendChild($link);
        }

        // 请求 & 执行 JS
        loadScript({ script, id }) {
          return new Promise((resolve, reject) => {
            const $script = document.createElement("script");
            $script.src = script;
            $script.setAttribute("micro-script", id);
            $script.onload = resolve;
            $script.onerror = reject;
            document.body.appendChild($script);
          });
        }

        loadStyle({ style, id }) {
          return new Promise((resolve, reject) => {
            const $style = document.createElement("link");
            $style.href = style;
            $style.setAttribute("micro-style", id);
            $style.rel = "stylesheet";
            $style.onload = resolve;
            $style.onerror = reject;
            document.head.appendChild($style);
          });
        }

        removeStyle({ id }) {
          const $style = document.querySelector(`[micro-style=${id}]`);
          $style && $style?.parentNode?.removeChild($style);
        }

        hasLoadScript({ id }) {
          const $script = document.querySelector(`[micro-script=${id}]`);
          return !!$script;
        }

        hasLoadStyle({ id }) {
          const $style = document.querySelector(`[micro-style=${id}]`);
          return !!$style;
        }
      }
    </script>

    <!-- 根据路由切换微应用 -->
    <script type="text/javascript">
      // 微应用管理
      class MicroAppManager extends UtilsManager {
        micrpApps = [];

        constructor() {
          super();
          this.init();
        }

        init() {
          this.processMicroApps();
          this.navClickListener();
          this.hashChangeListener();
        }

        processMicroApps() {
          this.getMicroApps().then((res) => {
            this.microApps = res;
            this.prefetchMicroAppStatic();
            this.createMicroAppNav();
          });
        }

        prefetchMicroAppStatic() {
          const prefetchMicroApps = this.microApps?.filter(
            (microapp) => microapp.prefetch
          );
          prefetchMicroApps?.forEach((microApp) => {
            microApp.script && this.prefetchStatic(microApp.script, "script");
            microApp.style && this.prefetchStatic(microApp.style, "style");
          });
        }

        createMicroAppNav(microApps) {
          const fragment = new DocumentFragment();
          this.microApps?.forEach((microApp) => {
            // 按钮触发nav导航变更
            const button = document.createElement("button");
            button.textContent = microApp.name;
            button.id = microApp.id;
            fragment.appendChild(button);
          });
          nav.appendChild(fragment);
        }

        navClickListener() {
          const nav = document.getElementById("nav");
          nav.addEventListener("click", (e) => {
            // hash地址变更
            window.location.hash = event?.target?.id;
          });
        }

        hashChangeListener() {
          // 监听 Hash 路由的变化，切换微应用
          window.addEventListener("hashchange", () => {
            this.microApps?.forEach(async (microApp) => {
              // 匹配需要激活的微应用
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
                window?.[microApp.mount]?.("#micro-app-slot");
                // 如果存在卸载 API 则进行应用卸载处理
              } else {
                this.removeStyle(microApp);
                window?.[microApp.unmount]?.();
              }
            });
          });
        }
      }

      new MicroAppManager();
    </script>
  </body>
</html>
```

### 微应用
``` jsx
// micro1.js
// 立即执行的匿名函数可以防止变量 root 产生冲突
(function () {
  let root;

  window.micro1_mount = function (slot) {
    // 任意框架挂载到的dom节点
    root = document.createElement("h1");
    root.textContent = "微应用1";
    // 在微应用插槽上挂载 DOM 元素
    const $slot = document.querySelector(slot);
    $slot?.appendChild(root);
  };

  window.micro1_unmount = function () {
    if (!root) return;
    root.parentNode?.removeChild(root);
  };
})();


// micro1.css
h1 {
  color: green;
}


// micro2.js
// 立即执行的匿名函数可以防止变量 root 产生冲突
(function () {
  let root;

  window.micro2_mount = function (slot) {
    root = document.createElement("h1");
    root.textContent = "微应用2";
    const $slot = document.querySelector(slot);
    $slot?.appendChild(root);
  };

  window.micro2_unmount = function () {
    if (!root) return;
    root.parentNode?.removeChild(root);
  };
})();

// micro2.css
h1 {
  color: blue;
}
```