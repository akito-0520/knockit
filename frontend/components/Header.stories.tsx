import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { usePathname } from "next/navigation";
import { expect, mocked, within } from "storybook/test";

import Header from "./Header";

const meta = {
  title: "Header",
  component: Header,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnNormalPage: Story = {
  name: "通常のページではヘッダーが表示される",
  beforeEach: () => {
    mocked(usePathname).mockReturnValue("/dashboard");
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("knockit")).toBeInTheDocument();
  },
};

export const OnTopPage: Story = {
  name: "トップページではヘッダーが表示されない",
  beforeEach: () => {
    mocked(usePathname).mockReturnValue("/");
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText("knockit")).not.toBeInTheDocument();
  },
};

export const OnEmbedPage: Story = {
  name: "embedページではヘッダーが表示されない",
  beforeEach: () => {
    mocked(usePathname).mockReturnValue("/embed/taro");
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText("knockit")).not.toBeInTheDocument();
  },
};
