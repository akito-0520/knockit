import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPreset,
  deletePreset,
  getUserPresets,
  updatePreset,
} from "./preset";

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

describe("getUserPresets", () => {
  it("プリセット一覧をキャメルケースで取得する", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: [
          { id: "1", label: "会議中", color: "#3B82F6", display_order: 0 },
        ],
      }),
    );

    const result = await getUserPresets("test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/presets"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual([
      { id: "1", label: "会議中", color: "#3B82F6", displayOrder: 0 },
    ]);
  });
});

describe("createPreset", () => {
  it("ラベル・色・表示順をスネークケースで送信する", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { id: "1", label: "休憩中", color: "#3B82F6", display_order: 2 },
      }),
    );

    const result = await createPreset("test-token", {
      label: "休憩中",
      color: "#3B82F6",
      displayOrder: 2,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/presets"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          label: "休憩中",
          color: "#3B82F6",
          display_order: 2,
        }),
      }),
    );
    expect(result).toEqual({
      id: "1",
      label: "休憩中",
      color: "#3B82F6",
      displayOrder: 2,
    });
  });
});

describe("updatePreset", () => {
  it("指定したIDのプリセットをPATCHで更新する", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          id: "1",
          label: "会議中(更新)",
          color: "#3B82F6",
          display_order: 0,
        },
      }),
    );

    const result = await updatePreset("test-token", "1", {
      label: "会議中(更新)",
      color: "#3B82F6",
      displayOrder: 0,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/presets/1"),
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(result.label).toBe("会議中(更新)");
  });
});

describe("deletePreset", () => {
  it("削除成功時は例外を投げない", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(deletePreset("test-token", "1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/presets/1"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("削除失敗時はHTTPステータスを含む例外を投げる", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));

    await expect(deletePreset("test-token", "unknown")).rejects.toThrow(
      "HTTP error: 404",
    );
  });
});
