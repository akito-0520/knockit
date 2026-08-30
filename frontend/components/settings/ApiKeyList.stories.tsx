import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, userEvent, within } from "storybook/test";

import { createApiKey, deleteApiKey } from "@/lib/api/apiKey";
import ApiKeyList from "./ApiKeyList";

const keys = [
  {
    id: "1",
    label: "iOS ショートカット",
    keyPrefix: "knk_abcd1234",
    lastUsedAt: null,
    createdAt: "2026-08-30T00:00:00Z",
  },
  {
    id: "2",
    label: "Zapier",
    keyPrefix: "knk_efgh5678",
    lastUsedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    createdAt: "2026-08-29T00:00:00Z",
  },
];

const meta = {
  title: "settings/ApiKeyList",
  component: ApiKeyList,
  tags: ["autodocs"],
  args: {
    token: "test-token",
    initialApiKeys: keys,
  },
} satisfies Meta<typeof ApiKeyList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "発行済みキーの一覧が表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("iOS ショートカット")).toBeInTheDocument();
    await expect(canvas.getByText("Zapier")).toBeInTheDocument();
    await expect(canvasElement).toHaveTextContent("knk_abcd1234");
    await expect(canvasElement).toHaveTextContent("未使用");
    await expect(canvasElement).toHaveTextContent("最終使用");
  },
};

export const Empty: Story = {
  name: "キーが無い場合は案内文が表示される",
  args: { initialApiKeys: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("APIキーがありません")).toBeInTheDocument();
  },
};

export const CreateShowsKeyDialog: Story = {
  name: "発行するとダイアログに生キーと curl が表示される",
  args: { initialApiKeys: [] },
  play: async ({ canvasElement }) => {
    mocked(createApiKey).mockResolvedValue({
      id: "new",
      label: "テスト",
      key: "knk_rawsecret123",
      keyPrefix: "knk_rawsecre",
      createdAt: "2026-08-30T00:00:00Z",
    });

    const canvas = within(canvasElement);
    const body = within(document.body);

    await userEvent.click(
      canvas.getByRole("button", { name: "APIキーを発行" }),
    );
    await userEvent.type(canvas.getByLabelText("ラベル"), "テスト");
    await userEvent.click(canvas.getByRole("button", { name: "発行" }));

    await expect(
      await body.findByText("APIキーを発行しました"),
    ).toBeInTheDocument();
    await expect(await body.findByText("knk_rawsecret123")).toBeInTheDocument();
    await expect(await body.findByText(/curl -X PUT/)).toBeInTheDocument();
    await expect(
      await body.findByText(/"preset_label":"会議中"/),
    ).toBeInTheDocument();
  },
};

export const Delete: Story = {
  name: "削除するとキーが一覧から消える",
  beforeEach: () => {
    const original = window.confirm;
    window.confirm = () => true;
    return () => {
      window.confirm = original;
    };
  },
  play: async ({ canvasElement }) => {
    mocked(deleteApiKey).mockResolvedValue(undefined);

    const canvas = within(canvasElement);
    const rows = canvas.getAllByRole("listitem");
    const zapierRow = rows.find((r) => r.textContent?.includes("Zapier"))!;

    await userEvent.click(
      within(zapierRow).getByRole("button", { name: "削除" }),
    );

    await expect(canvas.queryByText("Zapier")).not.toBeInTheDocument();
    await expect(canvas.getByText("iOS ショートカット")).toBeInTheDocument();
  },
};
