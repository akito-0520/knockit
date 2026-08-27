import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createInquiry } from "./inquiry";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
afterAll(() => vi.unstubAllGlobals());

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  fetchMock.mockReset();
});

describe("createInquiry", () => {
  it("スネークケースで送信し、キャメルケースのレスポンスを受け取る", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          category: "bug",
          body: "問題が発生しています",
          reply_requested: true,
          reply_to: "taro@example.com",
          created_at: "2026-01-01T00:00:00Z",
        },
      }),
    );

    const result = await createInquiry("test-token", {
      category: "bug",
      body: "問題が発生しています",
      replyRequested: true,
      replyTo: "taro@example.com",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/inquiries"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
        body: JSON.stringify({
          category: "bug",
          body: "問題が発生しています",
          reply_requested: true,
          reply_to: "taro@example.com",
        }),
      }),
    );
    expect(result).toEqual({
      category: "bug",
      body: "問題が発生しています",
      replyRequested: true,
      replyTo: "taro@example.com",
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("APIがエラーを返した場合は例外を投げる", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "本文を入力してください" }, 400),
    );

    await expect(
      createInquiry("test-token", {
        category: "bug",
        body: "",
        replyRequested: false,
        replyTo: null,
      }),
    ).rejects.toThrow("本文を入力してください");
  });
});
