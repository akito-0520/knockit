"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInquiry } from "@/lib/api/inquiry";
import { inquirySchema, InquiryFormValue } from "@/lib/schemas/inquiry";
import { InquiryCategory } from "@/types/inquiry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const categoryOptions: { value: InquiryCategory; label: string }[] = [
  { value: "bug", label: "バグ報告" },
  { value: "feature", label: "要望" },
  { value: "other", label: "その他" },
];

type Props = {
  token: string;
};

export default function ContactForm({ token }: Props) {
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const defaultValues: InquiryFormValue = {
    category: "bug",
    body: "",
    replyRequested: false,
    replyTo: "",
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValue>({
    resolver: zodResolver(inquirySchema),
    defaultValues,
  });

  const replyRequested = watch("replyRequested");

  const onSubmit = async (data: InquiryFormValue) => {
    try {
      await createInquiry(token, {
        category: data.category,
        body: data.body,
        replyRequested: data.replyRequested,
        replyTo: data.replyRequested ? (data.replyTo ?? null) : null,
      });
      setMessage({ kind: "success", text: "送信しました" });
      reset(defaultValues);
    } catch {
      setMessage({ kind: "error", text: "送信に失敗しました" });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>種別</Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {categoryOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register("category")}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="body">本文</Label>
            <textarea
              id="body"
              rows={10}
              {...register("body")}
              className={cn(
                "w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-3 py-2 text-base transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
              )}
            />
            {errors.body && (
              <p className="text-red-500 text-sm mt-1">{errors.body.message}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register("replyRequested")} />
              <span>返信を希望する</span>
            </label>
          </div>

          {replyRequested && (
            <div>
              <Label htmlFor="replyTo">返信先メールアドレス</Label>
              <Input id="replyTo" type="email" {...register("replyTo")} />
              {errors.replyTo && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.replyTo.message}
                </p>
              )}
            </div>
          )}

          {message && (
            <p
              className={cn(
                "text-sm",
                message.kind === "success" ? "text-green-600" : "text-red-500",
              )}
            >
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "送信中..." : "送信する"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
