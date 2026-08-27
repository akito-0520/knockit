import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";

const meta = {
  title: "ui/Dialog",
  component: Dialog,
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenAndClose: Story = {
  name: "トリガーをクリックすると開き、閉じるボタンで閉じる",
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>プリセットを削除</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>本当に削除しますか？</DialogTitle>
          <DialogDescription>この操作は取り消せません。</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive">削除する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await expect(
      body.queryByRole("dialog", { name: "本当に削除しますか？" }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      canvas.getByRole("button", { name: "プリセットを削除" }),
    );

    const dialog = await body.findByRole("dialog", {
      name: "本当に削除しますか？",
    });
    await expect(dialog).toBeVisible();

    await userEvent.click(body.getByRole("button", { name: "Close" }));
    await expect(
      body.queryByRole("dialog", { name: "本当に削除しますか？" }),
    ).not.toBeInTheDocument();
  },
};
