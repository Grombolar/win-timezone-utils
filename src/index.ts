import type { App, InjectionKey, Ref } from 'vue'
import { computed, readonly, ref, watch } from 'vue'

import { LanguageEnum } from './constant/Language'
import { baseZone } from './constant/TimeZone'
import { setLocale, t } from './i18n'
import {
  getTimeZonesConsideringDST,
  formatterTimeInTimezone,
  getTimestempByTimezone,
} from './utils/dateTimeUtils'

const list = getTimeZonesConsideringDST(baseZone)
const _locale = ref<LanguageEnum>(LanguageEnum.EN)

/**
 * 生成 label（展示文本）。无论「传过来的 Windows 或 Linux 时区 ID 都使用同一份 label。 */
function buildLabel<T extends { final_offset?: string; offset: string; zone_name: string }>(item: T) {
  return (item.final_offset || item.offset) + ' ' + t(item.zone_name)
}

/**
 * Vue 下拉选项。`value` 是 IANA 时区 ID（Linux / Luxon 场景下直接使用）。
 * `winValue` 是对应的 Windows 时区 ID。
 *
 * Label（label 文案/展示文本）对于两种时区 ID 保持一致。
 */
export const timeZones = computed(() => {
  _locale.value // 建立依赖；值本身不用
  return list.map(item => ({
    label: buildLabel(item),
    value: item.id,        // IANA
    winValue: item.winId,   // Windows
  }))
})

/**
 * 以 Windows 时区 ID 作为 `value` 的下拉选项。
 * 如果从 Windows 抓取到的时区 ID 被用作数据交换时，请使用此数组。
 */
export const winTimeZones = computed(() => {
  _locale.value
  return list.map(item => ({
    label: buildLabel(item), // 与 timeZones 保持一致
    value: item.winId,     // Windows 时区 ID 作为 value
    ianaValue: item.id,     // 同时保留 IANA 便于互转
  }))
})

export const winTimezoneUtils = readonly({
  timeZones,
  winTimeZones,
})

export interface WinTzOptions {
  langRef?: Ref<LanguageEnum>
  i18n?: { global: { locale: Ref<string> } }
}

export type WinTimezoneUtils = typeof winTimezoneUtils
export const WinTimezoneKey: InjectionKey<WinTimezoneUtils> = Symbol('WinTimezoneUtils')

function install(app: App, options: WinTzOptions = {}) {
  const { langRef, i18n } = options

  app.provide(WinTimezoneKey, winTimezoneUtils)
  app.config.globalProperties.$winTimezone = winTimezoneUtils

  let source: Ref<any> | undefined = langRef
  if (!source && i18n) source = i18n.global.locale

  if (source) {
    watch(
      source,
      val => {
        const lang = val as LanguageEnum
        if (lang !== _locale.value) {
          _locale.value = lang
          setLocale(lang)
        }
      },
      { immediate: true },
    )
  }
}

export default { install }
export { formatterTimeInTimezone, getTimestempByTimezone }
export { toIanaTimezoneId, toWindowsTimezoneId, isWindowsTimezoneId } from './utils/dateTimeUtils'
export { LanguageEnum }
