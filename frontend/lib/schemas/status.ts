import z from "zod";

export const statusSchema = z
  .object({
    presetId: z.string().optional(),
    customMessage: z
      .string()
      .max(200, "200文字以内で入力してください")
      .optional(),
  })
  .refine(
    (data) =>
      data.presetId || (data.customMessage && data.customMessage.length > 0),
    {
      message: "メッセージを入力してください",
    },
  );

export type StatusFormValue = z.infer<typeof statusSchema>;
