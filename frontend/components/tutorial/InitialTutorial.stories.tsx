import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import InitialTutorial from "./InitialTutorial";

const meta = {
  title: "tutorial/InitialTutorial",
  component: InitialTutorial,
  tags: ["autodocs"],
} satisfies Meta<typeof InitialTutorial>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpensByDefault: Story = {
  name: "初期状態でチュートリアルダイアログが開いている",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    await expect(
      body.getByRole("heading", { name: "knockit の使い方" }),
    ).toBeVisible();
  },
};

export const StartButtonClosesDialog: Story = {
  name: "「はじめる」ボタンでダイアログが閉じる",
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(body.getByRole("button", { name: "はじめる" }));

    await expect(
      body.queryByRole("heading", { name: "knockit の使い方" }),
    ).not.toBeInTheDocument();
  },
};
