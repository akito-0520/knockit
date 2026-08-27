import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, mocked, userEvent, within } from "storybook/test";

import { createInquiry } from "@/lib/api/inquiry";
import ContactForm from "./ContactForm";

const meta = {
  title: "contact/ContactForm",
  component: ContactForm,
  tags: ["autodocs"],
  args: {
    token: "test-token",
  },
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof ContactForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "初期状態ではバグ報告が選択され、返信先入力欄は非表示",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("radio", { name: "バグ報告" })).toBeChecked();
    await expect(
      canvas.queryByLabelText("返信先メールアドレス"),
    ).not.toBeInTheDocument();
  },
};

export const ToggleReplyRequested: Story = {
  name: "返信を希望するにチェックすると返信先入力欄が表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole("checkbox", { name: "返信を希望する" }),
    );

    await expect(
      canvas.getByLabelText("返信先メールアドレス"),
    ).toBeInTheDocument();
  },
};

export const ValidationError: Story = {
  name: "本文が5文字未満だと送信できずエラーが表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "送信する" }));

    await expect(
      await canvas.findByText("5文字以上で入力してください"),
    ).toBeInTheDocument();
    await expect(createInquiry).not.toHaveBeenCalled();
  },
};

export const SubmitSuccess: Story = {
  name: "送信に成功すると完了ダイアログが表示され、閉じると設定画面へ遷移する",
  play: async ({ canvasElement }) => {
    mocked(createInquiry).mockResolvedValue({
      category: "bug",
      body: "画面が正しく表示されません",
      replyRequested: false,
      replyTo: null,
      createdAt: "2026-01-01T12:00:00Z",
    });

    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.type(
      canvas.getByLabelText("本文"),
      "画面が正しく表示されません",
    );
    await userEvent.click(canvas.getByRole("button", { name: "送信する" }));

    await expect(
      await body.findByRole("heading", { name: "送信が完了しました" }),
    ).toBeInTheDocument();
    await expect(
      body.getByText("画面が正しく表示されません"),
    ).toBeInTheDocument();
    expect(createInquiry).toHaveBeenCalledWith("test-token", {
      category: "bug",
      body: "画面が正しく表示されません",
      replyRequested: false,
      replyTo: null,
    });

    const closeButtons = body.getAllByRole("button", { name: "Close" });
    await userEvent.click(closeButtons[0]);

    await expect(getRouter().push).toHaveBeenCalledWith("/settings");
  },
};

export const SubmitError: Story = {
  name: "送信に失敗するとエラーダイアログが表示される",
  play: async ({ canvasElement }) => {
    mocked(createInquiry).mockRejectedValue(new Error("送信できませんでした"));

    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.type(canvas.getByLabelText("本文"), "テスト用の本文です");
    await userEvent.click(canvas.getByRole("button", { name: "送信する" }));

    await expect(
      await body.findByRole("heading", { name: "送信に失敗しました" }),
    ).toBeInTheDocument();
    await expect(body.getByText("送信できませんでした")).toBeInTheDocument();
  },
};
