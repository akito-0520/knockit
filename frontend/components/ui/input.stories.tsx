import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { Input } from "./input";

const meta = {
  title: "ui/Input",
  component: Input,
  tags: ["autodocs"],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "入力した文字列が値に反映される",
  args: {
    placeholder: "表示名を入力",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("表示名を入力");

    await userEvent.type(input, "たなか");
    await expect(input).toHaveValue("たなか");
  },
};

export const Disabled: Story = {
  name: "disabled指定時は入力できない",
  args: {
    value: "user-123",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByDisplayValue("user-123");

    await expect(input).toBeDisabled();
  },
};
