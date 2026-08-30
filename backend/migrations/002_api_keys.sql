/* api_keysテーブルの作成（外部システムからのステータス更新用APIキー） */
CREATE TABLE api_keys (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE, /* 参照先が削除されたら自身も削除 */
    label        VARCHAR(50) NOT NULL,
    key_hash     VARCHAR(64) UNIQUE NOT NULL,                                 /* 生キーの SHA-256（hex） */
    key_prefix   VARCHAR(16) NOT NULL,                                        /* "knk_xxxxxxxx"（一覧表示用） */
    last_used_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, label)                                                   /* 1ユーザー内でラベル重複を禁止 */
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
