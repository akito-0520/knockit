import { describe, expect, it } from "vitest";

import { presetSchema } from "./preset";

const base = { label: "会議中", color: "#3B82F6", displayOrder: 0 };

describe("presetSchema", () => {
  it("有効な値を受け入れる", () => {
    expect(presetSchema.safeParse(base).success).toBe(true);
  });

  it("ラベルが空だとエラーになる", () => {
    const result = presetSchema.safeParse({ ...base, label: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("ラベルを入力してください");
  });

  it("ラベルが20文字を超えるとエラーになる", () => {
    const result = presetSchema.safeParse({ ...base, label: "a".repeat(21) });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "20文字以内で入力してください",
    );
  });

  it.each(["blue", "#FFF", "#GGGGGG", "3B82F6"])(
    "色コードの形式が不正だとエラーになる: %s",
    (color) => {
      const result = presetSchema.safeParse({ ...base, color });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "#RRGGBB形式で入力してください",
      );
    },
  );

  it("displayOrderが負の数だとエラーになる", () => {
    const result = presetSchema.safeParse({ ...base, displayOrder: -1 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "0以上の数値を入力してください",
    );
  });
});
