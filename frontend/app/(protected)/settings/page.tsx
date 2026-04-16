import { getCurrentUser } from "@/lib/api/auth";
import { getUserPresets } from "@/lib/api/preset";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/settings/ProfileForm";
import PresetList from "@/components/settings/PresetList";
import LogoutButton from "@/components/settings/LogoutButton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) redirect("/login");

  const [currentUser, presets] = await Promise.all([
    getCurrentUser(token).catch(() => null),
    getUserPresets(token).catch(() => []),
  ]);

  if (!currentUser) redirect("/setup");

  return (
    <main className="p-6 max-w-2xl mx-auto w-full min-h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-3.5rem)] md:min-h-0 md:flex md:flex-col md:overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-3xl font-bold">設定</h1>
        <Link href="/dashboard">
          <Button variant="outline">ダッシュボードへ</Button>
        </Link>
      </div>

      <section className="space-y-3 mb-6 shrink-0">
        <h2 className="text-xl font-semibold">プロフィール</h2>
        <ProfileForm token={token} initialUser={currentUser} />
      </section>

      <section className="space-y-3 mb-6 md:flex md:flex-col md:min-h-0 md:flex-1">
        <h2 className="text-xl font-semibold shrink-0">プリセット</h2>
        <PresetList token={token} initialPresets={presets} />
      </section>

      <section className="space-y-3 pt-4 border-t shrink-0">
        <h2 className="text-xl font-semibold">アカウント</h2>
        <LogoutButton />
      </section>
    </main>
  );
}
