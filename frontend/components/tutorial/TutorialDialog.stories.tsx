import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import TutorialDialog from "./TutorialDialog";

const meta = {
  title: "tutorial/TutorialDialog",
  component: TutorialDialog,
  tags: ["autodocs"],
  args: {
    open: true,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof TutorialDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  name: "開いているときは使い方の説明が表示される",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    await expect(
      body.getByRole("heading", { name: "knockit の使い方" }),
    ).toBeInTheDocument();
    await expect(body.getByText("基本の流れ")).toBeInTheDocument();
  },
};

export const StartButtonClosesDialog: Story = {
  name: "「はじめる」ボタンでonOpenChange(false)が呼ばれる",
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(body.getByRole("button", { name: "はじめる" }));

    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
};

export const Closed: Story = {
  name: "closedのときはダイアログが表示されない",
  args: { open: false },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    await expect(
      body.queryByRole("heading", { name: "knockit の使い方" }),
    ).not.toBeInTheDocument();
  },
};
