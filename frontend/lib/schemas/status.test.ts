import { describe, expect, it } from "vitest";

import { statusSchema } from "./status";

describe("statusSchema", () => {
  it("presetIdのみでも通る", () => {
    expect(
      statusSchema.safeParse({ presetId: "1", customMessage: "" }).success,
    ).toBe(true);
  });

  it("customMessageのみでも通る", () => {
    expect(
      statusSchema.safeParse({ presetId: null, customMessage: "会議中です" })
        .success,
    ).toBe(true);
  });

  it("presetIdもcustomMessageも無いとエラーになる", () => {
    const result = statusSchema.safeParse({
      presetId: null,
      customMessage: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "メッセージを入力してください",
    );
  });

  it("customMessageが200文字を超えるとエラーになる", () => {
    const result = statusSchema.safeParse({
      presetId: "1",
      customMessage: "a".repeat(201),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "200文字以内で入力してください",
    );
  });
});
