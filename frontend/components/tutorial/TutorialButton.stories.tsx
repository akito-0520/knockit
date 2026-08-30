import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import TutorialButton from "./TutorialButton";

const meta = {
  title: "tutorial/TutorialButton",
  component: TutorialButton,
  tags: ["autodocs"],
} satisfies Meta<typeof TutorialButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClickOpensDialog: Story = {
  name: "クリックするとチュートリアルダイアログが開く",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await expect(
      body.queryByRole("heading", { name: "knockit の使い方" }),
    ).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "使い方" }));

    await expect(
      await body.findByRole("heading", { name: "knockit の使い方" }),
    ).toBeVisible();
  },
};
