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
    <div className="space-y-3">
      {presets.map((preset) => (
        <Card key={preset.id}>
          <CardContent className="pt-6 flex items-center gap-3">
            <input
              type="color"
              value={preset.color}
              onChange={(e) => handleColorChange(preset, e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <span className="flex-1 font-medium">{preset.label}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(preset.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ))}

      {isAdding ? (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <Label htmlFor="label">ラベル</Label>
                <Input id="label" {...register("label")} placeholder="会議中" />
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
  );
}
