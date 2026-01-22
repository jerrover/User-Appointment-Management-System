import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// 1. Cek Start Time (Range: 08:00 - 16:59)
export function isWorkingHour(dateUTC: Date, timeZone: string): boolean {
  const localDate = toZonedTime(dateUTC, timeZone);
  const hour = localDate.getHours();
  
  return hour >= 8 && hour < 17;
}

export function isWorkingHourEnd(dateUTC: Date, timeZone: string): boolean {
  const localDate = toZonedTime(dateUTC, timeZone);
  const hour = localDate.getHours();
  const minute = localDate.getMinutes();

  if (hour === 17 && minute === 0) return true;

  return hour >= 8 && hour < 17;
}

export function toUTC(dateString: string, timeZone: string): Date {
    return fromZonedTime(dateString, timeZone);
}