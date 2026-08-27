import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { Label } from "./label";
import { Input } from "./input";

const meta = {
  title: "ui/Label",
  component: Label,
  tags: ["autodocs"],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInput: Story = {
  name: "htmlForで関連付けたinputをラベルのテキストから取得できる",
  render: () => (
    <div>
      <Label htmlFor="display-name">表示名</Label>
      <Input id="display-name" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("表示名");

    await expect(input).toBeInTheDocument();
  },
};
