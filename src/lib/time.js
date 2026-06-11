import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Returns the current ISO string in UTC format for database storage.
 */
export const getUTCNow = () => {
  return dayjs.utc().toISOString()
}

/**
 * Formats a UTC timestamp from the database into the user's local timezone.
 * Example format: "10:30 AM" or "MM/DD/YYYY" depending on your needs.
 */
export const toLocalTime = (utcTimestamp, formatStr = 'h:mm A') => {
  if (!utcTimestamp) return ''
  return dayjs.utc(utcTimestamp).local().format(formatStr)
}

/**
 * Formats a UTC timestamp into the user's local timezone date.
 */
export const toLocalDate = (utcTimestamp, formatStr = 'MMM D, YYYY') => {
  if (!utcTimestamp) return ''
  return dayjs.utc(utcTimestamp).local().format(formatStr)
}

/**
 * Returns today's date in 'YYYY-MM-DD' formatted as UTC.
 * Useful for matching daily_logs log_date.
 */
export const getUTCTodayDate = () => {
  return dayjs.utc().format('YYYY-MM-DD')
}
