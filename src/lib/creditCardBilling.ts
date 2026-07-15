import "server-only";

// ---- 日本の祝日判定 ----
// 外部ライブラリに頼らず自前で計算する(ネットワーク越しの動作検証ができない環境のため、
// 決定的で検証しやすい計算式のみを使う)

function nthMondayOfMonth(year: number, month1indexed: number, nth: number): Date {
  const first = new Date(year, month1indexed - 1, 1);
  const firstMonday = 1 + ((8 - first.getDay()) % 7);
  const day = firstMonday + (nth - 1) * 7;
  return new Date(year, month1indexed - 1, day);
}

// 春分の日・秋分の日の近似計算式 (1980-2099年で有効な、天文計算に基づく既知の式)
function vernalEquinoxDay(year: number): number {
  return Math.floor(20.8431 + 0.242194 * (year - 1980)) - Math.floor((year - 1980) / 4);
}
function autumnalEquinoxDay(year: number): number {
  return Math.floor(23.2488 + 0.242194 * (year - 1980)) - Math.floor((year - 1980) / 4);
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getJapaneseHolidays(year: number): Date[] {
  return [
    new Date(year, 0, 1), // 元日
    nthMondayOfMonth(year, 1, 2), // 成人の日
    new Date(year, 1, 11), // 建国記念の日
    new Date(year, 1, 23), // 天皇誕生日
    new Date(year, 2, vernalEquinoxDay(year)), // 春分の日
    new Date(year, 3, 29), // 昭和の日
    new Date(year, 4, 3), // 憲法記念日
    new Date(year, 4, 4), // みどりの日
    new Date(year, 4, 5), // こどもの日
    nthMondayOfMonth(year, 7, 3), // 海の日
    new Date(year, 7, 11), // 山の日
    nthMondayOfMonth(year, 9, 3), // 敬老の日
    new Date(year, 8, autumnalEquinoxDay(year)), // 秋分の日
    nthMondayOfMonth(year, 10, 2), // スポーツの日
    new Date(year, 10, 3), // 文化の日
    new Date(year, 10, 23), // 勤労感謝の日
  ];
}

function isJapaneseHoliday(date: Date): boolean {
  return getJapaneseHolidays(date.getFullYear()).some((h) => isSameDate(h, date));
}

export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6 && !isJapaneseHoliday(date);
}

// 土日・祝日なら、次の平日まで送る(振替休日が続く場合も1日ずつ進めて自然に対応する)
export function nextBusinessDay(date: Date): Date {
  const d = new Date(date);
  while (!isBusinessDay(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

// ---- クレジットカードの締め日/引き落としサイクル計算 ----

function clampDay(year: number, month1indexed: number, day: number): Date {
  const daysInMonth = new Date(year, month1indexed, 0).getDate();
  return new Date(year, month1indexed - 1, Math.min(day, daysInMonth));
}

export interface BillingCycle {
  cycleStart: Date;
  cycleEnd: Date;
  paymentDate: Date;
}

function buildCycleFromEnd(
  cycleEnd: Date,
  closingDay: number,
  paymentDay: number,
  paymentMonthOffset: number
): BillingCycle {
  const cycleEndYear = cycleEnd.getFullYear();
  const cycleEndMonth = cycleEnd.getMonth() + 1;
  const prevMonth = cycleEndMonth === 1 ? 12 : cycleEndMonth - 1;
  const prevYear = cycleEndMonth === 1 ? cycleEndYear - 1 : cycleEndYear;
  const prevClosing = clampDay(prevYear, prevMonth, closingDay);
  const cycleStart = new Date(prevClosing);
  cycleStart.setDate(cycleStart.getDate() + 1);

  const paymentMonthRaw = cycleEndMonth + paymentMonthOffset;
  const paymentYear = cycleEndYear + Math.floor((paymentMonthRaw - 1) / 12);
  const paymentMonth = ((paymentMonthRaw - 1) % 12) + 1;
  const rawPaymentDate = clampDay(paymentYear, paymentMonth, paymentDay);
  const paymentDate = nextBusinessDay(rawPaymentDate);

  return { cycleStart, cycleEnd, paymentDate };
}

// referenceDate時点で「進行中、または締まったばかり」の請求サイクルを返す
export function getCurrentBillingCycle(
  closingDay: number,
  paymentDay: number,
  paymentMonthOffset: number,
  referenceDate: Date = new Date()
): BillingCycle {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;

  const closingThisMonth = clampDay(year, month, closingDay);

  let cycleEnd: Date;
  if (referenceDate <= closingThisMonth) {
    cycleEnd = closingThisMonth;
  } else {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    cycleEnd = clampDay(nextYear, nextMonth, closingDay);
  }

  return buildCycleFromEnd(cycleEnd, closingDay, paymentDay, paymentMonthOffset);
}

// 2つの日付区間のうち、指定した年月と重なる日数を数える
function daysOverlappingMonth(start: Date, end: Date, year: number, month1indexed: number): number {
  const monthStart = new Date(year, month1indexed - 1, 1);
  const monthEnd = new Date(year, month1indexed, 0);
  const overlapStart = start > monthStart ? start : monthStart;
  const overlapEnd = end < monthEnd ? end : monthEnd;
  if (overlapStart > overlapEnd) return 0;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((overlapEnd.getTime() - overlapStart.getTime()) / MS_PER_DAY) + 1;
}

// 家計簿ページの「表示中の月タブ」に対応するサイクルを返す。
// 締め日が月の前半(例:4日)なら、翌月に締まるサイクルの方が表示月と多く重なる
// (例: 6/5-7/4は6月に26日重なる)。締め日が月末付近(例:月末)なら、その月自体に
// 締まるサイクルがまるごと表示月と重なる。どちらが正しいかは締め日次第で変わるため、
// 「翌月に締まる候補」と「その月に締まる候補」の両方を計算し、表示月との重複日数が
// 多い方を採用する(固定の閾値やオフセットを仮定しない、常に正しい判定方法)。
export function getBillingCycleForMonth(
  closingDay: number,
  paymentDay: number,
  paymentMonthOffset: number,
  viewedYear: number,
  viewedMonth: number // 1-indexed
): BillingCycle {
  const closingInThisMonth = clampDay(viewedYear, viewedMonth, closingDay);
  const candidateThisMonth = buildCycleFromEnd(
    closingInThisMonth,
    closingDay,
    paymentDay,
    paymentMonthOffset
  );

  const nextMonth = viewedMonth === 12 ? 1 : viewedMonth + 1;
  const nextYear = viewedMonth === 12 ? viewedYear + 1 : viewedYear;
  const closingNextMonth = clampDay(nextYear, nextMonth, closingDay);
  const candidateNextMonth = buildCycleFromEnd(
    closingNextMonth,
    closingDay,
    paymentDay,
    paymentMonthOffset
  );

  const overlapThisMonth = daysOverlappingMonth(
    candidateThisMonth.cycleStart,
    candidateThisMonth.cycleEnd,
    viewedYear,
    viewedMonth
  );
  const overlapNextMonth = daysOverlappingMonth(
    candidateNextMonth.cycleStart,
    candidateNextMonth.cycleEnd,
    viewedYear,
    viewedMonth
  );

  return overlapNextMonth > overlapThisMonth ? candidateNextMonth : candidateThisMonth;
}
