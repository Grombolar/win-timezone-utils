import type { App, InjectionKey, Ref } from 'vue'
import { computed, readonly, ref, watch } from 'vue'

import { LanguageEnum } from './constant/Language'
import { baseZone } from './constant/TimeZone'
import { setLocale, t } from './i18n'
import {
  getTimeZonesConsideringDST,
  formatterTimeInTimezone,
  getTimestempByTimezone
} from './utils/dateTimeUtils'


const list = getTimeZonesConsideringDST(baseZone)
const _locale = ref<LanguageEnum>(LanguageEnum.EN)

const createTimeZones = () => {
  return list.map(item => ({
    label: (item.final_offset || item.offset) + ' ' + t(item.zone_name),
    value: item.id
  }))
}

export const timeZones = computed(() => {
  _locale.value                // 建立依赖；值本身不用
  return createTimeZones()
})

export const winTimezoneUtils = readonly({
  timeZones
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
      { immediate: true }
    )
  }
}

export default { install }
export { formatterTimeInTimezone, getTimestempByTimezone }
export { LanguageEnum }