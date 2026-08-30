"use client";

import { useEffect, useReducer, useState } from "react";
import { StatusResponse } from "@/types/roomStatus";
import { camelize } from "@/lib/api";
import { formatRelativeTime } from "@/lib/time";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  username: string;
  initialStatus: StatusResponse;
};

export default function PublicStatusCard({ username, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  // 経過時間の表示を一定間隔で再計算するためだけの再レンダートリガー
  const [, tick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    const eventSource = new EventSource(`${apiUrl}/status/${username}/stream`);

    eventSource.onmessage = (event) => {
      const data = camelize(JSON.parse(event.data)) as StatusResponse;
      setStatus(data);
    };

    return () => eventSource.close();
  }, [username]);

  // 「最終更新: 3分前」の表示を経過に合わせて更新する
  useEffect(() => {
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  const relativeUpdatedAt = status.updatedAt
    ? formatRelativeTime(status.updatedAt)
    : "";

  return (
    <Card>
      <CardContent className="pt-6 md:pt-10 space-y-4 md:space-y-6">
        {!status.preset.label && !status.customMessage && (
          <p className="text-center text-lg md:text-2xl lg:text-6xl text-muted-foreground whitespace-nowrap">
            まだ何も入力していません...
          </p>
        )}
        {status.preset?.label && (
          <div
            className="px-6 py-4 md:px-10 md:py-10 lg:px-20 lg:py-28 rounded-lg text-white text-center text-xl md:text-4xl lg:text-9xl font-bold"
            style={{ backgroundColor: status.preset.color }}
          >
            {status.preset.label}
          </div>
        )}
        {status.customMessage && (
          <p className="text-center text-lg md:text-2xl lg:text-6xl">
            {status.customMessage}
          </p>
        )}
        {relativeUpdatedAt && (
          <p
            className="text-center text-xs md:text-sm text-muted-foreground"
            suppressHydrationWarning
          >
            最終更新: {relativeUpdatedAt}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
