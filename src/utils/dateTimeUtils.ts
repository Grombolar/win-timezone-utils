import { DateTime } from 'luxon';

interface TimeZone {
  offset: string;
  zone_name: string;
  id: string
}

/** 将时间转换为对应时区的时间 */
export function formatterTimeInTimezone(time: number, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const dateTime = DateTime.fromMillis(time, { zone: timezone });
  const formatted = dateTime.toFormat('yyyy-MM-dd HH:mm:ss');
  return formatted
}

/** 将格式化的时间转为对应时区的时间戳 */
export function getTimestempByTimezone(timeStr: string, timezone: string, format = 'yyyy-MM-dd HH:mm:ss') {
  const dateTime = DateTime.fromFormat(timeStr, format, {
    zone: timezone
  })
  const utcTime = dateTime.toUTC();
  const timestamp = utcTime.toMillis();
  return timestamp
}

interface TimeZone {
  offset: string;
  zone_name: string;
  id: string
}

/**
 *  处理夏令时
 * @param timeZones 
 * @returns 
 */
export function getTimeZonesConsideringDST(timeZones: TimeZone[]) {
  // 当前UTC时间
  const nowUtc = DateTime.utc();
  return timeZones.map((tz) => {
    // 对应时区时间
    const dtInZone = nowUtc.setZone(tz.id);
    // 是否在夏令时
    if (dtInZone.isInDST) {
      // 如果在夏令时，我们使用 Luxon 的 dtInZone.offset 动态计算新的偏移
      const offsetMinutes = dtInZone.offset; // Luxon 的 offset 返回相对于 UTC 的分钟数，可带小数
      // 注意：offset 可能是浮点数，对于 .5 或 .75 这类，需要转换成分
      // 向下取整到分钟
      const totalMinutes = Math.floor(offsetMinutes);
      const sign = totalMinutes >= 0 ? '+' : '-';
      const absMins = Math.abs(totalMinutes);
      const hours = Math.floor(absMins / 60);
      const minutes = absMins % 60;

      const dynamicOffsetStr = `(UTC${sign}${String(hours).padStart(2, '0')}:${String(
        minutes
      ).padStart(2, '0')})`;

      return {
        ...tz,
        final_offset: dynamicOffsetStr,
        isDstNow: true
      };
    } else {
      return {
        ...tz,
        final_offset: tz.offset,
        isDstNow: false
      };
    }
  });
}