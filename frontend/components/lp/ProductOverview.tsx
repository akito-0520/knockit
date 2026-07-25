import Image from "next/image";

const STATUSES = [
  { label: "面接中", color: "#E27873" },
  { label: "会議中", color: "#EFC078" },
  { label: "勉強中", color: "#5479ED" },
  { label: "作業中", color: "#AA8CE8" },
  { label: "電話中", color: "#EE8FB8" },
  { label: "入室OK", color: "#7ACCA5" },
];

function DeviceFrame({
  src,
  alt,
  label,
  device,
}: {
  src: string;
  alt: string;
  label: string;
  device: "phone" | "tablet";
}) {
  // phone: 縦型スマホ / tablet: 横置きタブレット
  const isPhone = device === "phone";
  const frameWidth = isPhone ? "max-w-[160px]" : "max-w-[280px]";
  const aspect = isPhone ? "aspect-[9/19]" : "aspect-[4/3]";
  const sizes = isPhone ? "160px" : "280px";

  return (
    <div className={`w-full ${frameWidth}`}>
      <p className="mb-2 text-center text-sm font-bold">{label}</p>
      <div
        className={`relative ${aspect} overflow-hidden rounded-3xl border-4 border-neutral-800 bg-muted shadow-md`}
      >
        {/* 画像未配置でも枠のサイズは保たれる（下地のグレーが見える） */}
        <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-muted-foreground">
          スクリーンショット
        </span>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
        />
      </div>
    </div>
  );
}

export default function ProductOverview() {
  return (
    <section className="mx-auto mt-16 w-full max-w-3xl border-t pt-12">
      {/* 見出しと概要 */}
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">
          ノックしていいか、ひと目で。
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          会議中・作業中・休憩中。部屋の&quot;今&quot;を家族に共有できます。
          <br />
          家族側はアプリのインストールも登録も不要。URLを開くだけです。
        </p>
      </div>

      {/* 画面の対比 */}
      <div className="mt-10 flex flex-col items-center justify-center gap-5 md:flex-row md:gap-8">
        <DeviceFrame
          src="/lp/dashboard-phone.png"
          alt="スマホで自分のステータスを更新するダッシュボード画面"
          label="あなたの画面"
          device="phone"
        />

        <div className="flex shrink-0 flex-col items-center gap-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-7 rotate-90 text-neutral-800 md:rotate-0"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <span className="text-xs font-bold whitespace-nowrap text-muted-foreground">
            リアルタイムで反映
          </span>
        </div>

        <DeviceFrame
          src="/lp/status-tablet.png"
          alt="横置きタブレットに表示した家族向けの公開ステータス画面"
          label="家族の画面"
          device="tablet"
        />
      </div>

      {/* ステータス一覧 */}
      <div className="mt-12 text-center">
        <p className="text-sm font-bold text-muted-foreground">
          用意しているステータス
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          ステータスは自由に編集できます。
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {STATUSES.map((status) => (
            <span
              key={status.label}
              style={{ backgroundColor: status.color }}
              className="rounded-full px-3 py-1 text-sm font-bold text-white"
            >
              {status.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
