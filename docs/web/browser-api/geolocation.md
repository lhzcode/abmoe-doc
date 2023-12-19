# Web API 系列 - Geolocation API

## 背景和适用范围

地理位置 API（Geolocation API）允许用户向 web 应用程序提供他们的位置。出于隐私考虑，报告地理位置前会先请求用户许可。

Web 扩展若期望使用 Geolocation 对象，则必须将 "geolocation" 权限添加到其清单（manifest）中。在第一次请求地理位置访问时，用户的操作系统将提示用户提供相应的权限。

## 参考

- [MDN接口文档 - Geolocation API](https://developer.mozilla.org/zh-CN/docs/Web/API/Geolocation_API)