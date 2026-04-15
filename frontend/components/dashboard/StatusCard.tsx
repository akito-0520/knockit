"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { statusSchema, StatusFormValue } from "@/lib/schemas/status";
import { updateStatus } from "@/lib/api/status";
import { PresetResponse } from "@/types/preset";
import { StatusResponse } from "@/types/roomStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  token: string;
  presets: PresetResponse[];
  initialStatus: StatusResponse | null;
};

export default function StatusCard({ token, presets, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StatusFormValue>({
    resolver: zodResolver(statusSchema),
  });

  const selectedPresetId = watch("presetId");

  const onSubmit = async (data: StatusFormValue) => {
    const updated = await updateStatus(token, {
      presetId: data.presetId ?? "",
      customMessage: data.customMessage ?? "",
    });
    setStatus(updated);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 現在のステータス */}
      {status && <p>現在のステータス：{status.customMessage}</p>}

      {/* プリセット選択 */}
      <div className="flex gap-2 flex-wrap">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              setValue("presetId", preset.id);
              setValue("customMessage", "");
            }}
            className={`px-4 py-2 rounded-full text-white ${
              selectedPresetId === preset.id ? "ring-2 ring-offset-2" : ""
            }`}
            style={{ backgroundColor: preset.color }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* カスタムメッセージ */}
      <Input
        {...register("customMessage")}
        placeholder="カスタムメッセージを入力"
        onChange={(e) => {
          setValue("customMessage", e.target.value);
          setValue("presetId", "");
        }}
      />
      {errors.root && <p className="text-red-500">{errors.root.message}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "更新中..." : "ステータスを更新"}
      </Button>
    </form>
  );
}
