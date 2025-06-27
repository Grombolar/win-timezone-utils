import { reactive } from 'vue';
import { LanguageEnum } from './constant/Language';
import { baseZone } from './constant/TimeZone';
import { setLocale, t } from './i18n/index';
import { getTimeZonesConsideringDST } from './utils/dateTimeUtils';

/** 处理夏令时 */
const list = getTimeZonesConsideringDST(baseZone)

const createTimeZones = () => {
    return list.map(item => {
        return {
            label: item.offset + ' ' + t(item.zone_name),
            value: item.id
        }
    })
}

const winTimezoneUtils = reactive({
  timeZones: createTimeZones(),
  setLang(val: LanguageEnum) {
    setLocale(val)
    this.timeZones = createTimeZones()
  }
})

export { formatterTimeInTimezone, getTimestempByTimezone } from './utils/dateTimeUtils'
export { LanguageEnum } from './constant/Language'
export default winTimezoneUtils
