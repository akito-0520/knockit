import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import ProductOverview from "./ProductOverview";

const meta = {
  title: "lp/ProductOverview",
  component: ProductOverview,
  tags: ["autodocs"],
} satisfies Meta<typeof ProductOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "見出しと全ステータス一覧が表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("heading", { name: "ノックしていいか、ひと目で。" }),
    ).toBeInTheDocument();

    for (const label of [
      "面接中",
      "会議中",
      "勉強中",
      "作業中",
      "電話中",
      "入室OK",
    ]) {
      await expect(canvas.getByText(label)).toBeInTheDocument();
    }

    await expect(canvas.getByText("あなたの画面")).toBeInTheDocument();
    await expect(canvas.getByText("家族の画面")).toBeInTheDocument();
  },
};
