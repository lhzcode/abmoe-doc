import { defineConfig } from 'vitepress'
import sidebar from './sidebar'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Technical Reserve",
  description: "技术备忘录",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    search: {
      provider: 'algolia',
      options: {
        appId: 'IUB6V05JX5',
        apiKey: '5af734b11a60f52b3b8f96efbef6557e',
        indexName: 'abmoe_doc'
      }
    },
    nav: [
      { text: '首页', link: '/'},
      { text: 'ChatGPT个人版', link: 'https://chat.abmoe.com' },
      { text: 'point', link: '' }
    ],

    sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
