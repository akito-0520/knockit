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
      <CardContent className="pt-6 space-y-4">
        {status.preset?.label && (
          <div
            className="px-6 py-4 rounded-lg text-white text-center text-xl font-bold"
            style={{ backgroundColor: status.preset.color }}
          >
            {status.preset.label}
          </div>
        )}
        {status.customMessage && (
          <p className="text-center text-lg">{status.customMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}
