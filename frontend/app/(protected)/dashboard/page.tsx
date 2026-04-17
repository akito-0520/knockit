import { getMyStatus } from "@/lib/api/status";
import { getUserPresets } from "@/lib/api/preset";
import { getCurrentUser } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatusCard from "@/components/dashboard/StatusCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import InitialTutorial from "@/components/tutorial/InitialTutorial";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tutorial } = await searchParams;
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

  const currentUser = await getCurrentUser(token).catch(() => null);
  if (!currentUser) redirect("/setup");

  const [myStatus, presets] = await Promise.all([
    getMyStatus(token).catch(() => null),
    getUserPresets(token).catch(() => []),
  ]);

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground">@{currentUser.username}</p>
        </div>
        <Link href="/settings">
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {tutorial === "true" && <InitialTutorial />}

      <StatusCard token={token} presets={presets} initialStatus={myStatus} />

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          共有用URL：
          <Link
            href={`/${currentUser.username}`}
            target="_blank"
            rel="noopener"
            className="ml-2 underline text-primary"
          >
            /{currentUser.username}
          </Link>
        </p>
      </div>
    </main>
  );
}
