import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

const createServerClientMock = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

beforeEach(() => {
  cookiesMock.mockReset();
  createServerClientMock.mockReset();
});

describe("createClient", () => {
  it("cookies()の内容をもとにcreateServerClientを呼び出す", async () => {
    const allCookies = [{ name: "session", value: "abc" }];
    const setMock = vi.fn();
    cookiesMock.mockResolvedValue({
      getAll: () => allCookies,
      set: setMock,
    });
    createServerClientMock.mockReturnValue("supabase-client");

    const { createClient } = await import("./server");
    const client = await createClient();

    expect(client).toBe("supabase-client");
    expect(createServerClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );

    const passedOptions = createServerClientMock.mock.calls[0][2];
    expect(passedOptions.cookies.getAll()).toEqual(allCookies);
  });

  it("setAllは各クッキーをcookieStore.setに反映する", async () => {
    const setMock = vi.fn();
    cookiesMock.mockResolvedValue({ getAll: () => [], set: setMock });
    createServerClientMock.mockReturnValue("supabase-client");

    const { createClient } = await import("./server");
    await createClient();

    const passedOptions = createServerClientMock.mock.calls[0][2];
    passedOptions.cookies.setAll([
      { name: "a", value: "1", options: { path: "/" } },
      { name: "b", value: "2", options: {} },
    ]);

    expect(setMock).toHaveBeenCalledWith("a", "1", { path: "/" });
    expect(setMock).toHaveBeenCalledWith("b", "2", {});
  });

  it("Server Componentから呼ばれてcookieStore.setが例外を投げても握りつぶす", async () => {
    const setMock = vi.fn(() => {
      throw new Error("Cookies can only be modified in a Server Action");
    });
    cookiesMock.mockResolvedValue({ getAll: () => [], set: setMock });
    createServerClientMock.mockReturnValue("supabase-client");

    const { createClient } = await import("./server");
    await createClient();

    const passedOptions = createServerClientMock.mock.calls[0][2];

    expect(() =>
      passedOptions.cookies.setAll([{ name: "a", value: "1", options: {} }]),
    ).not.toThrow();
  });
});
