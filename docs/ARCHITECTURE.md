# Knockit - Architecture Document

## 1. プロジェクト概要

面接中・会議中などの自室のステータスを家族にリアルタイム共有するWebアプリケーション。

### 解決する課題

面接やオンライン会議の最中に家族が部屋に入ってきてしまう問題を解決する。
各ユーザーが自分の部屋のステータスを管理し、専用の表示用URLを家族に共有することで、
部屋に入る前に「今何をしているか」を確認できるようにする。

### ユースケース

1. ユーザーがOAuthでログインし、ユーザー名を設定する
2. 管理画面でプリセット（面接中・会議中など）またはカスタムメッセージでステータスを更新する
3. 家族は専用端末（タブレットなど）で公開URLを常時表示しておく
4. ステータスが変更されると、SSE (Server-Sent Events) で即座に画面が更新される

---

## 2. 技術スタック

| レイヤー       | 技術                                      | 選定理由                                       |
| -------------- | ----------------------------------------- | ---------------------------------------------- |
| フロントエンド | Next.js (App Router) + TypeScript         | SSR/SSG対応、ファイルベースルーティング        |
| UIライブラリ   | shadcn UI + Tailwind CSS                  | コンポーネントアーキテクチャ、レスポンシブ対応 |
| バックエンド   | Go 1.22+ 標準ライブラリ (net/http)        | Go学習目的、フレームワーク不使用               |
| データベース   | PostgreSQL (Supabase)                     | 無料枠あり、マネージドサービス                 |
| 認証           | Supabase Auth (OAuth: Google/GitHub)      | フロントでOAuth → Go側でJWT検証                |
| リアルタイム   | Server-Sent Events (SSE)                  | 標準ライブラリのみで実装可能、単方向配信に最適 |
| コンテナ       | Docker / Docker Compose                   | 開発環境の統一                                 |
| デプロイ       | Vercel (フロント) / Render (バックエンド) | 無料枠の範囲で運用                             |

---

## 3. アーキテクチャ

### 3.1 全体構成図

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Next.js (Vercel)│────▶│  Go API (Render)  │────▶│ PostgreSQL     │
│                  │     │                   │     │ (Supabase)     │
│  - 管理画面      │     │  - REST API       │     │                │
│  - 公開ページ    │     │  - SSE 配信       │     │  - users       │
│  - OAuth 認証    │     │  - JWT 検証       │     │  - room_statuses│
│                  │     │                   │     │  - presets     │
│  Supabase Auth ──┼─JWT─▶  JWT 検証         │     │                │
└─────────────────┘     └──────────────────┘     └────────────────┘
        │                        │
        │   EventSource          │ SSE (text/event-stream)
        │◀───────────────────────│
        │  リアルタイム更新       │
```

### 3.2 認証フロー

```
ユーザー → Next.js → Supabase Auth (OAuth: Google/GitHub)
                          │
                          ▼
                    JWT (Access Token) 発行
                          │
                          ▼
              Next.js → Authorization: Bearer <JWT> → Go API
                                                        │
                                                        ▼
                                              JWT Secret で検証
                                              claims["sub"] = ユーザーID
```

### 3.3 バックエンド レイヤードアーキテクチャ

依存方向は **上から下** への一方向のみ。下位レイヤーは上位レイヤーを知らない。

```
┌─────────────────────────────────┐
│  Handler (プレゼンテーション層)    │  ← HTTP リクエスト/レスポンス
│  - リクエスト受信・デコード       │
│  - バリデーション呼び出し         │
│  - サービス呼び出し              │
│  - レスポンス返却                │
├─────────────────────────────────┤
│  Middleware                      │  ← 横断的関心事
│  - JWT認証, CORS, ロギング       │
├─────────────────────────────────┤
│  Service (ビジネスロジック層)      │  ← ビジネスルール
│  - ユーザーセットアップ           │
│  - ステータス更新 + SSE通知       │
│  - プリセット取得                │
├─────────────────────────────────┤
│  Repository (データアクセス層)    │  ← DB操作
│  - SQL クエリ実行                │
│  - モデルへのマッピング           │
├─────────────────────────────────┤
│  Model (ドメインモデル)           │  ← 全層で共有
│  - エンティティ定義              │
│  - リクエスト/レスポンス型        │
│  - カスタムエラー                │
└─────────────────────────────────┘
```

---

## 4. ディレクトリ構成

### 4.1 バックエンド

```
backend/
├── cmd/
│   └── server/
│       └── main.go                 # エントリーポイント (DI・ルーティング・サーバー起動)
├── internal/
│   ├── config/
│   │   └── config.go               # 環境変数から設定を読み込み
│   ├── model/
│   │   ├── user.go                 # User エンティティ + リクエスト/レスポンス型
│   │   ├── status.go               # RoomStatus エンティティ + リクエスト/レスポンス型
│   │   ├── preset.go               # Preset エンティティ + レスポンス型
│   │   └── errors.go               # カスタムエラー定義 (ErrNotFound 等)
│   ├── repository/
│   │   ├── user_repository.go      # users テーブルの CRUD
│   │   ├── status_repository.go    # room_statuses テーブルの CRUD (トランザクション)
│   │   └── preset_repository.go    # presets テーブルの Read
│   ├── service/
│   │   ├── auth_service.go         # ユーザーセットアップ・プロフィール管理
│   │   ├── status_service.go       # ステータス管理 + SSE クライアント管理
│   │   └── preset_service.go       # プリセット取得
│   ├── handler/
│   │   ├── auth_handler.go         # POST /setup, GET /me, PUT /me
│   │   ├── status_handler.go       # GET/PUT /status, GET /stream (SSE)
│   │   └── preset_handler.go       # GET /presets, GET /health
│   ├── middleware/
│   │   ├── auth.go                 # Supabase JWT 検証ミドルウェア
│   │   ├── cors.go                 # CORS 設定ミドルウェア
│   │   └── logging.go              # リクエストログ出力ミドルウェア
│   └── validator/
│       └── validator.go            # 入力バリデーション (正規表現ベース)
├── pkg/
│   └── response/
│       └── response.go             # HTTP レスポンスヘルパー (JSON/Error/ValidationErrors)
├── migrations/
│   └── 001_create_tables.sql       # DB マイグレーション + 初期プリセットデータ
├── Dockerfile                      # マルチステージビルド
├── docker-compose.yml              # 開発用 (API + PostgreSQL)
├── go.mod
├── go.sum
└── .env.example                    # 環境変数テンプレート
```

### 4.2 フロントエンド

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # ランディングページ (サービス説明 + ログイン)
│   │   ├── login/
│   │   │   └── page.tsx             # ログインページ (OAuth ボタン)
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts         # OAuth コールバック処理
│   │   ├── dashboard/
│   │   │   └── page.tsx             # 管理画面 (ステータス変更・プロフィール設定)
│   │   ├── [username]/
│   │   │   └── page.tsx             # 公開ステータスページ (SSE リアルタイム更新)
│   │   └── layout.tsx               # ルートレイアウト
│   ├── components/
│   │   ├── ui/                      # shadcn UI コンポーネント (自動生成)
│   │   ├── status/
│   │   │   ├── StatusCard.tsx       # ステータス表示カード (公開ページ用)
│   │   │   ├── StatusSelector.tsx   # プリセット選択グリッド (管理画面用)
│   │   │   ├── StatusBadge.tsx      # ステータスバッジ (小さい表示)
│   │   │   └── CustomStatusInput.tsx # カスタムメッセージ入力
│   │   ├── auth/
│   │   │   ├── LoginButton.tsx      # OAuth ログインボタン
│   │   │   └── AuthGuard.tsx        # 認証ガードラッパー
│   │   └── layout/
│   │       ├── Header.tsx           # ヘッダー
│   │       └── Footer.tsx           # フッター
│   ├── lib/
│   │   ├── supabase.ts              # Supabase ブラウザクライアント初期化
│   │   └── api.ts                   # バックエンド API 呼び出しヘルパー
│   ├── hooks/
│   │   ├── useAuth.ts               # 認証フック (login/logout/session)
│   │   ├── useStatus.ts             # ステータス取得・更新フック
│   │   └── useStatusStream.ts       # SSE リアルタイム購読フック
│   └── types/
│       └── index.ts                 # TypeScript 型定義
├── public/
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 5. データベース設計

### 5.1 ER図

```
users ||--o{ room_statuses : "has"
presets ||--o{ room_statuses : "referenced by"
```

### 5.2 テーブル定義

#### users

| カラム       | 型           | 制約             | 説明                     |
| ------------ | ------------ | ---------------- | ------------------------ |
| id           | UUID         | PK               | Supabase Auth の user ID |
| username     | VARCHAR(30)  | UNIQUE, NOT NULL | 公開URL用ユーザー名      |
| display_name | VARCHAR(100) | NOT NULL         | 表示名                   |
| avatar_url   | TEXT         | DEFAULT ''       | プロフィール画像URL      |
| created_at   | TIMESTAMPTZ  | DEFAULT NOW()    | 作成日時                 |
| updated_at   | TIMESTAMPTZ  | DEFAULT NOW()    | 更新日時                 |

#### presets

| カラム        | 型          | 制約                           | 説明                         |
| ------------- | ----------- | ------------------------------ | ---------------------------- |
| id            | UUID        | PK, DEFAULT uuid_generate_v4() | プリセットID                 |
| label         | VARCHAR(50) | NOT NULL                       | ラベル (例: "面接中")        |
| emoji         | VARCHAR(10) | NOT NULL                       | 絵文字 (例: "🎤")            |
| color         | VARCHAR(7)  | NOT NULL                       | カラーコード (例: "#EF4444") |
| display_order | INT         | NOT NULL, DEFAULT 0            | 表示順                       |

#### room_statuses

| カラム         | 型           | 制約                           | 説明               |
| -------------- | ------------ | ------------------------------ | ------------------ |
| id             | UUID         | PK, DEFAULT uuid_generate_v4() | ステータスID       |
| user_id        | UUID         | FK → users(id), NOT NULL       | ユーザーID         |
| preset_id      | UUID         | FK → presets(id), NULL可       | プリセットID       |
| custom_message | VARCHAR(200) | DEFAULT ''                     | カスタムメッセージ |
| is_active      | BOOLEAN      | DEFAULT true                   | アクティブフラグ   |
| updated_at     | TIMESTAMPTZ  | DEFAULT NOW()                  | 更新日時           |

#### インデックス

- `idx_room_statuses_user_active` ON room_statuses(user_id, is_active)
- `idx_users_username` ON users(username)

### 5.3 初期プリセットデータ

| label  | emoji | color            | display_order |
| ------ | ----- | ---------------- | ------------- |
| 面接中 | 🎤    | #EF4444 (赤)     | 1             |
| 会議中 | 💼    | #F59E0B (黄)     | 2             |
| 勉強中 | 📚    | #3B82F6 (青)     | 3             |
| 作業中 | 💻    | #8B5CF6 (紫)     | 4             |
| 電話中 | 📞    | #EC4899 (ピンク) | 5             |
| 入室OK | ✅    | #10B981 (緑)     | 6             |

---

## 6. API 設計

### 6.1 ベースURL

- 開発: `http://localhost:8080`
- 本番: `https://knockit-api.onrender.com` (例)

### 6.2 共通レスポンスフォーマット

成功時:

```json
{
  "success": true,
  "data": { ... }
}
```

エラー時:

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "details": [{ "field": "username", "message": "3文字以上で入力してください" }]
}
```

### 6.3 エンドポイント一覧

#### 認証不要

| メソッド | パス                             | 説明                         |
| -------- | -------------------------------- | ---------------------------- |
| GET      | /api/v1/health                   | ヘルスチェック               |
| GET      | /api/v1/presets                  | プリセット一覧取得           |
| GET      | /api/v1/status/{username}        | ユーザーの公開ステータス取得 |
| GET      | /api/v1/status/{username}/stream | SSE リアルタイム配信         |

#### 認証必須 (Authorization: Bearer {JWT})

| メソッド | パス                    | 説明                   |
| -------- | ----------------------- | ---------------------- |
| POST     | /api/v1/users/me/setup  | 初回ユーザー名設定     |
| GET      | /api/v1/users/me        | 自分のプロフィール取得 |
| PUT      | /api/v1/users/me        | プロフィール更新       |
| GET      | /api/v1/users/me/status | 自分のステータス取得   |
| PUT      | /api/v1/users/me/status | ステータス更新         |

---

## 7. 画面構成

| 画面           | パス        | 認証 | 説明                             |
| -------------- | ----------- | ---- | -------------------------------- |
| ランディング   | /           | 不要 | サービス説明 + ログインボタン    |
| ログイン       | /login      | 不要 | Google/GitHub OAuth              |
| 管理画面       | /dashboard  | 必須 | ステータス変更・プロフィール設定 |
| 公開ステータス | /{username} | 不要 | リアルタイムステータス表示 (SSE) |

---

## 8. リアルタイム更新 (SSE)

### 仕組み

専用端末（タブレットなど）で公開ページを常時表示し、ステータス変更を即座に反映する。

```
[管理画面]                  [Go API]                [公開ページ (タブレット)]
    │                         │                         │
    │ PUT /status             │                         │
    │────────────────────────▶│                         │
    │                         │ DB 更新                 │
    │                         │                         │
    │                         │ SSE: event: status      │
    │                         │────────────────────────▶│
    │                         │ data: {...}             │
    │                         │                         │ 画面即時更新
```

### Go側: SSEクライアント管理

- `Subscribe(userID)` — クライアント登録、チャネル返却
- `Unsubscribe(client)` — クライアント削除、チャネルクローズ
- `notifyClients(userID, status)` — 該当ユーザー購読中の全クライアントに送信
- `sync.RWMutex` で並行アクセスを保護

### フロント側: EventSource API

```
const eventSource = new EventSource(`/api/v1/status/${username}/stream`)
eventSource.addEventListener('status', (e) => { setStatus(JSON.parse(e.data)) })
```

---

## 9. デプロイ構成

| サービス       | プラットフォーム | プラン       | 備考                          |
| -------------- | ---------------- | ------------ | ----------------------------- |
| フロントエンド | Vercel           | Hobby (無料) | Next.js 自動最適化            |
| バックエンド   | Render           | Free         | Docker デプロイ、スリープあり |
| データベース   | Supabase         | Free         | PostgreSQL、500MB             |
| 認証           | Supabase Auth    | Free         | OAuth (Google/GitHub)         |
