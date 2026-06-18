import { DateTime } from 'luxon'

import { ianaFromWinId, ianaToWinId } from '../constant/winIanaMap'

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
  if (tz.includes('/')) return false
  if (/Standard Time$/i.test(tz)) return true
  if (/^UTC[+-]?/i.test(tz)) return true
  return tz.includes(' ')
}

/**
 * 将任意时区 id 规范化为 IANA。
 * - 已经是 IANA（含 '/' 或在 ianaToWinId 表中）：原样返回
 * - 是 Windows 时区 id：返回其 territory=001 主 IANA
 * - 找不到映射：原样返回
 */
export function toIanaTimezoneId(tz: string): string {
  if (!tz) return tz
  if (ianaToWinId[tz]) return tz
  if (ianaFromWinId[tz]) return ianaFromWinId[tz]
  if (tz.includes('/')) return tz // 未知 IANA，仍当作 IANA 处理
  return tz
}

/**
 * 将任意时区 id 规范化为 Windows 时区 id。
 * 支持具体城市别名（如 Asia/Hong_Kong -> China Standard Time）。
 */
export function toWindowsTimezoneId(tz: string): string {
  if (!tz) return tz
  if (ianaToWinId[tz]) return ianaToWinId[tz]
  if (ianaFromWinId[tz]) return tz // 已是 winId
  return tz
}

/**
 * 将任意时区 id（IANA 别名 / Windows id）解析为 baseZone 下拉项中使用的 value
 * （即 CLDR territory="001" 主 IANA），方便 v-model 初始化或反查下拉项。
 *
 * 例：
 *   resolveTimezoneToBaseValue('Asia/Hong_Kong')        => 'Asia/Shanghai'
 *   resolveTimezoneToBaseValue('Australia/Melbourne')   => 'Australia/Sydney'
 *   resolveTimezoneToBaseValue('China Standard Time')   => 'Asia/Shanghai'
 *   resolveTimezoneToBaseValue('Pacific/Kiritimati')    => 'Pacific/Kiritimati'
 */
export function resolveTimezoneToBaseValue(tz: string): string {
  if (!tz) return tz
  // Windows id：直接走 territory=001 主映射
  if (ianaFromWinId[tz]) return ianaFromWinId[tz]
  // 任意 IANA：先反查到 winId，再回到 territory=001 主映射
  const win = ianaToWinId[tz]
  if (win && ianaFromWinId[win]) return ianaFromWinId[win]
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
