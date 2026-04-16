"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { presetSchema, PresetFormValue } from "@/lib/schemas/preset";
import { createPreset, updatePreset, deletePreset } from "@/lib/api/preset";
import { PresetResponse } from "@/types/preset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  token: string;
  initialPresets: PresetResponse[];
};

export default function PresetList({ token, initialPresets }: Props) {
  const [presets, setPresets] = useState(initialPresets);
  const [isAdding, setIsAdding] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PresetFormValue>({
    resolver: zodResolver(presetSchema),
    defaultValues: { color: "#3B82F6", displayOrder: presets.length },
  });

  const onSubmit = async (data: PresetFormValue) => {
    const created = await createPreset(token, data);
    setPresets([...presets, created]);
    reset({ color: "#3B82F6", displayOrder: presets.length + 1 });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このプリセットを削除しますか？")) return;
    await deletePreset(token, id);
    setPresets(presets.filter((p) => p.id !== id));
  };

  const handleColorChange = async (preset: PresetResponse, color: string) => {
    const updated = await updatePreset(token, preset.id, {
      label: preset.label,
      color,
      displayOrder: preset.displayOrder,
    });
    setPresets(presets.map((p) => (p.id === preset.id ? updated : p)));
  };

  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1">
      <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg bg-card">
        {presets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            プリセットがありません
          </p>
        ) : (
          <ul className="divide-y">
            {presets.map((preset) => (
              <li
                key={preset.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <input
                  type="color"
                  value={preset.color}
                  onChange={(e) => handleColorChange(preset, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer shrink-0"
                />
                <span className="flex-1 font-medium truncate">
                  {preset.label}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(preset.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cn("shrink-0", isAdding && "")}>
        {isAdding ? (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <Label htmlFor="label">ラベル</Label>
                  <Input
                    id="label"
                    {...register("label")}
                    placeholder="会議中"
                  />
                  {errors.label && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.label.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="color">色</Label>
                  <Input id="color" type="color" {...register("color")} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    追加
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAdding(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            プリセットを追加
          </Button>
        )}
      </div>
    </div>
  );
}
