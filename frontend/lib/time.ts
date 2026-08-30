const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

/**
 * ISO8601 の日時文字列を「3分前」「2時間前」のような相対表記にする。
 * 未来の時刻や 1 分未満は「たった今」を返す。
 * `now` を渡すとその時刻を基準にする（テスト用途）。
 */
export function formatRelativeTime(
  iso: string,
  now: number = Date.now(),
): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return "";

  let duration = (target - now) / 1000;
  if (duration > -60) return "たった今";

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return "";
}
