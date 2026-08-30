# 変更履歴 (Changelog)

このファイルは Knockit のバージョンごとの変更点を記録する。
書式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠し、
バージョニングは [セマンティック バージョニング](https://semver.org/lang/ja/) に従う。

バージョンの実体は `frontend/package.json` の `version`（UI のトップ / 設定画面に
`version x.y.z` として表示される）。

## 運用ルール

- リリース（= `main` へのマージでバージョンを上げる PR）ごとに、`frontend/package.json`
  の `version` を bump し、このファイルの `## [Unreleased]` の内容を新しいバージョン
  見出しに移す。
- 変更は `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security` に分類する。
- バージョンの上げ方: 破壊的変更 = major、後方互換の機能追加 = minor、バグ修正のみ = patch。

## [Unreleased]

## [1.1.0] - 2026-08-30

### Added

- 公開ステータス API (`StatusResponse`) に `updatedAt` を追加。公開ページ
  (`/{username}` / `/embed/{username}`) に「最終更新: 3分前」形式の相対時刻を表示する
  （SSE 更新時も反映）。(#42)
- フロントエンドに Storybook + Vitest のテスト基盤を追加。

### Changed

- `frontend/package.json` の `latest` 指定の依存（`@storybook/addon-mcp` ほか）を
  具体バージョンに固定。
- 多数の依存パッケージを更新（Next.js 16.3 系ほか）。

### Removed

- フロントエンドの Docker 構成（`frontend/Dockerfile`、`docker-compose.yml` の
  frontend サービス定義）を削除。デプロイは Vercel に一本化。
- 未使用の `shadcn` パッケージ依存を削除（利用していた CSS のみローカルに取り込み）。

## [1.0.1] - 2026-05-12

### Added

- 利用規約ページ (`/terms`) と、ログインページからのリンク。
- お問い合わせ機能（フロントの問い合わせページ + バックエンドの登録ロジック）。

### Changed

- Fly.io / Docker まわりの設定を調整（マシン自動停止設定、サーバーのメモリ設定など）。

## [1.0.0] - 2026-04-27

初回リリース。

### Added

- Google OAuth（Supabase Auth）によるログインと初回セットアップ (`/setup`)。
- ステータス更新（ダッシュボード）と、認証不要の公開ページ (`/{username}`)。
- SSE (Server-Sent Events) によるステータスのリアルタイム反映。
- iframe 埋め込み用ページ (`/embed/{username}`)。
- プリセット管理（作成・更新・削除、上限/下限あり）。
- 公開ページの動的 OGP メタデータ生成。
- バックエンドの定期ヘルスチェック、フロント/バックの CI・CD 設定。
- アプリバージョンの UI 表示（トップ / 設定画面）。

## [0.1.0] - 2026-04-14

### Added

- プロジェクト初期構築（Next.js フロントエンド / Go バックエンド / `docker-compose` による開発環境）。
