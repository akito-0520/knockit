"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

type Props = {
  username: string;
};

export default function ShareSection({ username }: Props) {
  const [urlCopied, setUrlCopied] = useState(false);
  const [iframeCopied, setIframeCopied] = useState(false);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = `${siteUrl}/${username}`;
  const iframeCode = `<iframe src="${siteUrl}/embed/${username}" width="400" height="200" frameborder="0"></iframe>`;

  const copy = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="mt-8 p-4 bg-muted rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">共有用URL</p>
          <Link
            href={shareUrl}
            target="_blank"
            rel="noopener"
            className="text-sm text-primary underline"
          >
            /{username}
          </Link>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(shareUrl, setUrlCopied)}
          className="ml-4 shrink-0 gap-1"
        >
          {urlCopied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {urlCopied ? "コピー済み" : "コピー"}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">埋め込みコード</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(iframeCode, setIframeCopied)}
          className="gap-1"
        >
          {iframeCopied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {iframeCopied ? "コピー済み" : "コピー"}
        </Button>
      </div>
    </div>
  );
}
