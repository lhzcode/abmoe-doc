const commonBar = [
  { text: '微前端↗', link: '/microApp/overview/' },
  { text: '低代码↗', link: '/lowCode/' },
  { text: 'NextJS↗', link: '/nextJS/' },
  { text: '工具链↗', link: '/tools/' },
  { text: 'Web趋势↗', link: '/web/stateofjs' }
]

export default {
  '/': [
    {
      text: '简介',
      link: '/guide'
    },
    {
      text: '业务问题',
      collapsed: false,
      items: [
        { text: '组织BP化趋势', link: '/bussiness/bd' }
      ]
    },
    ...commonBar
  ],
  '/microApp/': [
    {
      text: '微前端',
      items: [
        { text: '概述', link: '/microApp/overview/' },
        {
          text: '框架',
          items: [
            { text: 'singlespa', link: '/microApp/solutions/singlespa' },
            { text: 'qiankun', link: '/microApp/solutions/qiankun' },
            { text: 'icestark', link: '/microApp/solutions/icestark' },
            { text: 'wujie', link: '/microApp/solutions/wujie' },
            { text: 'emp', link: '/microApp/solutions/emp' },
            { text: 'garfish', link: '/microApp/solutions/garfish' },
            { text: 'microapp', link: '/microApp/solutions/microapp' },
          ]
        },
        {
          text: '原理',
          items: [
            { text: 'iframe', link: '/microApp/principles/iframe' },
            { text: 'Npm', link: '/microApp/principles/npm' },
            { text: '动态Script', link: '/microApp/principles/dynamicscript' },
            { text: 'Web Components', link: '/microApp/principles/webcomponents' },
            { text: 'JS隔离', link: '/microApp/principles/jsisolate' },
            { text: 'CSS隔离', link: '/microApp/principles/cssisolate' },
            { text: 'Module Federation', link: '/microApp/principles/modulefederation' },
            { text: 'Monorepo', link: '/microApp/principles/monorepo' },
          ]
        },
      ]
    }
  ],
  '/lowCode/': [
    {
      text: '低代码',
      items: [
        { text: '可视化搭建系统', link: '/lowCode/overview/' },
        { text: '中后台低码产品设计', link: '/lowCode/principles/product-design' },
        { text: '渲染方案', link: '/lowCode/principles/canvas-dom' },
        { text: '通用schema设计', link: '/lowCode/principles/schema' },
        { text: '组件与物料设计', link: '/lowCode/principles/material' },
        { text: '模板设计', link: '/lowCode/principles/template' },
        { text: '拖拽组件设计开发', link: '/lowCode/principles/dnd'}
      ]
    }
  ],
  '/nextJS/': [
    {
      text: 'NextJS',
      items: [
        { text: '概述', link: '/nextJS/' },
        { text: '页面路由', link: '/nextJS/route'},
        { text: 'API路由', link: '/nextJS/api-route' },
        { text: '渲染', link: '/nextJS/render'},
        { text: '数据获取', link: '/nextJS/fetch' }
      ]
    }
  ],
  '/tools/': [
    {
      text: '工具链',
      items: [
        { text: 'chrome插件', link: '/tools/chrome' },
        { text: 'vscode插件', link: '/tools/vscode'}
        // { text: '概述', link: '/tools/overview/' },
        // { text: '方案', link: '/tools/solutions/' },
        // { text: '原理', link: '/tools/principles/' },
      ]
    }
  ],
  '/web/': [
    {
      text: 'Web发展趋势',
      items: [
        { text: '全球web开发趋势', link: '/web/stateofjs' },
        { text: 'JavaScript新特性[WIP]', link: '/web/javascript' },
        {
          text: '浏览器新API[WIP]',
          collapsed: true,
          items: [
            { text: 'Service Workers', link: '/web/browser-api/service-workers' },
            { text: 'Intl', link: '/web/browser-api/intl' },
            { text: 'WebGL', link: '/web/browser-api/webgl' },
            { text: 'Web Animations', link: '/web/browser-api/animations' },
            { text: 'WebRTC', link: '/web/browser-api/webrtc' },
            { text: 'Web Speech API', link: '/web/browser-api/speech' },
            { text: 'Custom Element', link: '/web/browser-api/custom-elements' },
            { text: 'Shadow DOM', link: '/web/browser-api/shadow-dom' },
            { text: '页面可见性API', link: '/web/browser-api/page-visible' },
            { text: 'Broadcast Channel API', link: '/web/browser-api/broadcast-channel' },
            { text: 'Geolocation API', link: '/web/browser-api/geolocation' },
            { text: '文件系统访问 API ', link: '/web/browser-api/file-system' },
            { text: 'Web Share API', link: '/web/browser-api/web-share' },
            { text: 'WebXR Device API', link: '/web/browser-api/webxr-device' },
            { text: '渐进式 Web 应用（PWA）', link: '/web/browser-api/pwa' },
            { text: 'WebAssembly', link: '/web/browser-api/webassembly' }
          ]
        },
        {
          text: '前端库介绍[WIP]',
          collapsed: true,
          items: [
            { text: '前端框架', link: '/web/libraries/font-end-frameworks' },
            { text: '渲染框架', link: '/web/libraries/rendering-frameworks' },
            { text: '测试工具', link: '/web/libraries/testing' },
            { text: '移动端和客户端', link: '/web/libraries/mobile-desk' },
            { text: '构建工具', link: '/web/libraries/build-tools' },
            { text: 'Monorepo 工具', link: '/web/libraries/monorepo-tools' },
          ]
        }
      ]
    },
  ]
}