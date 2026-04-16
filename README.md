# Knockit

家族にあなたの今を、そっと伝える。

面接やオンライン会議の最中に家族が部屋に入ってきてしまう問題を解決するWebアプリケーションです。
ステータスを更新すると、専用端末（タブレットなど）で常時表示している画面が即座に切り替わります。

## 機能

- **ステータス管理**: プリセット（面接中・会議中・勉強中など）またはカスタムメッセージでステータスを設定
- **リアルタイム更新**: SSE (Server-Sent Events) によるリアルタイム反映
- **公開ページ**: 認証不要の専用URL (`/username`) を家族と共有
- **OAuth認証**: Google アカウントでログイン
- **OGP対応**: 公開ページごとに動的なメタデータを生成

## 技術スタック

| レイヤー       | 技術                                                         |
| -------------- | ------------------------------------------------------------ |
| フロントエンド | Next.js 16 (App Router) / TypeScript / shadcn UI / Tailwind CSS v4 |
| バックエンド   | Go 1.22+ 標準ライブラリ (net/http)                           |
| データベース   | PostgreSQL (Supabase)                                        |
| 認証           | Supabase Auth (Google OAuth)                                 |
| インフラ       | Docker / Fly.io (バックエンド)                               |

## プロジェクト構成

```
knockit/
├── backend/              # Go API サーバー
│   ├── main.go           # エントリーポイント (DI・ルーティング・サーバー起動)
│   ├── internal/         # レイヤードアーキテクチャ
│   │   ├── config/       # 環境変数管理
│   │   ├── model/        # ドメインモデル
│   │   ├── repository/   # データアクセス層
│   │   ├── service/      # ビジネスロジック層
│   │   ├── handler/      # HTTPハンドラー
│   │   ├── middleware/    # 認証・CORS
│   │   └── validator/    # バリデーション
│   ├── pkg/response/     # HTTPレスポンスヘルパー
│   ├── migrations/       # SQL マイグレーション
│   ├── fly.toml          # Fly.io デプロイ設定
│   └── Dockerfile
├── frontend/             # Next.js アプリ
│   ├── app/              # App Router
│   │   ├── (auth)/       # 認証関連 (login, setup)
│   │   ├── (protected)/  # 認証必須 (dashboard, settings)
│   │   ├── [username]/   # 公開ステータスページ
│   │   └── auth/callback/# OAuth コールバック
│   ├── components/       # UIコンポーネント
│   ├── lib/              # API・Supabase・ユーティリティ
│   ├── types/            # TypeScript 型定義
│   └── Dockerfile
├── docker-compose.yml    # 開発用 (API + PostgreSQL)
└── docs/
    ├── ARCHITECTURE.md   # 設計ドキュメント
    └── IMPLEMENTATION_GUIDE.md
```

## 開発環境のセットアップ

### 必要なツール

- Go 1.22+
- Node.js 20+
- Docker / Docker Compose

### 1. リポジトリのクローン

```bash
git clone https://github.com/akito-0520/knockit.git
cd knockit
```

### 2. Supabase の準備

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. SQL Editor で `backend/migrations/001_create_tables.sql` を実行
3. Authentication → Providers で Google OAuth を有効化

### 3. バックエンドの起動

```bash
cp backend/.env.example backend/.env
# backend/.env を編集して環境変数を設定
docker compose up --build
```

`http://localhost:8080` でAPIが起動。

### 4. フロントエンドの起動

```bash
cd frontend
cp .env.example .env.local
# .env.local を編集して環境変数を設定
npm install
npm run dev
```

`http://localhost:3000` でアクセス。

## 環境変数

### バックエンド (`backend/.env`)

| 変数名              | 説明                      | 例                                                    |
| ------------------- | ------------------------- | ----------------------------------------------------- |
| PORT                | APIサーバーのポート       | 8080                                                  |
| DATABASE_URL        | PostgreSQL 接続文字列     | postgresql://admin:admin@localhost:5432/knockit        |
| SUPABASE_URL        | Supabase の Project URL   | https://xxxx.supabase.co                              |
| SUPABASE_JWT_SECRET | Supabase の JWT Secret    | your-jwt-secret                                       |
| ALLOWED_ORIGINS     | CORS 許可オリジン         | http://localhost:3000                                 |

### フロントエンド (`frontend/.env.local`)

| 変数名                        | 説明                        | 例                       |
| ----------------------------- | --------------------------- | ------------------------ |
| NEXT_PUBLIC_SUPABASE_URL      | Supabase の Project URL     | https://xxxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase の anon public key | eyJhbGci...              |
| NEXT_PUBLIC_API_URL           | バックエンドの URL          | http://localhost:8080    |
| NEXT_PUBLIC_SITE_URL          | フロントエンドの URL        | http://localhost:3000    |

## API エンドポイント

### 認証不要

| メソッド | パス                         | 説明                 |
| -------- | ---------------------------- | -------------------- |
| GET      | /status/{username}           | 公開ステータス取得   |
| GET      | /status/{username}/stream    | SSE リアルタイム配信 |

### 認証必須

| メソッド | パス              | 説明                 |
| -------- | ----------------- | -------------------- |
| POST     | /auth/setup       | 初回セットアップ     |
| GET      | /auth/me          | プロフィール取得     |
| PATCH    | /auth/me          | プロフィール更新     |
| GET      | /status/me        | 自分のステータス取得 |
| PUT      | /status/me        | ステータス更新       |
| GET      | /presets          | プリセット一覧       |
| POST     | /presets          | プリセット作成       |
| PATCH    | /presets/{id}     | プリセット更新       |
| DELETE   | /presets/{id}     | プリセット削除       |

## デプロイ

| サービス       | デプロイ先      | 備考                |
| -------------- | --------------- | ------------------- |
| バックエンド   | Fly.io          | リージョン: nrt     |
| データベース   | Supabase        | PostgreSQL          |

## 画面構成

| 画面             | パス          | 認証 | 説明                                 |
| ---------------- | ------------- | ---- | ------------------------------------ |
| トップページ     | /             | 不要 | サービス説明 + はじめるボタン        |
| ログイン         | /login        | 不要 | Google OAuth                         |
| 初回セットアップ | /setup        | 必須 | ユーザー名・表示名の設定             |
| ダッシュボード   | /dashboard    | 必須 | ステータス変更                       |
| 設定             | /settings     | 必須 | プロフィール編集・プリセット管理     |
| 公開ステータス   | /{username}   | 不要 | リアルタイムステータス表示 (SSE)     |

## ドキュメント

| ファイル                                                  | 内容                                               |
| --------------------------------------------------------- | -------------------------------------------------- |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md)                 | 全体設計 (技術スタック, DB設計, API設計, 画面構成)  |
| [IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md) | 段階的な実装手順書 (Phase 0〜7)                    |

## ライセンス

MIT
