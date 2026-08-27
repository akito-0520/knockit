import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, userEvent, within } from "storybook/test";

import { updateUser } from "@/lib/api/auth";
import ProfileForm from "./ProfileForm";

const meta = {
  title: "settings/ProfileForm",
  component: ProfileForm,
  tags: ["autodocs"],
  args: {
    token: "test-token",
    initialUser: { username: "taro", displayName: "山田太郎" },
  },
} satisfies Meta<typeof ProfileForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "ユーザー名は編集不可、表示名は初期値付きで表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByDisplayValue("taro")).toBeDisabled();
    await expect(canvas.getByDisplayValue("山田太郎")).toBeEnabled();
  },
};

export const UpdateSuccess: Story = {
  name: "表示名を変更して送信すると更新完了メッセージが表示される",
  play: async ({ canvasElement }) => {
    mocked(updateUser).mockResolvedValue({
      username: "taro",
      displayName: "新しい名前",
    });

    const canvas = within(canvasElement);
    const input = canvas.getByDisplayValue("山田太郎");

    await userEvent.clear(input);
    await userEvent.type(input, "新しい名前");
    await userEvent.click(
      canvas.getByRole("button", { name: "プロフィールを更新" }),
    );

    await expect(await canvas.findByText("更新しました")).toBeInTheDocument();
    await expect(updateUser).toHaveBeenCalledWith("test-token", {
      displayName: "新しい名前",
    });
  },
};

export const ValidationError: Story = {
  name: "表示名を空にして送信するとバリデーションエラーが表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByDisplayValue("山田太郎");

    await userEvent.clear(input);
    await userEvent.click(
      canvas.getByRole("button", { name: "プロフィールを更新" }),
    );

    await expect(
      await canvas.findByText("表示名を入力してください"),
    ).toBeInTheDocument();
    await expect(updateUser).not.toHaveBeenCalled();
  },
};
