import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  expect,
  fireEvent,
  mocked,
  spyOn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";

import { createPreset, deletePreset, updatePreset } from "@/lib/api/preset";
import PresetList from "./PresetList";

const meta = {
  title: "settings/PresetList",
  component: PresetList,
  tags: ["autodocs"],
  args: {
    token: "test-token",
    initialPresets: [
      { id: "1", label: "会議中", color: "#3B82F6", displayOrder: 0 },
      { id: "2", label: "離席中", color: "#EF4444", displayOrder: 1 },
    ],
  },
} satisfies Meta<typeof PresetList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "初期プリセットの一覧と件数が表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("会議中")).toBeInTheDocument();
    await expect(canvas.getByText("離席中")).toBeInTheDocument();
    await expect(canvas.getByText("2 / 10")).toBeInTheDocument();
  },
};

export const AddPreset: Story = {
  name: "ラベルを入力してプリセットを追加すると一覧に反映される",
  play: async ({ canvasElement }) => {
    mocked(createPreset).mockResolvedValue({
      id: "3",
      label: "休憩中",
      color: "#3B82F6",
      displayOrder: 2,
    });

    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "プリセットを追加" }),
    );
    await userEvent.type(canvas.getByLabelText("ラベル"), "休憩中");
    await userEvent.click(canvas.getByRole("button", { name: "追加" }));

    await expect(await canvas.findByText("休憩中")).toBeInTheDocument();
    await expect(createPreset).toHaveBeenCalledWith("test-token", {
      label: "休憩中",
      color: "#3B82F6",
      displayOrder: 2,
    });
  },
};

export const EditLabel: Story = {
  name: "ラベルを編集してEnterで確定すると一覧に反映される",
  play: async ({ canvasElement }) => {
    mocked(updatePreset).mockResolvedValue({
      id: "1",
      label: "会議中(更新)",
      color: "#3B82F6",
      displayOrder: 0,
    });

    const canvas = within(canvasElement);
    const editButtons = canvas.getAllByRole("button", { name: "編集" });
    await userEvent.click(editButtons[0]);

    const input = canvas.getByDisplayValue("会議中");
    await userEvent.clear(input);
    await userEvent.type(input, "会議中(更新){Enter}");

    await expect(await canvas.findByText("会議中(更新)")).toBeInTheDocument();
    await expect(updatePreset).toHaveBeenCalledWith("test-token", "1", {
      label: "会議中(更新)",
      color: "#3B82F6",
      displayOrder: 0,
    });
  },
};

export const ChangeColor: Story = {
  name: "カラーピッカーを変更するとプリセットの色が更新される",
  play: async ({ canvasElement }) => {
    mocked(updatePreset).mockResolvedValue({
      id: "1",
      label: "会議中",
      color: "#000000",
      displayOrder: 0,
    });

    const colorInput = canvasElement.querySelector('input[type="color"]');
    if (!colorInput) throw new Error("color input not found");

    fireEvent.change(colorInput, { target: { value: "#000000" } });

    await waitFor(() =>
      expect(updatePreset).toHaveBeenCalledWith("test-token", "1", {
        label: "会議中",
        color: "#000000",
        displayOrder: 0,
      }),
    );
  },
};

export const SaveWithCheckButton: Story = {
  name: "編集内容をチェックボタンのクリックで保存できる",
  play: async ({ canvasElement }) => {
    mocked(updatePreset).mockResolvedValue({
      id: "1",
      label: "更新済み",
      color: "#3B82F6",
      displayOrder: 0,
    });

    const canvas = within(canvasElement);
    const editButtons = canvas.getAllByRole("button", { name: "編集" });
    await userEvent.click(editButtons[0]);

    const input = canvas.getByDisplayValue("会議中");
    await userEvent.clear(input);
    await userEvent.type(input, "更新済み");
    await userEvent.click(canvas.getByRole("button", { name: "保存" }));

    await expect(await canvas.findByText("更新済み")).toBeInTheDocument();
  },
};

export const CancelEditWithEscape: Story = {
  name: "編集中にEscapeキーを押すと編集をキャンセルする",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editButtons = canvas.getAllByRole("button", { name: "編集" });
    await userEvent.click(editButtons[0]);

    const input = canvas.getByDisplayValue("会議中");
    await userEvent.type(input, "変更中{Escape}");

    await expect(canvas.getByText("会議中")).toBeInTheDocument();
    await expect(updatePreset).not.toHaveBeenCalled();
  },
};

export const SaveWithEmptyLabelCancelsEdit: Story = {
  name: "ラベルを空にして保存すると更新されず編集がキャンセルされる",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editButtons = canvas.getAllByRole("button", { name: "編集" });
    await userEvent.click(editButtons[0]);

    const input = canvas.getByDisplayValue("会議中");
    await userEvent.clear(input);
    await userEvent.click(canvas.getByRole("button", { name: "保存" }));

    await expect(canvas.getByText("会議中")).toBeInTheDocument();
    await expect(updatePreset).not.toHaveBeenCalled();
  },
};

export const CancelAdd: Story = {
  name: "追加フォームのキャンセルボタンでフォームが閉じる",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "プリセットを追加" }),
    );
    await expect(canvas.getByLabelText("ラベル")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "キャンセル" }));

    await expect(canvas.queryByLabelText("ラベル")).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "プリセットを追加" }),
    ).toBeInTheDocument();
  },
};

export const DeleteWithConfirm: Story = {
  name: "確認ダイアログでOKするとプリセットが一覧から削除される",
  play: async ({ canvasElement }) => {
    spyOn(window, "confirm").mockReturnValue(true);
    mocked(deletePreset).mockResolvedValue(undefined);

    const canvas = within(canvasElement);
    const deleteButtons = canvas.getAllByRole("button", { name: "削除" });
    await userEvent.click(deleteButtons[0]);

    await expect(canvas.queryByText("会議中")).not.toBeInTheDocument();
    await expect(deletePreset).toHaveBeenCalledWith("test-token", "1");
  },
};

export const DeleteWithCancel: Story = {
  name: "確認ダイアログでキャンセルすると削除されない",
  play: async ({ canvasElement }) => {
    spyOn(window, "confirm").mockReturnValue(false);

    const canvas = within(canvasElement);
    const deleteButtons = canvas.getAllByRole("button", { name: "削除" });
    await userEvent.click(deleteButtons[0]);

    await expect(canvas.getByText("会議中")).toBeInTheDocument();
    await expect(deletePreset).not.toHaveBeenCalled();
  },
};

export const AtLimit: Story = {
  name: "上限の10件に達すると追加ボタンが無効化される",
  args: {
    initialPresets: Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      label: `プリセット${i}`,
      color: "#3B82F6",
      displayOrder: i,
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("button", { name: /上限（10件）に達しています/ }),
    ).toBeDisabled();
  },
};
