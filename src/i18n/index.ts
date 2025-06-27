import { LanguageEnum, } from '../constant/Language';

function siphonI18n(prefix = LanguageEnum.ZH) {
  return Object.fromEntries(
    Object.entries(
      import.meta.glob('./locales/*.y(a)?ml', { eager: true })
    ).map(([key, value]: any) => {
      const matched = key.match(/([A-Za-z0-9-_]+)\./i)[1];
      return [matched, value.default];
    })
  )[prefix];
}

let currentLocale = LanguageEnum.ZH;

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

export function setLocale(locale: LanguageEnum) {
  currentLocale = locale;
}

export function t(key: string, defaultText?: string): string {
  const pack = localesConfigs[currentLocale];
  if (!pack) {
    return defaultText || key;
  }

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


export const $t = (key: string, replace?: { [key: string]: string | number }): string => {
  if (!replace) {
    return key;
  }
  let result = key;
  Object.keys(replace).forEach((placeholder) => {
    result = result.replace(new RegExp(`{${placeholder}}`, 'g'), replace[placeholder].toString());
  });
  return result;
};
