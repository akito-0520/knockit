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
import { Trash2, Plus, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  token: string;
  initialPresets: PresetResponse[];
};

const MAX_PRESETS = 10;

export default function PresetList({ token, initialPresets }: Props) {
  const [presets, setPresets] = useState(initialPresets);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PresetFormValue>({
    resolver: zodResolver(presetSchema),
    defaultValues: { color: "#3B82F6", displayOrder: presets.length },
  });

  const isAtLimit = presets.length >= MAX_PRESETS;
  const isAtMin = presets.length <= 1;

  const onSubmit = async (data: PresetFormValue) => {
    if (isAtLimit) return;
    const created = await createPreset(token, data);
    setPresets([...presets, created]);
    reset({ color: "#3B82F6", displayOrder: presets.length + 1 });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (presets.length <= 1) return;
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

  const startEdit = (preset: PresetResponse) => {
    setEditingId(preset.id);
    setEditingLabel(preset.label);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingLabel("");
  };

  const saveEdit = async (preset: PresetResponse) => {
    const label = editingLabel.trim();
    if (!label || label === preset.label) {
      cancelEdit();
      return;
    }
    const updated = await updatePreset(token, preset.id, {
      label,
      color: preset.color,
      displayOrder: preset.displayOrder,
    });
    setPresets(presets.map((p) => (p.id === preset.id ? updated : p)));
    cancelEdit();
  };

  return (
    <div className="flex flex-col gap-3 md:min-h-0 md:flex-1">
      <div className="border rounded-lg bg-card md:flex-1 md:min-h-0 md:overflow-y-auto">
        {presets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            プリセットがありません
          </p>
        ) : (
          <ul className="divide-y">
            {presets.map((preset) => {
              const isEditing = editingId === preset.id;
              return (
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
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(preset);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="flex-1 h-8"
                      maxLength={20}
                    />
                  ) : (
                    <span className="flex-1 font-medium truncate">
                      {preset.label}
                    </span>
                  )}
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => saveEdit(preset)}
                        aria-label="保存"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancelEdit}
                        aria-label="キャンセル"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(preset)}
                        aria-label="編集"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(preset.id)}
                        aria-label="削除"
                        disabled={isAtMin}
                        title={
                          isAtMin
                            ? "最後のプリセットは削除できません"
                            : undefined
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={cn("space-y-2 md:shrink-0", isAdding && "")}>
        <p className="text-xs text-muted-foreground text-right">
          {presets.length} / {MAX_PRESETS}
        </p>
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
            disabled={isAtLimit}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isAtLimit
              ? `上限（${MAX_PRESETS}件）に達しています`
              : "プリセットを追加"}
          </Button>
        )}
      </div>
    </div>
  );
}
