import { Enum } from 'enum-plus';

export const LanguageEnum = Enum({
    ZH: {value: 'zh-CN', label: '中文'},
    EN: {value: 'en', label: 'English'},
    FR: {value: 'fr', label: 'Français'},
} as const)

export type LanguageEnumType = typeof LanguageEnum.valueType
