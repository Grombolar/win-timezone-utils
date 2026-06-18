import { DateTime } from 'luxon'

import { ianaFromWinId, winIdFromIana } from '../constant/winIanaMap'

interface TimeZone {
  offset: string
  zone_name: string
  id: string
  winId?: string
}

/**
 * 判断一个时区 id 是不是「看起来像」Windows 时区 id。
 * Windows 时区 id 含有空格（如 "China Standard Time"），IANA 的则是 "/分隔"。
 */
export function isWindowsTimezoneId(tz: string): boolean {
  if (!tz) return false
  // IANA 的常见格式：Continent/City 或 Etc/GMT[+-]\d+
  if (tz.includes('/')) return false
  // Windows 时区 id 通常带有 "Standard Time" 或 "UTC" 前缀
  if (/Standard Time$/i.test(tz)) return true
  if (/^UTC[+-]?/i.test(tz)) return true
  // 一般兜底：没有 '/' 且有空格，视为 Windows 风格
  return tz.includes(' ')
}

/**
 * 将任意（Windows 或 IANA）时区 id 规范化为 IANA。
 * 若传入值已经是 IANA，则直接返回；若找不到映射，退回入参。
 */
export function toIanaTimezoneId(tz: string): string {
  if (!tz) return tz
  // 已经是 IANA 风格（含 '/'）或直接命中 IANA 表
  if (tz.includes('/') && winIdFromIana[tz]) return tz
  if (ianaFromWinId[tz]) return ianaFromWinId[tz]
  // 大小写不敏感查找
  const lower = tz.toLowerCase()
  for (const key of Object.keys(ianaFromWinId)) {
    if (key.toLowerCase() === lower) return ianaFromWinId[key]
  }
  return tz
}

/**
 * 将任意（Windows 或 IANA）时区 id 规范化为 Windows 时区 id。
 * 若找不到映射，退回入参。
 */
export function toWindowsTimezoneId(tz: string): string {
  if (!tz) return tz
  if (winIdFromIana[tz]) return winIdFromIana[tz]
  if (ianaFromWinId[tz]) return tz
  const lower = tz.toLowerCase()
  for (const [key, iana] of Object.entries(ianaFromWinId)) {
    if (key.toLowerCase() === lower || iana.toLowerCase() === lower) return key
  }
  return tz
}

/** 将时间转换为对应时区的时间。
 *
 * 兼容 Windows 与 IANA 两种时区 id：若是 Windows 风格，会先规范化为 IANA 再交给 Luxon。
 */
export function formatterTimeInTimezone(
  time: number,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const ianaTz = toIanaTimezoneId(timezone)
  const dateTime = DateTime.fromMillis(time, { zone: ianaTz })
  const formatted = dateTime.toFormat('yyyy-MM-dd HH:mm:ss')
  return formatted
}

/** 将格式化的时间转为对应时区的时间戳。
 *
 * 兼容 Windows 与 IANA 两种时区 id。
 */
export function getTimestempByTimezone(
  timeStr: string,
  timezone: string,
  format = 'yyyy-MM-dd HH:mm:ss',
) {
  const ianaTz = toIanaTimezoneId(timezone)
  const dateTime = DateTime.fromFormat(timeStr, format, { zone: ianaTz })
  const utcTime = dateTime.toUTC()
  const timestamp = utcTime.toMillis()
  return timestamp
}

/**
 * 处理夏令时。
 * 与旧版保持一致，按动态 offset 重排；新增 `winId` 字段会原样保留。
 */
export function getTimeZonesConsideringDST<T extends TimeZone>(timeZones: T[]) {
  // 当前UTC时间
  const nowUtc = DateTime.utc()
  const processed = timeZones.map((tz, originalIndex) => {
    // 对应时区时间（使用 IANA id 计算）
    const dtInZone = nowUtc.setZone(tz.id)
    let dynamicOffsetStr = tz.offset
    let isDstNow = false
    // 是否在夏令时
    if (dtInZone.isInDST) {
      // 如果在夏令时，使用 Luxon 的 dtInZone.offset 动态计算新的偏移
      const offsetMinutes = dtInZone.offset // Luxon 的 offset 返回相对于 UTC 的分钟数
      // 向下取整到分钟
      const totalMinutes = Math.floor(offsetMinutes)
      const sign = totalMinutes >= 0 ? '+' : '-'
      const absMins = Math.abs(totalMinutes)
      const hours = Math.floor(absMins / 60)
      const minutes = absMins % 60

      dynamicOffsetStr = `(UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')})`
      isDstNow = true
    }

    return {
      ...tz,
      final_offset: dynamicOffsetStr,
      isDstNow,
      _originalIndex: originalIndex,
    }
  })

  // 按 final_offset 重新排序，相同 offset 内保持原始顺序
  return processed.sort((a, b) => {
    const minsA = parseOffsetMinutes(a.final_offset)
    const minsB = parseOffsetMinutes(b.final_offset)
    if (minsA !== minsB) return minsA - minsB
    return a._originalIndex - b._originalIndex
  })
}

function parseOffsetMinutes(offset: string): number {
  if (offset === '(UTC)') return 0
  const m = offset.match(/\(UTC([+-])(\d{2}):(\d{2})\)/)
  if (!m) return 0
  const sign = m[1] === '+' ? 1 : -1
  return sign * (parseInt(m[2]) * 60 + parseInt(m[3]))
}
