import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import Home from "./page";

const meta = {
  title: "app/Home",
  component: Home,
  tags: ["autodocs"],
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "見出し・ログイン導線・製品紹介・バージョン表記が表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("heading", { name: "knockit" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "はじめる" }),
    ).toHaveAttribute("href", "/login");
    await expect(
      canvas.getByRole("heading", { name: "ノックしていいか、ひと目で。" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText(/^version /)).toBeInTheDocument();
  },
};
