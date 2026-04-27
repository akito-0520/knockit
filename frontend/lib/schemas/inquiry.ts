import { z } from "zod";

export const inquirySchema = z
  .object({
    category: z.enum(["bug", "feature", "other"]),
    body: z
      .string()
      .min(5, "5文字以上で入力してください")
      .max(5000, "5000文字以内で入力してください"),
    replyRequested: z.boolean(),
    replyTo: z.string().max(255, "255文字以内で入力してください").optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.replyRequested) return;
    if (!value.replyTo || value.replyTo.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["replyTo"],
        message: "返信先のメールアドレスを入力してください",
      });
      return;
    }
    const result = z.email().safeParse(value.replyTo);
    if (!result.success) {
      ctx.addIssue({
        code: "custom",
        path: ["replyTo"],
        message: "メールアドレスの形式が正しくありません",
      });
    }
  });

export type InquiryFormValue = z.infer<typeof inquirySchema>;
