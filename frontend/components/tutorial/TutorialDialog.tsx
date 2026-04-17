"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function TutorialDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>knockit の使い方</DialogTitle>
          <DialogDescription>
            はじめての方へ、基本的な使い方をご紹介します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">基本の流れ</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>プリセットを選ぶか、カスタムメッセージを入力</li>
              <li>「ステータスを更新」で反映</li>
              <li>共有URLを家族や友人に共有</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">画面について</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  ダッシュボード
                </span>
                — ステータスの確認・更新を行う画面
              </li>
              <li>
                <span className="font-medium text-foreground">設定</span>—
                表示名の変更やプリセットの追加・削除・編集
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">知っておくと便利なこと</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>共有URLは誰でも閲覧できます</li>
              <li>
                プリセットやカスタムメッセージは更新後すぐに共有先へ反映されます
              </li>
              <li>この説明は設定画面の「使い方」からいつでも確認できます</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            はじめる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
