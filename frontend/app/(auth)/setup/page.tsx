"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setupUserSchema, SetupUserFormValue } from "@/lib/schemas/user";
import { setupUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupUserFormValue>({
    resolver: zodResolver(setupUserSchema),
  });

  const onSubmit = async (data: SetupUserFormValue) => {
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setError("認証エラーが発生しました");
      return;
    }

    try {
      await setupUser(token, {
        username: data.username,
        displayName: data.displayName,
      });
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "設定に失敗しました");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">プロフィール設定</h1>
            <p className="text-sm text-muted-foreground">
              ユーザー名と表示名を設定してください
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                {...register("username")}
                placeholder="akito"
              />
              <p className="text-xs text-muted-foreground">
                URL に使用されます（小文字英数字とハイフン）
              </p>
              {errors.username && (
                <p className="text-red-500 text-sm">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">表示名</Label>
              <Input
                id="displayName"
                {...register("displayName")}
                placeholder="あきと"
              />
              {errors.displayName && (
                <p className="text-red-500 text-sm">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "設定中..." : "はじめる"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
