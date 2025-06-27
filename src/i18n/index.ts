import { LanguageEnum , type LanguageEnumType } from '../constant/Language';

function siphonI18n(prefix:LanguageEnumType = LanguageEnum.ZH) {
    return Object.fromEntries(
        Object.entries(
            import.meta.glob('./locales/*.y(a)?ml', { eager: true })
        ).map(([key, value]: any) => {
            const matched = key.match(/([A-Za-z0-9-_]+)\./i)[1];
            return [matched, value.default];
        })
    )[prefix];
}

let currentLocale: LanguageEnumType = LanguageEnum.ZH;

export const localesConfigs = {
    [LanguageEnum.ZH]: {
        ...siphonI18n(),
    },
    [LanguageEnum.EN]: {
        ...siphonI18n(LanguageEnum.EN),
    },
    [LanguageEnum.FR]: {
        ...siphonI18n(LanguageEnum.FR),
    }
};

// 设置当前语言
export function setLocale(locale: LanguageEnumType) {
  currentLocale = locale;
}

// 获取当前语言
export function getLocale() {
  return currentLocale;
}

// 获取翻译文本
export function t(key: string, defaultText?: string): string {
  const pack = localesConfigs[currentLocale];
  if (!pack) {
    return defaultText || key;
  }
  
  // 支持嵌套键，如 "user.name"
  const keys = key.split('.');
  let value: any = pack;
  
  for (const k of keys) {
    if (value[k] === undefined) {
      return defaultText || key;
    }
    value = value[k];
  }
  
  return value || defaultText || key;
}

// 导出所有语言包（用于外部访问）
export function getAllLanguagePacks() {
  return localesConfigs;
}