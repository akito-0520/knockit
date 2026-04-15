"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateUser } from "@/lib/api/auth";
import { UserResponse } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const schema = z.object({
  displayName: z
    .string()
    .min(1, "表示名を入力してください")
    .max(100, "100文字以内で入力してください"),
});

type FormValue = z.infer<typeof schema>;

type Props = {
  token: string;
  initialUser: UserResponse;
};

export default function ProfileForm({ token, initialUser }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: initialUser.displayName },
  });

  const onSubmit = async (data: FormValue) => {
    try {
      await updateUser(token, { displayName: data.displayName });
      setMessage("更新しました");
    } catch {
      setMessage("更新に失敗しました");
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>ユーザー名</Label>
            <Input value={initialUser.username} disabled />
            <p className="text-xs text-muted-foreground mt-1">
              ユーザー名は変更できません
            </p>
          </div>
          <div>
            <Label htmlFor="displayName">表示名</Label>
            <Input id="displayName" {...register("displayName")} />
            {errors.displayName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.displayName.message}
              </p>
            )}
          </div>
          {message && <p className="text-sm text-green-600">{message}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "更新中..." : "プロフィールを更新"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
