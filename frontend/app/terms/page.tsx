import Link from "next/link";

export const metadata = {
  title: "利用規約 | knockit",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="space-y-2">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            ← トップに戻る
          </Link>
          <h1 className="text-3xl font-bold">利用規約</h1>
          <p className="text-sm text-muted-foreground">最終更新日：2026年5月12日</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第1条（はじめに）</h2>
          <p className="text-sm leading-relaxed">
            本利用規約（以下「本規約」）は、knockit（以下「本サービス」）の利用に関する条件を定めるものです。本サービスをご利用いただくことで、本規約に同意いただいたものとみなします。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第2条（対象ユーザー）</h2>
          <p className="text-sm leading-relaxed">
            本サービスは13歳以上の方を対象としています。13歳未満の方はご利用いただけません。18歳未満の方は保護者の同意のもとでご利用ください。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第3条（アカウント）</h2>
          <ul className="text-sm leading-relaxed space-y-1 list-disc list-inside">
            <li>本サービスはGoogleアカウントを使用してログインします。</li>
            <li>アカウント情報の管理はご自身の責任で行ってください。</li>
            <li>第三者へのアカウントの貸与・譲渡は禁止します。</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第4条（禁止事項）</h2>
          <p className="text-sm leading-relaxed">以下の行為を禁止します。</p>
          <ul className="text-sm leading-relaxed space-y-1 list-disc list-inside">
            <li>他人のユーザー名を無断で使用すること</li>
            <li>不正アクセス・サーバーへの攻撃行為</li>
            <li>公序良俗に反するステータスメッセージの設定</li>
            <li>商業目的での無断利用</li>
            <li>虚偽の情報での登録</li>
            <li>その他、法令に違反する行為</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">第5条（免責事項）</h2>

          <div className="space-y-2">
            <h3 className="text-base font-medium">5-1. 損害の免責</h3>
            <p className="text-sm leading-relaxed">
              本サービスの利用、またはステータス情報の共有によって生じた損害について、運営者は一切の責任を負いません。
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-medium">5-2. 情報の正確性</h3>
            <p className="text-sm leading-relaxed">
              本サービス上のステータスと実際の状況が一致していることを保証しません。ステータス情報を信頼したことによって生じたトラブルや損害についても、運営者は責任を負いません。
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-medium">5-3. 第三者サービス</h3>
            <p className="text-sm leading-relaxed">
              本サービスはSupabase・Vercel等の第三者サービスを利用しています。これらのサービスの障害・停止により本サービスが利用できなくなった場合でも、運営者は責任を負いません。
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第6条（サービスの変更・終了）</h2>
          <p className="text-sm leading-relaxed">
            運営者は、ユーザーへの事前通知なく、本サービスの内容変更、停止、または終了を行うことがあります。これによってユーザーに生じた損害について、運営者は責任を負いません。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">第7条（アカウントの停止・削除）</h2>

          <div className="space-y-2">
            <h3 className="text-base font-medium">7-1. 運営者による停止</h3>
            <p className="text-sm leading-relaxed">
              ユーザーが本規約に違反した場合、運営者は事前通知なくアカウントを停止または削除することができます。
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-medium">7-2. ユーザーによる削除</h3>
            <p className="text-sm leading-relaxed">
              ユーザーはいつでも設定画面からアカウントを削除することができます。
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第8条（個人情報）</h2>
          <p className="text-sm leading-relaxed">
            個人情報の取り扱いについては、別途定めるプライバシーポリシーによります。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第9条（規約の改定）</h2>
          <p className="text-sm leading-relaxed">
            運営者は必要に応じて本規約を改定することがあります。改定後の規約はサービス上に掲示した時点で効力を生じ、改定後も本サービスの利用を継続した場合は新しい規約に同意したものとみなします。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第10条（準拠法・管轄裁判所）</h2>
          <p className="text-sm leading-relaxed">
            本規約は日本法に準拠します。本規約に関する紛争については、運営者の住所地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">第11条（お問い合わせ）</h2>
          <p className="text-sm leading-relaxed">
            本規約に関するお問い合わせは、
            <Link href="/contact" className="underline hover:text-foreground">
              お問い合わせページ
            </Link>
            よりご連絡ください。
          </p>
        </section>
      </div>
    </main>
  );
}
