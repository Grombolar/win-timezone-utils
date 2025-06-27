## 安装

```bash
npm install @grombolar/win-timezone-utils
# or
yarn add @grombolar/win-timezone-utils
```

*注意：需要vue 3.0.0以上版本

当前支持中文、英文、法语三种语言切换

### 使用

```bash
import { computed, ref } from 'vue';
import winTimezoneUtils,{ LanguageEnum } from '@grombolar/win-timezone-utils'
const timezones = computed(() => winTimezoneUtils.timeZones)
const lang = ref('zh-CN')
const changeLanguage = (val: LanguageEnum) => {
  lang.value = val;
  winTimezoneUtils.setLang(val);
}
```
