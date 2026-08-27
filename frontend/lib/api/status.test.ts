import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getMyStatus, getPublicStatus, updateStatus } from "./status";

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

describe("getPublicStatus", () => {
  it("認証ヘッダーなしでユーザー名指定のステータスを取得する", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          display_name: "山田太郎",
          preset: {
            id: "1",
            label: "会議中",
            color: "#3B82F6",
            display_order: 0,
          },
          custom_message: "",
        },
      }),
    );

    const result = await getPublicStatus("taro");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/status/taro"),
    );
    expect(fetchMock.mock.calls[0]).toHaveLength(1);
    expect(result).toEqual({
      displayName: "山田太郎",
      preset: { id: "1", label: "会議中", color: "#3B82F6", displayOrder: 0 },
      customMessage: "",
    });
  });
});

describe("getMyStatus", () => {
  it("認証ヘッダー付きで自分のステータスを取得する", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          display_name: "山田太郎",
          preset: {
            id: "1",
            label: "会議中",
            color: "#3B82F6",
            display_order: 0,
          },
          custom_message: "",
        },
      }),
    );

    await getMyStatus("test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/status/me"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });
});

describe("updateStatus", () => {
  it("presetIdとcustomMessageをスネークケースでPUT送信する", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          display_name: "山田太郎",
          preset: {
            id: "1",
            label: "会議中",
            color: "#3B82F6",
            display_order: 0,
          },
          custom_message: "会議中です",
        },
      }),
    );

    const result = await updateStatus("test-token", {
      presetId: "1",
      customMessage: "会議中です",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/status/me"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ preset_id: "1", custom_message: "会議中です" }),
      }),
    );
    expect(result.customMessage).toBe("会議中です");
  });
});
