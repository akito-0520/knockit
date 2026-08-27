import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import TermsPage from "./page";

const meta = {
  title: "app/TermsPage",
  component: TermsPage,
  tags: ["autodocs"],
} satisfies Meta<typeof TermsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "利用規約の見出しと本文が表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("heading", { name: "利用規約", level: 1 }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("heading", { name: "第1条（はじめに）" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "← トップに戻る" }),
    ).toHaveAttribute("href", "/");
  },
};
