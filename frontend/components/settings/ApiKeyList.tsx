"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiKeySchema, ApiKeyFormValue } from "@/lib/schemas/apiKey";
import { createApiKey, deleteApiKey } from "@/lib/api/apiKey";
import { APIKeyResponse, CreatedAPIKeyResponse } from "@/types/apiKey";
import { formatRelativeTime } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Plus, Copy, Check } from "lucide-react";

type Props = {
  token: string;
  initialApiKeys: APIKeyResponse[];
};

const MAX_API_KEYS = 10;
const DOCS_URL =
  "https://github.com/akito-0520/knockit/blob/main/docs/INTEGRATIONS.md";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "https://<your-api-host>";

const curlExample = (key: string) =>
  [
    `curl -X PUT ${apiBase}/status/me \\`,
    `  -H "X-API-Key: ${key}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"preset_label":"会議中"}'`,
  ].join("\n");

export default function ApiKeyList({ token, initialApiKeys }: Props) {
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [isAdding, setIsAdding] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedAPIKeyResponse | null>(
    null,
  );
  const [copied, setCopied] = useState<"key" | "curl" | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ApiKeyFormValue>({
    resolver: zodResolver(apiKeySchema),
  });

  const isAtLimit = apiKeys.length >= MAX_API_KEYS;

  const onSubmit = async (data: ApiKeyFormValue) => {
    if (isAtLimit) return;
    try {
      const created = await createApiKey(token, data);
      setApiKeys([
        {
          id: created.id,
          label: created.label,
          keyPrefix: created.keyPrefix,
          lastUsedAt: null,
          createdAt: created.createdAt,
        },
        ...apiKeys,
      ]);
      setCreatedKey(created);
      reset({ label: "" });
      setIsAdding(false);
    } catch {
      setError("label", {
        message: "このラベルは使用中か、上限に達しています",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "このAPIキーを削除しますか？以降このキーでの更新はできなくなります。",
      )
    )
      return;
    await deleteApiKey(token, id);
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const copy = async (text: string, which: "key" | "curl") => {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        外部システム（iOS ショートカット等）から{" "}
        <code className="text-xs">PUT /status/me</code> を呼び出すためのキー。
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          設定手順
        </a>
      </p>

      <div className="border rounded-lg bg-card">
        {apiKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            APIキーがありません
          </p>
        ) : (
          <ul className="divide-y">
            {apiKeys.map((key) => (
              <li key={key.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{key.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {key.keyPrefix}…{" "}
                    <span className="font-sans">
                      ·{" "}
                      {key.lastUsedAt
                        ? `最終使用 ${formatRelativeTime(key.lastUsedAt)}`
                        : "未使用"}
                    </span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(key.id)}
                  aria-label="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-right">
          {apiKeys.length} / {MAX_API_KEYS}
        </p>
        {isAdding ? (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <Label htmlFor="apikey-label">ラベル</Label>
                  <Input
                    id="apikey-label"
                    {...register("label")}
                    placeholder="iOS ショートカット"
                  />
                  {errors.label && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.label.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    発行
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAdding(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAdding(true)}
            disabled={isAtLimit}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isAtLimit
              ? `上限（${MAX_API_KEYS}件）に達しています`
              : "APIキーを発行"}
          </Button>
        )}
      </div>

      <Dialog
        open={createdKey !== null}
        onOpenChange={(open) => !open && setCreatedKey(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>APIキーを発行しました</DialogTitle>
            <DialogDescription>
              このキーは<strong>この画面でしか表示されません</strong>。
              安全な場所に保管してください。
            </DialogDescription>
          </DialogHeader>

          {createdKey && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">APIキー</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 text-xs bg-muted rounded px-2 py-2 break-all">
                    {createdKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy(createdKey.key, "key")}
                    aria-label="APIキーをコピー"
                  >
                    {copied === "key" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs">使用例（curl）</Label>
                <div className="flex items-start gap-2 mt-1">
                  <pre className="flex-1 text-xs bg-muted rounded px-2 py-2 overflow-x-auto">
                    {curlExample(createdKey.key)}
                  </pre>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy(curlExample(createdKey.key), "curl")}
                    aria-label="curl コマンドをコピー"
                  >
                    {copied === "curl" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                iOS ショートカットでの設定方法は{" "}
                <a
                  href={DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  INTEGRATIONS.md
                </a>{" "}
                を参照してください。
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
