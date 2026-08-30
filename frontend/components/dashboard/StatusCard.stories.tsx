import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, userEvent, within } from "storybook/test";

import { updateStatus } from "@/lib/api/status";
import StatusCard from "./StatusCard";

const presets = [
  { id: "1", label: "会議中", color: "#3B82F6", displayOrder: 0 },
  { id: "2", label: "離席中", color: "#EF4444", displayOrder: 1 },
];

const meta = {
  title: "dashboard/StatusCard",
  component: StatusCard,
  tags: ["autodocs"],
  args: {
    token: "test-token",
    presets,
    initialStatus: null,
  },
} satisfies Meta<typeof StatusCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "何も選択・入力していない場合は更新ボタンが無効化される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("button", { name: "ステータスを更新" }),
    ).toBeDisabled();
  },
};

export const SelectPresetAndSubmit: Story = {
  name: "プリセットを選んで送信するとステータスが更新される",
  play: async ({ canvasElement }) => {
    mocked(updateStatus).mockResolvedValue({
      displayName: "山田太郎",
      preset: presets[0],
      customMessage: "",
      updatedAt: new Date().toISOString(),
    });

    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "会議中" }));

    const submit = canvas.getByRole("button", { name: "ステータスを更新" });
    await expect(submit).toBeEnabled();

    await userEvent.click(submit);

    await expect(
      await canvas.findByText("ステータスを更新しました"),
    ).toBeInTheDocument();
    await expect(updateStatus).toHaveBeenCalledWith("test-token", {
      presetId: "1",
      customMessage: "",
    });
  },
};

export const CustomMessageOnly: Story = {
  name: "カスタムメッセージのみの入力でも送信できる",
  play: async ({ canvasElement }) => {
    mocked(updateStatus).mockResolvedValue({
      displayName: "山田太郎",
      preset: presets[0],
      customMessage: "会議中です",
      updatedAt: new Date().toISOString(),
    });

    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("自由にメッセージを入力");

    await userEvent.type(input, "会議中です");
    await userEvent.click(
      canvas.getByRole("button", { name: "ステータスを更新" }),
    );

    await expect(
      await canvas.findByText("ステータスを更新しました"),
    ).toBeInTheDocument();
    await expect(updateStatus).toHaveBeenCalledWith("test-token", {
      presetId: null,
      customMessage: "会議中です",
    });
  },
};

export const WithCurrentStatus: Story = {
  name: "現在のステータスが設定されている場合はその内容が表示される",
  args: {
    initialStatus: {
      displayName: "山田太郎",
      preset: presets[0],
      customMessage: "オフラインです",
      updatedAt: new Date().toISOString(),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("現在のステータス")).toBeInTheDocument();
    await expect(canvas.getByText("オフラインです")).toBeInTheDocument();
  },
};
