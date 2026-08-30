import { describe, expect, it } from "vitest";

import { authHeaders, camelize, unwrap } from ".";

describe("authHeaders", () => {
  it("トークンを含むAuthorizationヘッダーを組み立てる", () => {
    expect(authHeaders("abc123")).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer abc123",
    });
  });
});

describe("camelize", () => {
  it("スネークケースのキーをキャメルケースに変換する", () => {
    expect(camelize({ display_name: "山田太郎", user_id: 1 })).toEqual({
      displayName: "山田太郎",
      userId: 1,
    });
  });

  it("ネストしたオブジェクトや配列も再帰的に変換する", () => {
    expect(
      camelize({
        display_order: 0,
        items: [{ item_id: "1" }, { item_id: "2" }],
      }),
    ).toEqual({
      displayOrder: 0,
      items: [{ itemId: "1" }, { itemId: "2" }],
    });
  });

  it("プリミティブな値はそのまま返す", () => {
    expect(camelize("plain")).toBe("plain");
    expect(camelize(42)).toBe(42);
    expect(camelize(null)).toBe(null);
  });
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("unwrap", () => {
  it("成功レスポンスのdataをキャメルケースにして返す", async () => {
    const res = jsonResponse({
      success: true,
      data: { display_name: "山田太郎" },
    });

    await expect(unwrap(res)).resolves.toEqual({ displayName: "山田太郎" });
  });

  it("HTTPステータスが異常な場合はエラーメッセージで例外を投げる", async () => {
    const res = jsonResponse({ error: "権限がありません" }, 403);

    await expect(unwrap(res)).rejects.toThrow("権限がありません");
  });

  it("HTTPステータスは200でもsuccess:falseなら例外を投げる", async () => {
    const res = jsonResponse({ success: false, error: "処理に失敗しました" });

    await expect(unwrap(res)).rejects.toThrow("処理に失敗しました");
  });

  it("エラーメッセージが無い場合はHTTPステータスから汎用メッセージを組み立てる", async () => {
    const res = jsonResponse({}, 500);

    await expect(unwrap(res)).rejects.toThrow("HTTP error: 500");
  });
});
