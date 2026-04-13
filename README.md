# Knockit

自室のステータスを家族にリアルタイム共有するWebアプリケーション。

面接やオンライン会議の最中に家族が部屋に入ってきてしまう問題を解決します。
ステータスを更新すると、専用端末（タブレットなど）で常時表示している画面が即座に切り替わります。

## 機能

- **ステータス管理**: プリセット（面接中・会議中・勉強中など）またはカスタムメッセージでステータスを設定
- **リアルタイム更新**: SSE (Server-Sent Events) によるリアルタイム反映
- **公開ページ**: 認証不要の専用URL (`/username`) を家族と共有
- **OAuth認証**: Google / GitHub アカウントでログイン

## 技術スタック

| レイヤー       | 技術                                                         |
| -------------- | ------------------------------------------------------------ |
| フロントエンド | Next.js (App Router) / TypeScript / shadcn UI / Tailwind CSS |
| バックエンド   | Go 1.22+ 標準ライブラリ (net/http)                           |
| データベース   | PostgreSQL (Supabase)                                        |
| 認証           | Supabase Auth (OAuth)                                        |
| インフラ       | Docker / Vercel / Render                                     |

## プロジェクト構成

```
knockit/
├── backend/           # Go API サーバー
│   ├── cmd/server/    # エントリーポイント
│   ├── internal/      # レイヤードアーキテクチャ (model/repository/service/handler)
│   ├── pkg/           # 共有ユーティリティ
│   ├── migrations/    # SQL マイグレーション
│   └── Dockerfile
├── frontend/          # Next.js アプリ
│   └── src/
└── docs/
    ├── ARCHITECTURE.md          # 設計ドキュメント
    └── IMPLEMENTATION_GUIDE.md  # 実装手順書
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
3. Authentication → Providers で Google / GitHub OAuth を有効化

### 3. バックエンドの起動

```bash
cd backend
cp .env.example .env
# .env を編集して環境変数を設定
docker compose up --build
```

`http://localhost:8080/api/v1/health` でヘルスチェック。

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

| 変数名              | 説明                   | 例                                                    |
| ------------------- | ---------------------- | ----------------------------------------------------- |
| PORT                | APIサーバーのポート    | 8080                                                  |
| DATABASE_URL        | PostgreSQL 接続文字列  | postgresql://postgres:password@localhost:5432/knockit |
| SUPABASE_JWT_SECRET | Supabase の JWT Secret | your-jwt-secret                                       |
| ALLOWED_ORIGINS     | CORS 許可オリジン      | http://localhost:3000                                 |
| ENVIRONMENT         | 実行環境               | development                                           |

### フロントエンド (`frontend/.env.local`)

| 変数名                        | 説明                        | 例                       |
| ----------------------------- | --------------------------- | ------------------------ |
| NEXT_PUBLIC_SUPABASE_URL      | Supabase の Project URL     | https://xxxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase の anon public key | eyJhbGci...              |
| NEXT_PUBLIC_API_URL           | バックエンドの URL          | http://localhost:8080    |

## API エンドポイント

### 認証不要

| メソッド | パス                             | 説明                 |
| -------- | -------------------------------- | -------------------- |
| GET      | /api/v1/health                   | ヘルスチェック       |
| GET      | /api/v1/presets                  | プリセット一覧       |
| GET      | /api/v1/status/{username}        | 公開ステータス取得   |
| GET      | /api/v1/status/{username}/stream | SSE リアルタイム配信 |

### 認証必須

| メソッド | パス                    | 説明                 |
| -------- | ----------------------- | -------------------- |
| POST     | /api/v1/users/me/setup  | 初回セットアップ     |
| GET      | /api/v1/users/me        | プロフィール取得     |
| PUT      | /api/v1/users/me        | プロフィール更新     |
| GET      | /api/v1/users/me/status | 自分のステータス取得 |
| PUT      | /api/v1/users/me/status | ステータス更新       |

## デプロイ

| サービス       | デプロイ先 | プラン       |
| -------------- | ---------- | ------------ |
| フロントエンド | Vercel     | Hobby (無料) |
| バックエンド   | Render     | Free         |
| データベース   | Supabase   | Free         |

詳細な手順は [IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md) の Phase 7 を参照。

## ドキュメント

| ファイル                                                       | 内容                                               |
| -------------------------------------------------------------- | -------------------------------------------------- |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md)                      | 全体設計 (技術スタック, DB設計, API設計, 画面構成) |
| [IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md)      | 段階的な実装手順書 (Phase 0〜7)                    |

## ライセンス

MIT
