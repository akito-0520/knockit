import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("複数のクラス名を結合する", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
  });

  it("falsy値を無視する", () => {
    expect(cn("px-2", false && "hidden", undefined, null, "py-4")).toBe(
      "px-2 py-4",
    );
  });

  it("競合するTailwindクラスは後勝ちでマージする", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("配列で渡したクラス名も結合する", () => {
    expect(cn(["px-2", "py-4"], "text-sm")).toBe("px-2 py-4 text-sm");
  });
});
