import { describe, expect, it } from "vitest";

import { setupUserSchema } from "./user";

describe("setupUserSchema", () => {
  it("有効なユーザー名と表示名を受け入れる", () => {
    const result = setupUserSchema.safeParse({
      username: "taro-123",
      displayName: "山田太郎",
    });

    expect(result.success).toBe(true);
  });

  it("ユーザー名が3文字未満だとエラーになる", () => {
    const result = setupUserSchema.safeParse({
      username: "ab",
      displayName: "山田太郎",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("3文字以上で入力してください");
  });

  it("ユーザー名が30文字を超えるとエラーになる", () => {
    const result = setupUserSchema.safeParse({
      username: "a".repeat(31),
      displayName: "山田太郎",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "30文字以内で入力してください",
    );
  });

  it.each([
    ["大文字を含む", "Taro123"],
    ["先頭がハイフン", "-taro123"],
    ["末尾がハイフン", "taro123-"],
    ["記号を含む", "taro_123"],
  ])("%sユーザー名はエラーになる: %s", (_label, username) => {
    const result = setupUserSchema.safeParse({
      username,
      displayName: "山田太郎",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "小文字英数字とハイフンのみ使用できます",
    );
  });

  it("表示名が空だとエラーになる", () => {
    const result = setupUserSchema.safeParse({
      username: "taro123",
      displayName: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("表示名を入力してください");
  });

  it("表示名が100文字を超えるとエラーになる", () => {
    const result = setupUserSchema.safeParse({
      username: "taro123",
      displayName: "あ".repeat(101),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "100文字以内で入力してください",
    );
  });
});
