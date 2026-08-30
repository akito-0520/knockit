import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, setupUser, updateUser } from "./auth";

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

describe("setupUser", () => {
  it("ユーザー名と表示名をスネークケースで送信し、キャメルケースのユーザー情報を受け取る", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { username: "taro", display_name: "山田太郎" },
      }),
    );

    const result = await setupUser("test-token", {
      username: "taro",
      displayName: "山田太郎",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/setup"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
        body: JSON.stringify({ username: "taro", display_name: "山田太郎" }),
      }),
    );
    expect(result).toEqual({ username: "taro", displayName: "山田太郎" });
  });
});

describe("getCurrentUser", () => {
  it("GETで自分のユーザー情報を取得する", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { username: "taro", display_name: "山田太郎" },
      }),
    );

    const result = await getCurrentUser("test-token");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/me"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual({ username: "taro", displayName: "山田太郎" });
  });
});

describe("updateUser", () => {
  it("表示名をPATCHで更新する", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { username: "taro", display_name: "新しい名前" },
      }),
    );

    const result = await updateUser("test-token", {
      displayName: "新しい名前",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/me"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ display_name: "新しい名前" }),
      }),
    );
    expect(result).toEqual({ username: "taro", displayName: "新しい名前" });
  });

  it("APIがエラーを返した場合は例外を投げる", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "表示名が不正です" }, 400),
    );

    await expect(updateUser("test-token", { displayName: "" })).rejects.toThrow(
      "表示名が不正です",
    );
  });
});
