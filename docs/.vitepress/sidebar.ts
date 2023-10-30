const commonBar = [
  { text: '微前端↗', link: '/microApp/' },
  { text: '低代码↗', link: '/lowCode/' },
  { text: 'NextJS↗', link: '/nextJS/' },
  { text: '工具链↗', link: '/tools/' },
]

export default {
  '/': [
    {
      text: '开始阅读',
      collapsed: false,
      items: [
        { text: '简介', link: '/guide' }
      ]
    },
    ...commonBar
  ],
  '/microApp/': [
    {
      text: '微前端',
      items: [
        { text: '概述', link: '/microApp/overview/' },
        { text: '方案', link: '/microApp/solutions/'},
        { text: '原理', link: '/microApp/principles/'},
      ]

    }
  ],
  '/lowCode/': [],
  '/nextJS/': [],
  '/tools/': []
}