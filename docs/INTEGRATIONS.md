# 外部連携（APIキー）

ユーザー向けの手順はアプリ内の `/integrations` ページに掲載している
（`frontend/app/integrations/page.tsx`）。ここでは開発者向けのメモのみ残す。

## 概要

- `POST/GET/DELETE /auth/api-keys`（JWT 必須）でキーを発行・一覧・失効
- `GET`/`PUT /status/me` は JWT または `X-API-Key` ヘッダのどちらでも通る
- `PUT /status/me` の body は `preset_label` / `preset_id` / `custom_message`
  （`preset_label` はそのユーザーのプリセットをラベルで解決。`preset_id` があれば優先）
- 生キーは発行レスポンスのみ。SHA-256 ハッシュを保存。1 ユーザー 10 個上限、
  ラベルはユーザー内 UNIQUE
- レート制限なし・キー編集なし（rename は失効＋再作成）

## セットアップ

`backend/migrations/002_api_keys.sql` を DB に適用する（本番は Supabase SQL Editor、
ローカルは `docker compose exec -T db psql -U admin -d knockit < backend/migrations/002_api_keys.sql`
または `docker compose down -v` で作り直し）。
