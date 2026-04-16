# Knockit - Architecture Document

## 1. プロジェクト概要

面接中・会議中などの自室のステータスを家族にリアルタイム共有するWebアプリケーション。

### 解決する課題

面接やオンライン会議の最中に家族が部屋に入ってきてしまう問題を解決する。
各ユーザーが自分の部屋のステータスを管理し、専用の表示用URLを家族に共有することで、
部屋に入る前に「今何をしているか」を確認できるようにする。

### ユースケース

1. ユーザーがGoogle OAuthでログインし、ユーザー名・表示名を設定する
2. ダッシュボードでプリセット（面接中・会議中など）またはカスタムメッセージでステータスを更新する
3. 家族は専用端末（タブレットなど）で公開URLを常時表示しておく
4. ステータスが変更されると、SSE (Server-Sent Events) で即座に画面が更新される

---

## 2. 技術スタック

| レイヤー       | 技術                                      | 選定理由                                       |
| -------------- | ----------------------------------------- | ---------------------------------------------- |
| フロントエンド | Next.js 16 (App Router) + TypeScript      | SSR/SSG対応、ファイルベースルーティング         |
| UIライブラリ   | shadcn UI + Tailwind CSS v4               | コンポーネントアーキテクチャ、レスポンシブ対応  |
| バリデーション | Zod + react-hook-form                     | スキーマベースのバリデーション                  |
| バックエンド   | Go 1.22+ 標準ライブラリ (net/http)        | Go学習目的、フレームワーク不使用               |
| データベース   | PostgreSQL (Supabase)                     | 無料枠あり、マネージドサービス                 |
| 認証           | Supabase Auth (Google OAuth)              | フロントでOAuth → Go側でJWT検証                |
| リアルタイム   | Server-Sent Events (SSE)                  | 標準ライブラリのみで実装可能、単方向配信に最適 |
| コンテナ       | Docker / Docker Compose                   | 開発環境の統一                                 |
| デプロイ       | Fly.io (バックエンド)                     | リージョン nrt (東京) で低レイテンシ           |

---

## 3. アーキテクチャ

### 3.1 全体構成図

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Next.js         │────▶│  Go API (Fly.io) │────▶│ PostgreSQL     │
│                  │     │                   │     │ (Supabase)     │
│  - トップページ  │     │  - REST API       │     │                │
│  - ダッシュボード│     │  - SSE 配信       │     │  - users       │
│  - 設定画面      │     │  - JWT 検証       │     │  - room_statuses│
│  - 公開ページ    │     │                   │     │  - presets     │
│                  │     │                   │     │                │
│  Supabase Auth ──┼─JWT─▶  JWT 検証         │     │                │
└─────────────────┘     └──────────────────┘     └────────────────┘
        │                        │
        │   EventSource          │ SSE (text/event-stream)
        │◀───────────────────────│
        │  リアルタイム更新       │
```

### 3.2 認証フロー

```
ユーザー → Next.js → Supabase Auth (Google OAuth)
                          │
                          ▼
                    JWT (Access Token) 発行
                          │
                          ▼
              Next.js → Authorization: Bearer <JWT> → Go API
                                                        │
                                                        ▼
                                              Supabase JWKS で検証
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
│  - JWT認証 (JWKS), CORS          │
├─────────────────────────────────┤
│  Service (ビジネスロジック層)      │  ← ビジネスルール
│  - ユーザーセットアップ           │
│  - ステータス更新 + SSE通知       │
│  - プリセット CRUD + デフォルト作成│
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
├── main.go                         # エントリーポイント (DI・ルーティング・サーバー起動)
├── internal/
│   ├── config/
│   │   └── config.go               # 環境変数から設定を読み込み
│   ├── model/
│   │   ├── user.go                 # User エンティティ + リクエスト/レスポンス型
│   │   ├── status.go               # RoomStatus エンティティ + リクエスト/レスポンス型
│   │   ├── preset.go               # Preset エンティティ + リクエスト/レスポンス型
│   │   └── error.go                # カスタムエラー定義 (ErrNotFound 等)
│   ├── repository/
│   │   ├── user_repository.go      # users テーブルの CRUD
│   │   ├── status_repository.go    # room_statuses テーブルの CRUD (UPSERT方式)
│   │   └── preset_repository.go    # presets テーブルの CRUD
│   ├── service/
│   │   ├── auth_service.go         # ユーザーセットアップ・プロフィール管理
│   │   ├── status_service.go       # ステータス管理 + SSE クライアント管理
│   │   └── preset_service.go       # プリセット CRUD + デフォルト作成
│   ├── handler/
│   │   ├── auth_handler.go         # POST /auth/setup, GET /auth/me, PATCH /auth/me
│   │   ├── status_handler.go       # GET/PUT /status/me, GET /status/{username}
│   │   ├── streamStatus.go         # GET /status/{username}/stream (SSE)
│   │   └── preset_handler.go       # GET/POST/PATCH/DELETE /presets
│   ├── middleware/
│   │   ├── auth.go                 # Supabase JWKS による JWT 検証ミドルウェア
│   │   └── cors.go                 # CORS 設定ミドルウェア
│   └── validator/
│       └── validator.go            # 入力バリデーション (正規表現ベース)
├── pkg/
│   └── response/
│       └── response.go             # HTTP レスポンスヘルパー (JSON/Error/ValidationErrors)
├── migrations/
│   └── 001_create_tables.sql       # DB マイグレーション
├── fly.toml                        # Fly.io デプロイ設定
├── Dockerfile                      # マルチステージビルド
├── go.mod
└── .env.example                    # 環境変数テンプレート
```

### 4.2 フロントエンド

```
frontend/
├── app/
│   ├── layout.tsx                   # ルートレイアウト (OGPメタデータ)
│   ├── page.tsx                     # トップページ (サービス説明 + はじめるボタン)
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx             # ログインページ (Google OAuth)
│   │   └── setup/
│   │       └── page.tsx             # 初回セットアップ (ユーザー名・表示名設定)
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   └── page.tsx             # ダッシュボード (ステータス変更)
│   │   └── settings/
│   │       └── page.tsx             # 設定 (プロフィール編集・プリセット管理・ログアウト)
│   ├── [username]/
│   │   └── page.tsx                 # 公開ステータスページ (SSE + 動的OGP)
│   └── auth/
│       └── callback/
│           └── route.ts             # OAuth コールバック処理
├── components/
│   ├── ui/                          # shadcn UI コンポーネント (button, card, input, label)
│   ├── dashboard/
│   │   └── StatusCard.tsx           # ダッシュボード用ステータスカード
│   ├── settings/
│   │   ├── ProfileForm.tsx          # プロフィール編集フォーム
│   │   ├── PresetList.tsx           # プリセット一覧・管理
│   │   └── LogoutButton.tsx         # ログアウトボタン
│   └── status/
│       └── PublicStatusCard.tsx      # 公開ページ用ステータスカード (SSE対応)
├── lib/
│   ├── api/
│   │   ├── index.ts                 # API共通設定 (ベースURL、認証ヘッダー、unwrap)
│   │   ├── auth.ts                  # 認証系API (setup, me, update)
│   │   ├── status.ts                # ステータスAPI (public, me, update)
│   │   └── preset.ts                # プリセットAPI (CRUD)
│   ├── supabase/
│   │   ├── client.ts                # Supabase ブラウザクライアント
│   │   └── server.ts                # Supabase サーバーサイドクライアント
│   ├── schemas/
│   │   ├── user.ts                  # ユーザー関連のZodスキーマ
│   │   ├── status.ts                # ステータス関連のZodスキーマ
│   │   └── preset.ts                # プリセット関連のZodスキーマ
│   └── utils.ts                     # ユーティリティ (cn関数)
├── types/
│   ├── user/index.ts                # ユーザー型定義
│   ├── roomStatus/index.ts          # ステータス型定義
│   └── preset/index.ts              # プリセット型定義
├── proxy.ts                         # Supabase SSR ミドルウェア (認証ガード)
├── public/
│   └── icon.png                     # アプリアイコン
├── next.config.ts
├── package.json
├── Dockerfile
└── tsconfig.json
```

---

## 5. データベース設計

### 5.1 ER図

```
users ||--o{ room_statuses : "has"
users ||--o{ presets : "owns"
presets ||--o{ room_statuses : "referenced by"
```

### 5.2 テーブル定義

#### users

| カラム       | 型           | 制約             | 説明                     |
| ------------ | ------------ | ---------------- | ------------------------ |
| id           | UUID         | PK               | Supabase Auth の user ID |
| username     | VARCHAR(30)  | UNIQUE, NOT NULL | 公開URL用ユーザー名      |
| display_name | VARCHAR(100) | NOT NULL         | 表示名                   |
| created_at   | TIMESTAMPTZ  | DEFAULT NOW()    | 作成日時                 |
| updated_at   | TIMESTAMPTZ  | DEFAULT NOW()    | 更新日時                 |

#### presets

各ユーザーが自分専用のプリセットを管理する。ユーザー登録時にデフォルトプリセットがGoコードからINSERTされる。

| カラム        | 型          | 制約                           | 説明                         |
| ------------- | ----------- | ------------------------------ | ---------------------------- |
| id            | UUID        | PK, DEFAULT uuid_generate_v4() | プリセットID                 |
| user_id       | UUID        | FK → users(id), NOT NULL       | 所有ユーザーID               |
| label         | VARCHAR(50) | NOT NULL                       | ラベル (例: "面接中")        |
| color         | VARCHAR(7)  | NOT NULL                       | カラーコード (例: "#EF4444") |
| display_order | INT         | NOT NULL, DEFAULT 0            | 表示順                       |
| created_at    | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()        | 作成日時                     |
| updated_at    | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()        | 更新日時                     |

#### room_statuses

1ユーザーにつき1行。ステータス更新時は UPDATE で上書きする。

| カラム         | 型           | 制約                             | 説明                    |
| -------------- | ------------ | -------------------------------- | ----------------------- |
| id             | UUID         | PK, DEFAULT uuid_generate_v4()   | ステータスID            |
| user_id        | UUID         | FK → users(id), UNIQUE, NOT NULL | ユーザーID (1ユーザー1行) |
| preset_id      | UUID         | FK → presets(id), NULL可         | プリセットID            |
| custom_message | VARCHAR(200) | DEFAULT ''                       | カスタムメッセージ      |
| updated_at     | TIMESTAMPTZ  | DEFAULT NOW()                    | 更新日時                |

#### インデックス

- `idx_room_statuses_user_id` ON room_statuses(user_id)
- `idx_users_username` ON users(username)
- `idx_presets_user_id` ON presets(user_id)

### 5.3 デフォルトプリセットデータ

ユーザー登録時に Go コードからINSERTされる。DBにはテンプレート行を持たない。

| label  | color            | display_order |
| ------ | ---------------- | ------------- |
| 面接中 | #EF4444 (赤)     | 1             |
| 会議中 | #F59E0B (黄)     | 2             |
| 勉強中 | #3B82F6 (青)     | 3             |
| 作業中 | #8B5CF6 (紫)     | 4             |
| 電話中 | #EC4899 (ピンク) | 5             |
| 入室OK | #10B981 (緑)     | 6             |

---

## 6. API 設計

### 6.1 ベースURL

- 開発: `http://localhost:8080`

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

| メソッド | パス                         | 説明                         |
| -------- | ---------------------------- | ---------------------------- |
| GET      | /status/{username}           | ユーザーの公開ステータス取得 |
| GET      | /status/{username}/stream    | SSE リアルタイム配信         |

#### 認証必須 (Authorization: Bearer {JWT})

| メソッド | パス              | 説明                   |
| -------- | ----------------- | ---------------------- |
| POST     | /auth/setup       | 初回ユーザー名設定     |
| GET      | /auth/me          | 自分のプロフィール取得 |
| PATCH    | /auth/me          | プロフィール更新       |
| GET      | /status/me        | 自分のステータス取得   |
| PUT      | /status/me        | ステータス更新         |
| GET      | /presets          | 自分のプリセット一覧   |
| POST     | /presets          | プリセット作成         |
| PATCH    | /presets/{id}     | プリセット更新         |
| DELETE   | /presets/{id}     | プリセット削除         |

---

## 7. 画面構成

| 画面             | パス          | 認証 | 説明                                 |
| ---------------- | ------------- | ---- | ------------------------------------ |
| トップページ     | /             | 不要 | アイコン + サービス説明 + はじめるボタン |
| ログイン         | /login        | 不要 | Google OAuth                         |
| 初回セットアップ | /setup        | 必須 | ユーザー名・表示名の設定             |
| ダッシュボード   | /dashboard    | 必須 | ステータス変更                       |
| 設定             | /settings     | 必須 | プロフィール編集・プリセット管理・ログアウト |
| 公開ステータス   | /{username}   | 不要 | リアルタイムステータス表示 (SSE)     |

### ルートグループ

- `(auth)` — ログイン・セットアップ。未認証ユーザー向け
- `(protected)` — ダッシュボード・設定。`proxy.ts` のミドルウェアで認証ガード

### OGP メタデータ

- **ルートレイアウト**: サイト全体のデフォルトOGP (`title.template: "%s | Knockit"`)
- **公開ステータスページ**: `generateMetadata` でユーザーごとの動的OGP生成

---

## 8. リアルタイム更新 (SSE)

### 仕組み

専用端末（タブレットなど）で公開ページを常時表示し、ステータス変更を即座に反映する。

```
[ダッシュボード]             [Go API]                [公開ページ (タブレット)]
    │                         │                         │
    │ PUT /status/me          │                         │
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

`PublicStatusCard` コンポーネント内で SSE を購読し、リアルタイムでステータスを更新する。

---

## 9. デプロイ構成

| サービス       | プラットフォーム | 備考                                    |
| -------------- | ---------------- | --------------------------------------- |
| バックエンド   | Fly.io           | Docker デプロイ、リージョン nrt (東京)  |
| データベース   | Supabase         | PostgreSQL                              |
| 認証           | Supabase Auth    | Google OAuth                            |
