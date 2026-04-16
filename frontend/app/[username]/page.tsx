import type { Metadata } from "next";
import { getPublicStatus } from "@/lib/api/status";
import { notFound } from "next/navigation";
import PublicStatusCard from "@/components/status/PublicStatusCard";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const status = await getPublicStatus(username).catch(() => null);

  if (!status) {
    return {
      title: "ユーザーが見つかりません",
    };
  }

  const title = `${status.displayName} の今`;
  const description = `${status.displayName} のステータスをリアルタイムで確認できます。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
  };
}

export default async function PublicStatusPage({ params }: Props) {
  const { username } = await params;
  const status = await getPublicStatus(username).catch(() => null);

  if (!status) notFound();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {status.displayName} の今
        </h1>
        <PublicStatusCard username={username} initialStatus={status} />
      </div>
    </main>
  );
}
