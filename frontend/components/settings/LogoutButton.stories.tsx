import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, mocked, userEvent, within } from "storybook/test";

import { createClient } from "@/lib/supabase/client";
import LogoutButton from "./LogoutButton";

const meta = {
  title: "settings/LogoutButton",
  component: LogoutButton,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof LogoutButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "ログアウトに成功するとログイン画面へ遷移する",
  // createClient()はコンポーネントのレンダー時に呼ばれるため、
  // マウント後に実行されるplayではなく、マウント前に実行されるbeforeEachでモックする
  beforeEach: async () => {
    const signOut = async () => ({ error: null });
    mocked(createClient).mockReturnValue({
      auth: { signOut },
    } as unknown as ReturnType<typeof createClient>);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /ログアウト/ });

    await userEvent.click(button);

    await expect(getRouter().replace).toHaveBeenCalledWith("/login");
    await expect(getRouter().refresh).toHaveBeenCalled();
  },
};
