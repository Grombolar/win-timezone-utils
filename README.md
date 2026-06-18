## 安装

```bash
npm install @grombolar/win-timezone-utils
# or
yarn add @grombolar/win-timezone-utils
```

*注意：需要vue 3.0.0以上版本

当前支持中文、英文、法语三种语言切换

### 使用

主程序 main.ts

```js
import { createApp } from 'vue'
import App from './App.vue'
import WinTimezonePlugin from '@grombolar/win-timezone-utils'
import { createI18n } from 'vue-i18n';
const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  messages: ....
})
const app = createApp(App)
app.use(i18n)
app.use(WinTimezonePlugin, { i18n })
app.mount('#app')
```

组件引用 vue

```vue
<template>
<div v-for="item in timeZones" :key="item.value">
  {{ item.label }}
</div>
</template>
<script setup lang='ts'>
import { timeZones, LanguageEnum } from '@grombolar/win-timezone-utils'
</script>
```

#### 0.2.9版本更新
 - 新增Linux系统IANA时区支持
 - 修复Windows系统IANA时区映射问题

timeZones 格式
```ts
export interface TimeZone {
  label: string
  // IANA 时区 ID
  // Linux / Luxon 场景下直接使用
  // Windows 时区 ID
  value: string
  // Windows 时区 ID
  winValue: string
}

```

### 其他方法

| 方法名          | 传参      | 返回值       | 说明           |
| -------------- | ----------| ------------ | ------------- |
| formatterTimeInTimezone    | time:number, timezone:string | string('yyyy-MM-dd HH:mm:ss') | 将时间转换为对应时区的时间 |
| getTimestempByTimezone | timeStr:string, timezone:string, format?:string | number | 将格式化的时间转为对应时区的时间戳 |
| toIanaTimezoneId | timezone:string | string | 将Windows时区转为IANA时区 |
| toWindowsTimezoneId | timezone:string | string | 将IANA时区转为Windows时区 |
