"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { statusSchema, StatusFormValue } from "@/lib/schemas/status";
import { updateStatus } from "@/lib/api/status";
import { PresetResponse } from "@/types/preset";
import { StatusResponse } from "@/types/roomStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  token: string;
  presets: PresetResponse[];
  initialStatus: StatusResponse | null;
};

export default function StatusCard({ token, presets, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StatusFormValue>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      presetId: initialStatus?.preset?.id ?? "",
      customMessage: initialStatus?.customMessage ?? "",
    },
  });

  const selectedPresetId = useWatch({ control, name: "presetId" });
  const customMessage = useWatch({ control, name: "customMessage" });

  const onSubmit = async (data: StatusFormValue) => {
    try {
      const updated = await updateStatus(token, {
        presetId: data.presetId ?? "",
        customMessage: data.customMessage ?? "",
      });
      setStatus(updated);
      setMessage("ステータスを更新しました");
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage("更新に失敗しました");
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* 現在のステータス */}
        {status && (status.preset?.label || status.customMessage) && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">現在のステータス</p>
            {status.preset?.label && (
              <div
                className="px-4 py-3 rounded-lg text-white text-center font-semibold"
                style={{ backgroundColor: status.preset.color }}
              >
                {status.preset.label}
              </div>
            )}
            {status.customMessage && (
              <p className="text-center">{status.customMessage}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* プリセット選択 */}
          {presets.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">プリセットから選ぶ</p>
              <div className="flex gap-2 flex-wrap">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setValue("presetId", preset.id);
                    }}
                    className={`px-4 py-2 rounded-full text-white font-medium transition ${
                      selectedPresetId === preset.id
                        ? "ring-2 ring-offset-2 ring-black"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: preset.color }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* カスタムメッセージ */}
          <div className="space-y-2">
            <p className="text-sm font-medium">カスタムメッセージ</p>
            <Input
              {...register("customMessage")}
              placeholder="自由にメッセージを入力"
            />
          </div>

          {errors.root && (
            <p className="text-red-500 text-sm">{errors.root.message}</p>
          )}

          {message && (
            <p className="text-sm text-green-600 text-center">{message}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || (!selectedPresetId && !customMessage)}
            className="w-full"
          >
            {isSubmitting ? "更新中..." : "ステータスを更新"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
