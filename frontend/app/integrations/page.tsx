import Link from "next/link";

export const metadata = {
  title: "外部連携（APIキー） | knockit",
};

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
const endpoint = `${apiBase}/status/me`;

const curlExample = `curl -X PUT ${endpoint} \\
  -H "X-API-Key: 発行したキー" \\
  -H "Content-Type: application/json" \\
  -d '{"preset_label":"会議中"}'`;

function Code({ children }: { children: string }) {
  return (
    <pre className="text-xs bg-muted rounded-md px-3 py-2.5 overflow-x-auto">
      {children}
    </pre>
  );
}

export default function IntegrationsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-2xl space-y-8 py-12">
        <div className="space-y-2">
          <Link
            href="/settings"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← 設定に戻る
          </Link>
          <h1 className="text-3xl font-bold">外部連携（APIキー）</h1>
          <p className="text-sm text-muted-foreground">
            APIキーを使うと、ログインしていない外部の仕組み（カレンダーの自動化、
            IoTボタン、他サービスの通知など）からステータスを更新できます。
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. APIキーを発行する</h2>
          <ol className="list-inside list-decimal space-y-1 text-sm leading-relaxed">
            <li>
              <Link
                href="/settings"
                className="underline hover:text-foreground"
              >
                設定
              </Link>
              画面の「APIキー」→「APIキーを発行」
            </li>
            <li>
              用途がわかるラベル（例:{" "}
              <code className="text-xs">iOS ショートカット</code>
              ）を入力して「発行」
            </li>
            <li>
              表示されたキーを控える
              <ul className="mt-1 list-inside list-disc pl-4 text-muted-foreground">
                <li>キーはこの画面でしか表示されません</li>
                <li>紛失したら削除して発行し直してください</li>
              </ul>
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            2. iOS / macOS ショートカットで設定する
          </h2>
          <p className="text-sm leading-relaxed">
            ショートカットAppの自動化から下記のリクエストを送ると、予定に合わせて
            ステータスが切り替わります。端末上の全カレンダー（iCloud / Google
            など）が 対象になります。
          </p>

          <div className="space-y-2">
            <h3 className="text-base font-medium">
              会議開始時に「会議中」にする
            </h3>
            <ol className="list-inside list-decimal space-y-1 text-sm leading-relaxed">
              <li>
                ショートカットApp →「オートメーション」→「新規オートメーション」
              </li>
              <li>
                トリガー:「イベント」→「開始時」（対象カレンダーやタイトル条件で絞ってもよい）
              </li>
              <li>
                アクション:「URLの内容を取得」
                <ul className="mt-1 list-inside list-disc pl-4 text-muted-foreground">
                  <li>
                    URL: <code className="text-xs">{endpoint}</code>
                  </li>
                  <li>方法: PUT</li>
                  <li>
                    ヘッダ: <code className="text-xs">X-API-Key</code> =
                    発行したキー
                  </li>
                  <li>
                    本文: JSON → <code className="text-xs">preset_label</code> =
                    表示したい プリセットのラベル（例:{" "}
                    <code className="text-xs">会議中</code>）
                  </li>
                </ul>
              </li>
              <li>「実行前に尋ねる」をオフにして即時実行にする</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-medium">会議終了時に戻す</h3>
            <p className="text-sm leading-relaxed">
              同様に、トリガーを「イベント」→「終了時」にして{" "}
              <code className="text-xs">preset_label</code>{" "}
              を別のプリセット（例: <code className="text-xs">入室OK</code>
              ）にしたオートメーションを作ります。
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">コマンドで試す</h2>
          <p className="text-sm leading-relaxed">
            <code className="text-xs">preset_label</code>{" "}
            にプリセットのラベルを入れて送ると、公開ページがすぐに切り替わります。
          </p>
          <Code>{curlExample}</Code>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">キーを止める</h2>
          <p className="text-sm leading-relaxed">
            設定画面の「APIキー」一覧から削除すると、そのキーでは更新できなくなります。
          </p>
        </section>
      </div>
    </main>
  );
}
