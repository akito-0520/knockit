import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, spyOn, userEvent, within } from "storybook/test";

import ShareSection from "./ShareSection";

const meta = {
  title: "dashboard/ShareSection",
  component: ShareSection,
  tags: ["autodocs"],
  args: {
    username: "taro",
  },
} satisfies Meta<typeof ShareSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "共有用URLのリンクが表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("link", { name: "/taro" }),
    ).toBeInTheDocument();
  },
};

export const CopyUrl: Story = {
  name: "共有用URLのコピーボタンでクリップボードにコピーされる",
  play: async ({ canvasElement }) => {
    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue(
      undefined,
    );

    const canvas = within(canvasElement);
    const copyButtons = canvas.getAllByRole("button", { name: "コピー" });
    await userEvent.click(copyButtons[0]);

    await expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("/taro"),
    );
    await expect(
      await canvas.findByRole("button", { name: "コピー済み" }),
    ).toBeInTheDocument();
  },
};

export const CopyEmbedCode: Story = {
  name: "埋め込みコードのコピーボタンでクリップボードにコピーされる",
  play: async ({ canvasElement }) => {
    const writeText = spyOn(navigator.clipboard, "writeText").mockResolvedValue(
      undefined,
    );

    const canvas = within(canvasElement);
    const copyButtons = canvas.getAllByRole("button", { name: "コピー" });
    await userEvent.click(copyButtons[1]);

    await expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("/embed/taro"),
    );
  },
};
