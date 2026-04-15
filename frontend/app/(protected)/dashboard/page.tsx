import { getMyStatus } from "@/lib/api/status";
import { getUserPresets } from "@/lib/api/preset";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatusCard from "@/components/dashboard/StatusCard";

export default async function DashboardPage() {
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

  const [myStatus, presets] = await Promise.all([
    getMyStatus(token).catch(() => null),
    getUserPresets(token).catch(() => []),
  ]);

  return (
    <div>
      <h1>ダッシュボード</h1>
      <StatusCard token={token} presets={presets} initialStatus={myStatus} />
    </div>
  );
}
