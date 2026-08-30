import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "./button";

const meta = {
  title: "ui/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "クリックするとonClickが呼ばれる",
  args: {
    children: "送信する",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "送信する" });

    await expect(button).toBeInTheDocument();
    await expect(button).toHaveAttribute("data-variant", "default");

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Destructive: Story = {
  name: "destructiveバリアントを指定すると警告色になる",
  args: {
    variant: "destructive",
    children: "削除する",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "削除する" });

    await expect(button).toHaveAttribute("data-variant", "destructive");
  },
};

export const Disabled: Story = {
  name: "disabled指定時はクリックしてもonClickが呼ばれない",
  args: {
    children: "送信する",
    disabled: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "送信する" });

    await expect(button).toBeDisabled();

    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
