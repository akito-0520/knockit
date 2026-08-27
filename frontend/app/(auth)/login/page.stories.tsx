import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, userEvent, within } from "storybook/test";

import { createClient } from "@/lib/supabase/client";
import LoginPage from "./page";

const meta = {
  title: "app/LoginPage",
  component: LoginPage,
  tags: ["autodocs"],
  // createClient()はレンダー時に呼ばれるため、マウント前に実行されるbeforeEachでモックする
  beforeEach: () => {
    mocked(createClient).mockReturnValue({
      auth: { signInWithOAuth: fn() },
    } as unknown as ReturnType<typeof createClient>);
  },
} satisfies Meta<typeof LoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Googleログインボタンと利用規約リンクが表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("button", { name: /Google でログイン/ }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "利用規約" }),
    ).toHaveAttribute("href", "/terms");
  },
};

export const ClickLogin: Story = {
  name: "ログインボタンをクリックするとGoogle OAuthを開始する",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole("button", { name: /Google でログイン/ }),
    );

    const supabase = mocked(createClient).mock.results[0]?.value as {
      auth: { signInWithOAuth: ReturnType<typeof fn> };
    };
    await expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google" }),
    );
  },
};
