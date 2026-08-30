import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createApiKey, deleteApiKey, getApiKeys } from "./apiKey";

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

describe("getApiKeys", () => {
  it("一覧をキャメルケースで取得する", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: [
          {
            id: "1",
            label: "iOS",
            key_prefix: "knk_abcd1234",
            last_used_at: null,
            created_at: "2026-08-30T00:00:00Z",
          },
        ],
      }),
    );

    const result = await getApiKeys("test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/api-keys"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual([
      {
        id: "1",
        label: "iOS",
        keyPrefix: "knk_abcd1234",
        lastUsedAt: null,
        createdAt: "2026-08-30T00:00:00Z",
      },
    ]);
  });
});

describe("createApiKey", () => {
  it("labelをPOSTし、生キーを含む応答を返す", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          success: true,
          data: {
            id: "1",
            label: "iOS ショートカット",
            key: "knk_rawsecret",
            key_prefix: "knk_rawsecre",
            created_at: "2026-08-30T00:00:00Z",
          },
        },
        201,
      ),
    );

    const result = await createApiKey("test-token", {
      label: "iOS ショートカット",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/api-keys"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ label: "iOS ショートカット" }),
      }),
    );
    expect(result.key).toBe("knk_rawsecret");
    expect(result.keyPrefix).toBe("knk_rawsecre");
  });
});

describe("deleteApiKey", () => {
  it("DELETEを送り、成功時は例外を投げない", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(deleteApiKey("test-token", "abc")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/api-keys/abc"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("失敗時は例外を投げる", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(deleteApiKey("test-token", "abc")).rejects.toThrow(
      "HTTP error: 403",
    );
  });
});
