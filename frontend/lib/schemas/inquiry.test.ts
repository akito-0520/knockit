import { describe, expect, it } from "vitest";

import { inquirySchema } from "./inquiry";

const base = {
  category: "bug" as const,
  body: "問題が発生しています。",
  replyRequested: false,
};

describe("inquirySchema", () => {
  it("返信不要な場合はreplyToが無くても通る", () => {
    const result = inquirySchema.safeParse(base);

    expect(result.success).toBe(true);
  });

  it("本文が5文字未満だとエラーになる", () => {
    const result = inquirySchema.safeParse({ ...base, body: "短い" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("5文字以上で入力してください");
  });

  it("本文が5000文字を超えるとエラーになる", () => {
    const result = inquirySchema.safeParse({ ...base, body: "a".repeat(5001) });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "5000文字以内で入力してください",
    );
  });

  it("categoryがenum以外だとエラーになる", () => {
    const result = inquirySchema.safeParse({ ...base, category: "unknown" });

    expect(result.success).toBe(false);
  });

  it("返信希望かつメールアドレスが有効なら通る", () => {
    const result = inquirySchema.safeParse({
      ...base,
      replyRequested: true,
      replyTo: "taro@example.com",
    });

    expect(result.success).toBe(true);
  });

  it("返信希望なのにreplyToが未入力だとエラーになる", () => {
    const result = inquirySchema.safeParse({
      ...base,
      replyRequested: true,
      replyTo: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "返信先のメールアドレスを入力してください",
    );
    expect(result.error?.issues[0].path).toEqual(["replyTo"]);
  });

  it("返信希望でreplyToがメール形式でないとエラーになる", () => {
    const result = inquirySchema.safeParse({
      ...base,
      replyRequested: true,
      replyTo: "not-an-email",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "メールアドレスの形式が正しくありません",
    );
  });
});
