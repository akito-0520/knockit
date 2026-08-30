import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import PublicStatusCard from "./PublicStatusCard";

type FakeEventSourceInstance = {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null;
  closed: boolean;
  close: () => void;
};

let latestEventSource: FakeEventSourceInstance | undefined;

// `new EventSource(url)` から呼ばれる想定。オブジェクトを返すことで
// `this`を使わずにテストから送受信を制御できるインスタンスを生成する。
function FakeEventSource(url: string): FakeEventSourceInstance {
  const instance: FakeEventSourceInstance = {
    url,
    onmessage: null,
    closed: false,
    close: () => {
      instance.closed = true;
    },
  };
  latestEventSource = instance;
  return instance;
}

const meta = {
  title: "status/PublicStatusCard",
  component: PublicStatusCard,
  tags: ["autodocs"],
  args: {
    username: "taro",
    initialStatus: {
      displayName: "山田太郎",
      preset: { id: "1", label: "会議中", color: "#3B82F6", displayOrder: 0 },
      customMessage: "",
    },
  },
  beforeEach: () => {
    latestEventSource = undefined;
    // SSE接続を実際には張らず、テストから送受信を制御できる簡易実装に差し替える
    // @ts-expect-error テスト用の簡易EventSourceに差し替える
    globalThis.EventSource = FakeEventSource;
  },
} satisfies Meta<typeof PublicStatusCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "初期ステータスのプリセットラベルが表示される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("会議中")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  name: "何も設定されていない場合は案内文が表示される",
  args: {
    initialStatus: {
      displayName: "山田太郎",
      preset: { id: "1", label: "", color: "#3B82F6", displayOrder: 0 },
      customMessage: "",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText("まだ何も入力していません..."),
    ).toBeInTheDocument();
  },
};

export const UpdatesOnServerSentEvent: Story = {
  name: "SSEでメッセージを受信するとステータス表示が更新される",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => expect(latestEventSource).toBeDefined());

    latestEventSource?.onmessage?.({
      data: JSON.stringify({
        preset: {
          id: "2",
          label: "離席中",
          color: "#EF4444",
          display_order: 1,
        },
        custom_message: "",
        display_name: "山田太郎",
      }),
    } as MessageEvent);

    await expect(await canvas.findByText("離席中")).toBeInTheDocument();
  },
};
