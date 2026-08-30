import type { Preview } from "@storybook/nextjs-vite";
import { sb } from "storybook/test";

// テスト対象コンポーネントが依存する外部I/Oをモック化する
// 個々のstoryのplay関数側で mocked(fn).mockResolvedValue(...) 等で挙動を上書きする
sb.mock(import("../lib/api/auth.ts"));
sb.mock(import("../lib/api/preset.ts"));
sb.mock(import("../lib/api/status.ts"));
sb.mock(import("../lib/api/inquiry.ts"));
sb.mock(import("../lib/api/apiKey.ts"));
sb.mock(import("../lib/supabase/client.ts"));

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
