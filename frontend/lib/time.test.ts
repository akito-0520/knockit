import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "./time";

const now = new Date("2026-08-30T12:00:00Z").getTime();

describe("formatRelativeTime", () => {
  it("1分未満は「たった今」を返す", () => {
    expect(formatRelativeTime("2026-08-30T11:59:30Z", now)).toBe("たった今");
  });

  it("未来の時刻も「たった今」を返す", () => {
    expect(formatRelativeTime("2026-08-30T12:05:00Z", now)).toBe("たった今");
  });

  it("数分前を相対表記にする", () => {
    expect(formatRelativeTime("2026-08-30T11:57:00Z", now)).toBe("3 分前");
  });

  it("数時間前を相対表記にする", () => {
    expect(formatRelativeTime("2026-08-30T09:00:00Z", now)).toBe("3 時間前");
  });

  it("数日前を相対表記にする", () => {
    expect(formatRelativeTime("2026-08-27T12:00:00Z", now)).toBe("3 日前");
  });

  it("不正な日時文字列は空文字を返す", () => {
    expect(formatRelativeTime("not-a-date", now)).toBe("");
  });
});
