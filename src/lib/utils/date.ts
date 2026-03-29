import { format, addDays, addHours, addMinutes, startOfDay, endOfDay, parse, setHours, setMinutes } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TZ = "Asia/Tokyo";

export function nowJST(): Date {
  return toZonedTime(new Date(), TZ);
}

export function todayJST(): string {
  return format(nowJST(), "yyyy-MM-dd");
}

export function toISO(date: Date): string {
  return fromZonedTime(date, TZ).toISOString();
}

export function startOfDayJST(dateStr?: string): string {
  const base = dateStr ? parse(dateStr, "yyyy-MM-dd", new Date()) : nowJST();
  return toISO(startOfDay(base));
}

export function endOfDayJST(dateStr?: string): string {
  const base = dateStr ? parse(dateStr, "yyyy-MM-dd", new Date()) : nowJST();
  return toISO(endOfDay(base));
}

export function formatJST(date: Date | string, fmt: string = "M月d日(E) HH:mm"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(toZonedTime(d, TZ), fmt);
}

/**
 * Parse Japanese natural language date/time expressions.
 * Returns ISO 8601 string in JST.
 *
 * Supports: 今日, 明日, 明後日, 来週の月曜, N時, N時半, 午前/午後
 */
export function parseJapaneseDateTime(text: string): { date?: string; time?: string } {
  const now = nowJST();
  let targetDate: Date | undefined;
  let hours: number | undefined;
  let minutes: number | undefined;

  // Date parsing
  if (text.includes("今日")) {
    targetDate = now;
  } else if (text.includes("明後日")) {
    targetDate = addDays(now, 2);
  } else if (text.includes("明日")) {
    targetDate = addDays(now, 1);
  } else if (text.includes("来週")) {
    const dayMap: Record<string, number> = {
      "月曜": 1, "火曜": 2, "水曜": 3, "木曜": 4, "金曜": 5, "土曜": 6, "日曜": 0,
    };
    for (const [key, dow] of Object.entries(dayMap)) {
      if (text.includes(key)) {
        const currentDow = now.getDay();
        const daysUntil = ((dow - currentDow + 7) % 7) + 7;
        targetDate = addDays(now, daysUntil);
        break;
      }
    }
  }

  // Time parsing
  const pmMatch = text.match(/午後(\d{1,2})時/);
  const amMatch = text.match(/午前(\d{1,2})時/);
  const hourMatch = text.match(/(\d{1,2})時/);
  const halfMatch = text.includes("半");

  if (pmMatch) {
    hours = parseInt(pmMatch[1]) + (parseInt(pmMatch[1]) < 12 ? 12 : 0);
  } else if (amMatch) {
    hours = parseInt(amMatch[1]);
  } else if (hourMatch) {
    hours = parseInt(hourMatch[1]);
  }

  if (halfMatch) {
    minutes = 30;
  } else {
    const minMatch = text.match(/(\d{1,2})分/);
    minutes = minMatch ? parseInt(minMatch[1]) : 0;
  }

  // N時間後, N分後
  const hoursLater = text.match(/(\d+)時間後/);
  const minsLater = text.match(/(\d+)分後/);
  if (hoursLater) {
    const future = addHours(now, parseInt(hoursLater[1]));
    if (minsLater) {
      const futureWithMins = addMinutes(future, parseInt(minsLater[1]));
      return {
        date: format(futureWithMins, "yyyy-MM-dd"),
        time: format(futureWithMins, "HH:mm"),
      };
    }
    return {
      date: format(future, "yyyy-MM-dd"),
      time: format(future, "HH:mm"),
    };
  }
  if (minsLater) {
    const future = addMinutes(now, parseInt(minsLater[1]));
    return {
      date: format(future, "yyyy-MM-dd"),
      time: format(future, "HH:mm"),
    };
  }

  const result: { date?: string; time?: string } = {};
  if (targetDate) {
    result.date = format(targetDate, "yyyy-MM-dd");
  }
  if (hours !== undefined) {
    let d = targetDate || now;
    d = setHours(d, hours);
    d = setMinutes(d, minutes || 0);
    result.time = format(d, "HH:mm");
    if (!result.date) {
      result.date = format(d, "yyyy-MM-dd");
    }
  }

  return result;
}
