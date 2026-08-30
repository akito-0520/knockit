import { z } from "zod";

export const apiKeySchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "ラベルを入力してください")
    .max(50, "50文字以内で入力してください"),
});

export type ApiKeyFormValue = z.infer<typeof apiKeySchema>;
