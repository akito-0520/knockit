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
import Link from "next/link";

type Props = {
  token: string;
  initialApiKeys: APIKeyResponse[];
};

const MAX_API_KEYS = 10;
const DOCS_PATH = "/integrations";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

const curlExample = (key: string) =>
  [
    `curl -X PUT ${apiBase}/status/me \\`,
    `  -H "X-API-Key: ${key}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"preset_label":"会議中"}'`,
  ].join("\n");

function CopyableCode({
  label,
  text,
  copied,
  onCopy,
}: {
  label: string;
  text: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1 min-w-0">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        {copied && (
          <span className="text-[10px] text-green-600 dark:text-green-500">
            コピーしました
          </span>
        )}
      </div>
      <div className="relative min-w-0">
        <pre
          role="button"
          tabIndex={0}
          title="タップでコピー"
          onClick={onCopy}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCopy();
            }
          }}
          className="text-xs bg-muted rounded-md px-3 py-2.5 pr-11 overflow-x-auto whitespace-pre select-all cursor-pointer transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {text}
        </pre>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1.5 right-1.5 bg-background"
          onClick={onCopy}
          aria-label={`${label}をコピー`}
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ApiKeyList({ token, initialApiKeys }: Props) {
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [isAdding, setIsAdding] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedAPIKeyResponse | null>(
    null,
  );
  const [copied, setCopied] = useState<"key" | "curl" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<APIKeyResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteApiKey(token, deleteTarget.id);
      setApiKeys(apiKeys.filter((k) => k.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
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
        <Link href={DOCS_PATH} className="underline hover:text-foreground">
          設定手順
        </Link>
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
                  <p className="text-xs text-muted-foreground truncate">
                    <span className="font-mono">{key.keyPrefix}…</span>
                    <span className="mx-1.5">·</span>
                    {key.lastUsedAt
                      ? `最終使用 ${formatRelativeTime(key.lastUsedAt)}`
                      : "未使用"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(key)}
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>APIキーを発行しました</DialogTitle>
            <DialogDescription>
              このキーは<strong>この画面でしか表示されません</strong>。
              安全な場所に保管してください。
            </DialogDescription>
          </DialogHeader>

          {createdKey && (
            <div className="space-y-4 min-w-0">
              <CopyableCode
                label="APIキー"
                text={createdKey.key}
                copied={copied === "key"}
                onCopy={() => copy(createdKey.key, "key")}
              />

              <CopyableCode
                label="使用例（curl）"
                text={curlExample(createdKey.key)}
                copied={copied === "curl"}
                onCopy={() => copy(curlExample(createdKey.key), "curl")}
              />

              <p className="text-xs text-muted-foreground">
                iOS ショートカットでの設定方法は{" "}
                <Link
                  href={DOCS_PATH}
                  className="underline hover:text-foreground"
                >
                  連携ガイド
                </Link>{" "}
                を参照してください。
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>APIキーを削除しますか？</DialogTitle>
            <DialogDescription>
              「{deleteTarget?.label}
              」を削除すると、以降このキーでのステータス更新はできなくなります。
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
