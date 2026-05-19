import { getPublicStatus } from "@/lib/api/status";
import { notFound } from "next/navigation";
import PublicStatusCard from "@/components/status/PublicStatusCard";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function EmbedPage({ params }: Props) {
  const { username } = await params;
  const status = await getPublicStatus(username).catch(() => null);

  if (!status) notFound();

  return (
    <main className="p-4 bg-transparent">
      <PublicStatusCard username={username} initialStatus={status} />
    </main>
  );
}
