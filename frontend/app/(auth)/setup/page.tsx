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

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupUserFormValue>({
    resolver: zodResolver(setupUserSchema),
  });

  const onSubmit = async (data: SetupUserFormValue) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    console.log("token:", token); // ← 追加

    if (!token) {
      console.log("token is null"); // ← 追加
      return;
    }

    await setupUser(token, {
      username: data.username,
      displayName: data.displayName,
    });

    router.push("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-6">プロフィール設定</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="username">ユーザー名</Label>
          <Input id="username" {...register("username")} placeholder="akito" />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="displayName">表示名</Label>
          <Input
            id="displayName"
            {...register("displayName")}
            placeholder="あきと"
          />
          {errors.displayName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.displayName.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "設定中..." : "はじめる"}
        </Button>
      </form>
    </div>
  );
}
