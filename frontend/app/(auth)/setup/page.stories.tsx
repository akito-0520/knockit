import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, mocked, userEvent, within } from "storybook/test";

import { setupUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/client";
import SetupPage from "./page";

let sessionAccessToken: string | null = "session-token";

const meta = {
  title: "app/SetupPage",
  component: SetupPage,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
  // createClient()はレンダー時に呼ばれるため、マウント前に実行されるbeforeEachでモックする
  beforeEach: () => {
    sessionAccessToken = "session-token";
    mocked(createClient).mockReturnValue({
      auth: {
        getSession: async () => ({
          data: {
            session: sessionAccessToken
              ? { access_token: sessionAccessToken }
              : null,
          },
        }),
      },
    } as unknown as ReturnType<typeof createClient>);
  },
} satisfies Meta<typeof SetupPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "ユーザー名と表示名の入力欄が表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText("ユーザー名")).toBeInTheDocument();
    await expect(canvas.getByLabelText("表示名")).toBeInTheDocument();
  },
};

export const ValidationError: Story = {
  name: "3文字未満のユーザー名で送信するとエラーが表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("ユーザー名"), "ab");
    await userEvent.type(canvas.getByLabelText("表示名"), "山田太郎");
    await userEvent.click(canvas.getByRole("button", { name: "はじめる" }));

    await expect(
      await canvas.findByText("3文字以上で入力してください"),
    ).toBeInTheDocument();
    await expect(setupUser).not.toHaveBeenCalled();
  },
};

export const SubmitSuccess: Story = {
  name: "登録に成功するとダッシュボードへ遷移する",
  play: async ({ canvasElement }) => {
    mocked(setupUser).mockResolvedValue({
      username: "taro123",
      displayName: "山田太郎",
    });

    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("ユーザー名"), "taro123");
    await userEvent.type(canvas.getByLabelText("表示名"), "山田太郎");
    await userEvent.click(canvas.getByRole("button", { name: "はじめる" }));

    await expect(getRouter().push).toHaveBeenCalledWith(
      "/dashboard?tutorial=true",
    );
    expect(setupUser).toHaveBeenCalledWith("session-token", {
      username: "taro123",
      displayName: "山田太郎",
    });
  },
};

export const SubmitError: Story = {
  name: "登録に失敗するとエラーメッセージが表示される",
  play: async ({ canvasElement }) => {
    mocked(setupUser).mockRejectedValue(
      new Error("そのユーザー名は既に使用されています"),
    );

    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("ユーザー名"), "taro123");
    await userEvent.type(canvas.getByLabelText("表示名"), "山田太郎");
    await userEvent.click(canvas.getByRole("button", { name: "はじめる" }));

    await expect(
      await canvas.findByText("そのユーザー名は既に使用されています"),
    ).toBeInTheDocument();
  },
};

export const NoSession: Story = {
  name: "セッションが無い場合は認証エラーが表示される",
  beforeEach: () => {
    sessionAccessToken = null;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("ユーザー名"), "taro123");
    await userEvent.type(canvas.getByLabelText("表示名"), "山田太郎");
    await userEvent.click(canvas.getByRole("button", { name: "はじめる" }));

    await expect(
      await canvas.findByText("認証エラーが発生しました"),
    ).toBeInTheDocument();
    await expect(setupUser).not.toHaveBeenCalled();
  },
};
