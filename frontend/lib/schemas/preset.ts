import { z } from "zod";

export const presetSchema = z.object({
  label: z
    .string()
    .min(1, "ラベルを入力してください")
    .max(20, "20文字以内で入力してください"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "#RRGGBB形式で入力してください"),
  displayOrder: z.number().min(0, "0以上の数値を入力してください"),
});

export type PresetFormValue = z.infer<typeof presetSchema>;
