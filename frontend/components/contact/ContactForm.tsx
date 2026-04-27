"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInquiry } from "@/lib/api/inquiry";
import { inquirySchema, InquiryFormValue } from "@/lib/schemas/inquiry";
import { InquiryCategory, InquiryResponse } from "@/types/inquiry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const categoryOptions: { value: InquiryCategory; label: string }[] = [
  { value: "bug", label: "バグ報告" },
  { value: "feature", label: "要望" },
  { value: "other", label: "その他" },
];

const categoryLabel = (value: InquiryCategory) =>
  categoryOptions.find((opt) => opt.value === value)?.label ?? value;

type Result =
  | { kind: "success"; data: InquiryResponse }
  | { kind: "error"; message: string };

type Props = {
  token: string;
};

export default function ContactForm({ token }: Props) {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);

  const defaultValues: InquiryFormValue = {
    category: "bug",
    body: "",
    replyRequested: false,
    replyTo: "",
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValue>({
    resolver: zodResolver(inquirySchema),
    defaultValues,
  });

  const replyRequested = useWatch({ control, name: "replyRequested" });

  const onSubmit = async (data: InquiryFormValue) => {
    try {
      const res = await createInquiry(token, {
        category: data.category,
        body: data.body,
        replyRequested: data.replyRequested,
        replyTo: data.replyRequested ? (data.replyTo ?? null) : null,
      });
      setResult({ kind: "success", data: res });
      reset(defaultValues);
    } catch (e) {
      setResult({
        kind: "error",
        message: e instanceof Error ? e.message : "送信に失敗しました",
      });
    }
  };

  return (
    <>
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
                <p className="text-red-500 text-sm mt-1">
                  {errors.body.message}
                </p>
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

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "送信中..." : "送信する"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={result !== null}
        onOpenChange={(open) => {
          if (open) return;
          const wasSuccess = result?.kind === "success";
          setResult(null);
          if (wasSuccess) router.push("/settings");
        }}
      >
        <DialogContent>
          {result?.kind === "success" ? (
            <>
              <DialogHeader>
                <DialogTitle>送信が完了しました</DialogTitle>
                <DialogDescription>
                  お問い合わせを受け付けました。ご協力ありがとうございます。
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">種別</dt>
                <dd>{categoryLabel(result.data.category)}</dd>
                <dt className="text-muted-foreground">受付日時</dt>
                <dd>
                  {new Date(result.data.createdAt).toLocaleString("ja-JP")}
                </dd>
                <dt className="text-muted-foreground">返信希望</dt>
                <dd>
                  {result.data.replyRequested
                    ? (result.data.replyTo ?? "あり")
                    : "なし"}
                </dd>
                <dt className="text-muted-foreground self-start">本文</dt>
                <dd className="whitespace-pre-wrap wrap-break-word">
                  {result.data.body}
                </dd>
              </dl>
              <DialogFooter showCloseButton />
            </>
          ) : result?.kind === "error" ? (
            <>
              <DialogHeader>
                <DialogTitle>送信に失敗しました</DialogTitle>
                <DialogDescription>{result.message}</DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
