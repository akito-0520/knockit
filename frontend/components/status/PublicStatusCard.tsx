"use client";

import { useEffect, useState } from "react";
import { StatusResponse } from "@/types/roomStatus";
import { camelize } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  username: string;
  initialStatus: StatusResponse;
};

export default function PublicStatusCard({ username, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    const eventSource = new EventSource(`${apiUrl}/status/${username}/stream`);

    eventSource.onmessage = (event) => {
      const data = camelize(JSON.parse(event.data)) as StatusResponse;
      setStatus(data);
    };

    return () => eventSource.close();
  }, [username]);

  return (
    <Card>
      <CardContent className="pt-6 md:pt-10 space-y-4 md:space-y-6">
        {!status.preset && !status.customMessage && (
          <p className="text-center text-lg md:text-2xl lg:text-3xl text-muted-foreground">
            まだ何も入力していません...
          </p>
        )}
        {status.preset?.label && (
          <div
            className="px-6 py-4 md:px-10 md:py-10 lg:py-14 rounded-lg text-white text-center text-xl md:text-4xl lg:text-6xl font-bold"
            style={{ backgroundColor: status.preset.color }}
          >
            {status.preset.label}
          </div>
        )}
        {status.customMessage && (
          <p className="text-center text-lg md:text-2xl lg:text-3xl">
            {status.customMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
