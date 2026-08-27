import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";

const meta = {
  title: "ui/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "タイトル・説明・アクション・フッターが表示される",
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>プロフィール</CardTitle>
        <CardDescription>表示名を編集できます</CardDescription>
        <CardAction>
          <Button size="sm">編集</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>ここに本文が入ります</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">キャンセル</Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("プロフィール")).toBeInTheDocument();
    await expect(canvas.getByText("表示名を編集できます")).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "編集" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "キャンセル" }),
    ).toBeInTheDocument();
  },
};

export const Small: Story = {
  name: "sizeにsmを指定するとdata-size属性がsmになる",
  args: { size: "sm" },
  render: (args) => (
    <Card {...args}>
      <CardContent>コンパクト表示</CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas
      .getByText("コンパクト表示")
      .closest('[data-slot="card"]');

    await expect(card).toHaveAttribute("data-size", "sm");
  },
};
