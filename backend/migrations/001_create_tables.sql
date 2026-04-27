/* UUID OSSPの有効化（postgreSQLのUUID生成機能） */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* usersテーブルの作成 */
CREATE TABLE users (
    id           UUID         PRIMARY KEY,
    username     VARCHAR(30)  UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

/* presetsテーブルの作成 */
CREATE TABLE presets (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE, /* `ON DELETE CASCADE`を用いることで参照先が削除されたら自身も削除する */
    label         VARCHAR(50) NOT NULL,
    color         VARCHAR(7)  NOT NULL,
    display_order INT         NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* room_statusesテーブルの作成（1ユーザーにつき1行。ステータス更新時はUPDATEで上書き） */
CREATE TABLE room_statuses (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE, /* `ON DELETE CASCADE`を用いることで参照先が削除されたら自身も削除する */
    preset_id      UUID         REFERENCES presets(id) ON DELETE SET NULL,              /* `ON DELETE SET NULL`を用いることで参照先が削除されたらNULLをセットする */
    custom_message VARCHAR(200) DEFAULT '',
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE inquiries (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            REFERENCES users(id) ON DELETE SET NULL, 
    category        VARCHAR(20)     NOT NULL CHECK (category IN ('bug', 'feature', 'other')),
    body            VARCHAR(5000)   NOT NULL,                                                                                                                                                                    
    reply_requested BOOLEAN         NOT NULL DEFAULT FALSE,                                                                                                                                                      
    reply_to        VARCHAR(254),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

/* インデックスを作成することで`WHERE`を用いた際などに索引のようにすぐ見つけることができる */
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_presets_user_id ON presets(user_id);
CREATE INDEX idx_room_statuses_user_id ON room_statuses(user_id);
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);   