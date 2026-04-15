import { z } from "zod";

export const setupUserSchema = z.object({
  username: z
    .string()
    .min(3, "3文字以上で入力してください")
    .max(30, "30文字以内で入力してください")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "小文字英数字とハイフンのみ使用できます",
    ),
  displayName: z
    .string()
    .min(1, "表示名を入力してください")
    .max(100, "100文字以内で入力してください"),
});

export type SetupUserFormValue = z.infer<typeof setupUserSchema>;
