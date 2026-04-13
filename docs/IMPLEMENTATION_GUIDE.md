# Knockit - 実装手順書

各 Phase を順番に進め、動作確認ポイントをクリアしてから次に進んでください。
Go の学習ポイントも各所に記載しています。

---

## Phase 0: 環境準備

### 0-1. ツールのインストール

- Go 1.22+ — https://go.dev/dl/
- Node.js 20+ — https://nodejs.org/
- Docker Desktop — https://www.docker.com/products/docker-desktop/
- Git — https://git-scm.com/

### 0-2. Supabase プロジェクトの作成

1. https://supabase.com でプロジェクトを作成
2. 以下の情報を控えておく (後で環境変数に設定):
   - **Settings → API → Project URL** (例: `https://xxxx.supabase.co`)
   - **Settings → API → anon public key** (フロントエンドで使用)
   - **Settings → API → JWT Secret** (バックエンドで使用)
3. **Authentication → Providers** で OAuth を有効化:
   - **Google**: Google Cloud Console で OAuth Client ID を発行し設定
   - **GitHub**: GitHub Developer Settings で OAuth App を作成し設定

### 0-3. リポジトリ初期化

```bash
mkdir knockit && cd knockit
git init
```

### 動作確認

- [ ] `go version` で 1.22 以上が表示される
- [ ] `node -v` で 20 以上が表示される
- [ ] `docker --version` が表示される
- [ ] Supabase の Project URL, anon key, JWT Secret を控えた

---

## Phase 1: バックエンド基盤 (DB接続なし)

この Phase では DB に接続せず、Go プロジェクトの骨格を作る。
各ステップで `go build ./...` が通ることを確認する。

### 1-1. Go プロジェクト初期化

```bash
mkdir -p backend && cd backend
go mod init github.com/<your-username>/knockit
go get github.com/golang-jwt/jwt/v5 github.com/google/uuid github.com/lib/pq
```

| パッケージ        | 用途                |
| ----------------- | ------------------- |
| golang-jwt/jwt/v5 | Supabase JWT の検証 |
| google/uuid       | UUID の生成         |
| lib/pq            | PostgreSQL ドライバ |

### 1-2. ディレクトリ構成の作成

```bash
mkdir -p cmd/server
mkdir -p internal/{model,repository,service,handler,middleware,validator,config}
mkdir -p pkg/response
mkdir -p migrations
```

### 1-3. モデル層の実装

`internal/model/` に 4 ファイルを作成する。

#### user.go

```go
type User struct {
    ID          string    `json:"id"`          // Supabase Auth の UUID
    Username    string    `json:"username"`    // 公開URL用 (例: "akito")
    DisplayName string    `json:"display_name"`// 表示名
    AvatarURL   string    `json:"avatar_url"`  // プロフィール画像
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

作成する型:

- `User` — エンティティ
- `UserSetupRequest` — 初回セットアップ用リクエスト (Username, DisplayName)
- `UserUpdateRequest` — プロフィール更新用リクエスト (DisplayName)
- `UserResponse` — APIレスポンス用 (内部情報を除外)
- `ToResponse()` メソッド — User → UserResponse 変換

#### status.go

作成する型:

- `RoomStatus` — エンティティ (PresetID は `*string` で NULL 許容)
- `StatusUpdateRequest` — ステータス更新用リクエスト
- `StatusResponse` — ユーザー情報 + プリセット情報を含むレスポンス

#### preset.go

作成する型:

- `Preset` — エンティティ (Label, Emoji, Color, DisplayOrder)
- `PresetResponse` + `ToResponse()` メソッド

#### errors.go

作成するもの:

- `ErrNotFound`, `ErrAlreadyExists`, `ErrUnauthorized`, `ErrForbidden`, `ErrValidation`, `ErrInternal`
- `ValidationError` 構造体 (Field + Message)

> **Go 学習ポイント**
>
> - `*string` (ポインタ型) で NULL 許容フィールドを表現する
> - レスポンス用構造体を分けて内部情報の漏洩を防ぐ
> - `json:"field_name"` タグで JSON キー名を制御する
> - `errors.New()` でセンチネルエラーを定義し、`errors.Is()` で比較する

### 1-4. config の実装

`internal/config/config.go` を作成する。

```go
type Config struct {
    Port              int
    DatabaseURL       string
    SupabaseJWTSecret string
    AllowedOrigins    []string
    Environment       string  // "development" or "production"
}
```

- `Load()` 関数で `os.Getenv()` から読み込み
- `PORT` はデフォルト 8080、未設定なら `strconv.Atoi()` で変換
- `DATABASE_URL`, `SUPABASE_JWT_SECRET` は必須 → 未設定ならエラー
- `ALLOWED_ORIGINS` はカンマ区切り → 分割して `[]string` に

> **Go 学習ポイント**
>
> - `os.Getenv()` は未設定なら空文字列を返す (エラーにならない)
> - `strconv.Atoi()` の戻り値は `(int, error)` — Go の多値返却
> - 標準ライブラリだけで文字列分割を実装してみる (`strings.Split` も可)

### 1-5. バリデーターの実装

`internal/validator/validator.go` を作成する。

実装する関数:

- `ValidateUserSetup(req)` — Username (3〜30文字, `^[a-z0-9][a-z0-9-]*[a-z0-9]$`), DisplayName (1〜100文字)
- `ValidateUserUpdate(req)` — DisplayName (1〜100文字)
- `ValidateStatusUpdate(req)` — PresetID (UUID形式), CustomMessage (最大200文字), いずれか必須
- `ValidateUsername(username)` — パスパラメータ用
- `IsValidUUID(s)`, `IsValidColor(s)` — ヘルパー

> **Go 学習ポイント**
>
> - `regexp.MustCompile()` はパッケージレベル変数で1度だけコンパイルする
> - `len()` はバイト数、`utf8.RuneCountInString()` は文字数 — 日本語入力では後者が必須
> - バリデーション関数は `[]ValidationError` を返し、空なら OK

### 1-6. レスポンスヘルパーの実装

`pkg/response/response.go` を作成する。

実装する関数:

- `JSON(w, status, data)` — `{ "success": true, "data": ... }`
- `Error(w, status, message)` — `{ "success": false, "error": "..." }`
- `ValidationErrors(w, errs)` — 400 + `details` 配列
- `NoContent(w)` — 204

共通処理:

- `w.Header().Set("Content-Type", "application/json; charset=utf-8")` を必ず設定
- `json.NewEncoder(w).Encode()` でレスポンスを書き出す

### Phase 1 の動作確認

- [ ] `go build ./...` がエラーなく通る
- [ ] すべてのパッケージに適切な package 宣言がある

---

## Phase 2: データアクセス層

### 2-1. DBマイグレーション SQL の作成

`migrations/001_create_tables.sql` を作成する。

含める内容:

- `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- `CREATE TABLE users` — id (UUID PK), username (UNIQUE), display_name, avatar_url, created_at, updated_at
- `CREATE TABLE presets` — id (UUID PK DEFAULT uuid_generate_v4()), label, emoji, color, display_order
- `CREATE TABLE room_statuses` — id, user_id (FK), preset_id (FK, NULL可), custom_message, is_active, updated_at
- インデックス: `idx_room_statuses_user_active`, `idx_users_username`
- 初期プリセットデータ INSERT (面接中, 会議中, 勉強中, 作業中, 電話中, 入室OK)

Supabase の **SQL Editor** でこの SQL を実行してテーブルを作成する。

> **Go 学習ポイント**
>
> - ON DELETE CASCADE vs ON DELETE SET NULL の違いを理解する
> - インデックスはよく WHERE に使うカラムに作成する

### 2-2. リポジトリ層の実装

すべてのリポジトリは `*sql.DB` を受け取るコンストラクタパターンで作成する。

#### user_repository.go

| メソッド                          | SQL                                | エラーハンドリング                         |
| --------------------------------- | ---------------------------------- | ------------------------------------------ |
| `FindByID(ctx, id)`               | SELECT ... WHERE id = $1           | `sql.ErrNoRows` → `ErrNotFound`            |
| `FindByUsername(ctx, username)`   | SELECT ... WHERE username = $1     | 同上                                       |
| `ExistsByUsername(ctx, username)` | SELECT EXISTS(...)                 | bool 返却                                  |
| `Create(ctx, user)`               | INSERT INTO users ...              | time.Now() で created_at/updated_at を設定 |
| `Update(ctx, user)`               | UPDATE users SET ... WHERE id = $3 | RowsAffected() == 0 → `ErrNotFound`        |

#### status_repository.go

| メソッド                          | 説明                                                          |
| --------------------------------- | ------------------------------------------------------------- |
| `FindActiveByUserID(ctx, userID)` | WHERE is_active = true LIMIT 1                                |
| `Upsert(ctx, status)`             | **トランザクション**: 旧ステータスを非アクティブ → 新規INSERT |
| `DeactivateAll(ctx, userID)`      | 全アクティブステータスをリセット                              |

`Upsert` のトランザクション手順:

```go
tx, err := db.BeginTx(ctx, nil)
defer func() { if err != nil { tx.Rollback() } }()

// 1. UPDATE room_statuses SET is_active = false WHERE user_id = $1 AND is_active = true
// 2. INSERT INTO room_statuses (...) VALUES (...)
// 3. tx.Commit()
```

#### preset_repository.go

| メソッド            | SQL                                   |
| ------------------- | ------------------------------------- |
| `FindAll(ctx)`      | SELECT ... ORDER BY display_order ASC |
| `FindByID(ctx, id)` | SELECT ... WHERE id = $1              |

> **Go 学習ポイント**
>
> - `context.Context` を全メソッドに渡してタイムアウト/キャンセルに対応する
> - `defer rows.Close()` でリソースリークを防止する
> - `rows.Next()` ループ後に `rows.Err()` を必ずチェックする
> - `sql.ErrNoRows` はエラーでなく「結果なし」— `ErrNotFound` に変換して返す
> - トランザクション内のエラーは `defer` で自動ロールバックするパターンが一般的

### Phase 2 の動作確認

- [ ] `go build ./...` がエラーなく通る
- [ ] Supabase SQL Editor でテーブルが作成されている
- [ ] Supabase の Table Editor でプリセットデータが 6 件入っている

---

## Phase 3: ビジネスロジック層

### 3-1. AuthService の実装

`internal/service/auth_service.go`:

| メソッド                                         | ロジック                                               |
| ------------------------------------------------ | ------------------------------------------------------ |
| `SetupUser(ctx, supabaseUserID, req, avatarURL)` | ユーザー存在チェック → ユーザー名重複チェック → Create |
| `GetCurrentUser(ctx, userID)`                    | FindByID のラッパー                                    |
| `UpdateUser(ctx, userID, req)`                   | FindByID → フィールド更新 → Update                     |

### 3-2. StatusService の実装 (SSE対応)

`internal/service/status_service.go`:

SSE クライアント管理の構造:

```go
type SSEClient struct {
    UserID  string
    Channel chan *model.StatusResponse  // バッファ付き (例: 10)
}

type StatusService struct {
    statusRepo *repository.StatusRepository
    presetRepo *repository.PresetRepository
    userRepo   *repository.UserRepository
    mu         sync.RWMutex    // クライアントリストの並行アクセス保護
    clients    []*SSEClient
}
```

| メソッド                             | 説明                                                              |
| ------------------------------------ | ----------------------------------------------------------------- |
| `GetStatusByUsername(ctx, username)` | ユーザー名 → FindByUsername → FindActiveByUserID → レスポンス構築 |
| `GetMyStatus(ctx, userID)`           | 自分のステータス取得                                              |
| `UpdateStatus(ctx, userID, req)`     | プリセット存在確認 → Upsert → **SSE通知**                         |
| `Subscribe(userID)`                  | クライアント登録、`chan` 返却                                     |
| `Unsubscribe(client)`                | クライアント削除、`close(channel)`                                |
| `notifyClients(userID, status)`      | 該当ユーザー購読中の全クライアントにノンブロッキング送信          |

`notifyClients` のノンブロッキング送信パターン:

```go
select {
case client.Channel <- status:
    // 送信成功
default:
    // バッファ満杯 → ドロップ (クライアントの処理が追いついていない)
}
```

> **Go 学習ポイント (並行処理の核心)**
>
> - `chan` — goroutine 間でデータを安全に受け渡すチャネル
> - `make(chan *T, 10)` — バッファ付きチャネル (10件まで溜められる)
> - `sync.RWMutex` — 読み取り (RLock) は同時に複数OK、書き込み (Lock) は排他
> - `select` + `default` — ノンブロッキング送信パターン
> - `close(ch)` — チャネルをクローズすると、受信側は即座にゼロ値を受け取る

### 3-3. PresetService の実装

`internal/service/preset_service.go`:

- `GetAllPresets(ctx)` — FindAll → 各要素を `ToResponse()` で変換

### Phase 3 の動作確認

- [ ] `go build ./...` がエラーなく通る

---

## Phase 4: HTTP層 (ミドルウェア・ハンドラー・ルーティング)

### 4-1. ミドルウェアの実装

#### auth.go — JWT検証

処理フロー:

1. `Authorization: Bearer <token>` ヘッダーからトークン取得
2. `jwt.Parse()` で検証 (署名アルゴリズム: HS256, キー: Supabase JWT Secret)
3. `claims["sub"]` からユーザーID取得
4. `claims["user_metadata"]["avatar_url"]` からアバターURL取得
5. `context.WithValue()` でコンテキストに格納
6. `next.ServeHTTP(w, r.WithContext(ctx))` で次のハンドラーに渡す

コンテキストキーの定義:

```go
type contextKey string
const UserIDKey contextKey = "user_id"
```

> **Go 学習ポイント**
>
> - `type contextKey string` — カスタム型でコンテキストキーの衝突を防止
> - `context.WithValue()` はイミュータブル — 新しいコンテキストを返す

#### cors.go — CORS設定

- 許可オリジンを `map[string]bool` で管理
- Origin ヘッダーと照合し、一致すれば `Access-Control-Allow-*` ヘッダーを設定
- OPTIONS (プリフライト) は 204 を返す

#### logging.go — リクエストログ

- `http.ResponseWriter` をラップしてステータスコードを記録
- `time.Since(start)` で処理時間を計測
- `log.Printf("[%s] %s → %d (%s)", method, path, statusCode, duration)`

### 4-2. ハンドラー層の実装

各ハンドラーの処理パターン (統一):

1. HTTPメソッドチェック
2. コンテキストからユーザーID取得 (認証必須エンドポイントの場合)
3. リクエストボディのデコード (`json.NewDecoder(r.Body).Decode(&req)`)
4. バリデーション呼び出し
5. サービス呼び出し
6. エラーハンドリング (`errors.Is()` でカスタムエラーを判定 → 適切なHTTPステータス)
7. レスポンス返却

#### auth_handler.go

- `Setup` — POST /api/v1/users/me/setup
- `GetMe` — GET /api/v1/users/me
- `UpdateMe` — PUT /api/v1/users/me

#### status_handler.go

- `GetPublicStatus` — GET /api/v1/status/{username}
- `GetMyStatus` — GET /api/v1/users/me/status
- `UpdateMyStatus` — PUT /api/v1/users/me/status
- `SSE` — GET /api/v1/status/{username}/stream

SSE ハンドラーの実装ポイント:

```go
// 1. SSEヘッダー設定
w.Header().Set("Content-Type", "text/event-stream")
w.Header().Set("Cache-Control", "no-cache")
w.Header().Set("Connection", "keep-alive")

// 2. Flusher 取得
flusher, ok := w.(http.Flusher)

// 3. クライアント登録
client := statusService.Subscribe(userID)
defer statusService.Unsubscribe(client)

// 4. 初回ステータス送信
fmt.Fprintf(w, "event: status\ndata: %s\n\n", jsonData)
flusher.Flush()

// 5. イベントループ
for {
    select {
    case <-r.Context().Done():
        return  // クライアント切断
    case status := <-client.Channel:
        fmt.Fprintf(w, "event: status\ndata: %s\n\n", data)
        flusher.Flush()
    }
}
```

#### preset_handler.go

- `GetAll` — GET /api/v1/presets
- `Health` — GET /api/v1/health (ヘルスチェック)

### URLパスからのパラメータ取得

Go 1.22 の `http.NewServeMux` はパスパラメータを直接サポートしないため、
ヘルパー関数で手動抽出する:

```go
// "/api/v1/status/akito" → "akito"
func extractPathParam(path, prefix string) string {
    trimmed := strings.TrimPrefix(path, prefix)
    if idx := strings.Index(trimmed, "/"); idx != -1 {
        trimmed = trimmed[:idx]
    }
    return trimmed
}
```

### 4-3. main.go (エントリーポイント)

`cmd/server/main.go` での組み立て順序:

```go
func main() {
    // 1. Config 読み込み
    cfg, err := config.Load()

    // 2. DB接続
    db, err := sql.Open("postgres", cfg.DatabaseURL)
    db.Ping()

    // 3. リポジトリ初期化
    userRepo := repository.NewUserRepository(db)
    statusRepo := repository.NewStatusRepository(db)
    presetRepo := repository.NewPresetRepository(db)

    // 4. サービス初期化
    authService := service.NewAuthService(userRepo)
    statusService := service.NewStatusService(statusRepo, presetRepo, userRepo)
    presetService := service.NewPresetService(presetRepo)

    // 5. ハンドラー初期化
    authHandler := handler.NewAuthHandler(authService)
    statusHandler := handler.NewStatusHandler(statusService)
    presetHandler := handler.NewPresetHandler(presetService)

    // 6. ミドルウェア初期化
    authMW := middleware.NewAuthMiddleware(cfg.SupabaseJWTSecret)
    corsMW := middleware.NewCORSMiddleware(cfg.AllowedOrigins)

    // 7. ルーティング
    mux := http.NewServeMux()

    // 認証不要
    mux.HandleFunc("/api/v1/health", handler.Health)
    mux.HandleFunc("/api/v1/presets", presetHandler.GetAll)
    mux.HandleFunc("/api/v1/status/", func(w http.ResponseWriter, r *http.Request) {
        // /stream で終わるなら SSE、そうでなければ公開ステータス
        if strings.HasSuffix(r.URL.Path, "/stream") {
            statusHandler.SSE(w, r)
        } else {
            statusHandler.GetPublicStatus(w, r)
        }
    })

    // 認証必須
    mux.Handle("/api/v1/users/me/setup",
        authMW.Authenticate(http.HandlerFunc(authHandler.Setup)))
    mux.Handle("/api/v1/users/me/status",
        authMW.Authenticate(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            switch r.Method {
            case http.MethodGet:
                statusHandler.GetMyStatus(w, r)
            case http.MethodPut:
                statusHandler.UpdateMyStatus(w, r)
            default:
                response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
            }
        })))
    mux.Handle("/api/v1/users/me",
        authMW.Authenticate(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            switch r.Method {
            case http.MethodGet:
                authHandler.GetMe(w, r)
            case http.MethodPut:
                authHandler.UpdateMe(w, r)
            default:
                response.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
            }
        })))

    // 8. サーバー起動
    handler := middleware.LoggingMiddleware(corsMW.Handle(mux))
    server := &http.Server{
        Addr:    fmt.Sprintf(":%d", cfg.Port),
        Handler: handler,
    }
    log.Printf("Server starting on port %d", cfg.Port)
    log.Fatal(server.ListenAndServe())
}
```

> **注意**: `/api/v1/users/me/status` と `/api/v1/users/me` は、`/api/v1/users/me` が先にマッチしないよう、**長いパスを先に登録** する。

### Phase 4 の動作確認

```bash
# 環境変数を設定して起動
export DATABASE_URL="postgresql://postgres:password@localhost:5432/knockit?sslmode=disable"
export SUPABASE_JWT_SECRET="your-jwt-secret"
go run ./cmd/server/

# ヘルスチェック
curl http://localhost:8080/api/v1/health
# → {"success":true,"data":{"status":"ok","service":"knockit-api"}}

# プリセット取得
curl http://localhost:8080/api/v1/presets
# → {"success":true,"data":[{"id":"...","label":"面接中",...}, ...]}
```

- [ ] ヘルスチェックが 200 を返す
- [ ] プリセット一覧が 6 件返る
- [ ] 存在しないユーザーのステータス取得が 404 を返す

---

## Phase 5: Docker 環境

### 5-1. Dockerfile (マルチステージビルド)

```dockerfile
# === ビルドステージ ===
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download          # 依存だけ先にダウンロード (キャッシュ活用)
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# === 実行ステージ ===
FROM alpine:3.19
RUN apk --no-cache add ca-certificates
COPY --from=builder /server /server
EXPOSE 8080
CMD ["/server"]
```

### 5-2. docker-compose.yml (開発用)

```yaml
services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - DATABASE_URL=postgresql://postgres:password@db:5432/knockit?sslmode=disable
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
      - ALLOWED_ORIGINS=http://localhost:3000
      - ENVIRONMENT=development
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: knockit
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### 5-3. .env.example

```
PORT=8080
DATABASE_URL=postgresql://postgres:password@localhost:5432/knockit?sslmode=disable
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
ALLOWED_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

### Phase 5 の動作確認

```bash
docker compose up --build
curl http://localhost:8080/api/v1/health
```

- [ ] `docker compose up --build` でエラーなく起動する
- [ ] API ヘルスチェックが通る
- [ ] ローカル PostgreSQL にテーブルが作成されている

---

## Phase 6: フロントエンド (Next.js)

### 6-1. プロジェクト初期化

```bash
cd knockit
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
cd frontend
npx shadcn@latest init
npx shadcn@latest add button card input label badge avatar separator
npm install @supabase/supabase-js @supabase/ssr
```

### 6-2. 型定義 + ライブラリ設定

**src/types/index.ts** — バックエンドのモデルと一致する型:

- `User`, `Preset`, `StatusResponse`, `ApiResponse<T>`, `ApiErrorResponse`

**src/lib/supabase.ts** — Supabase ブラウザクライアント:

- `createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)`

**src/lib/api.ts** — バックエンド API 呼び出し:

- `fetchWithAuth(url, options)` — Supabase セッションのアクセストークンを Authorization ヘッダーに付与
- `getPresets()`, `getPublicStatus(username)`, `updateStatus(req)` など

### 6-3. 認証 (Supabase Auth + OAuth)

**src/hooks/useAuth.ts**:

- `signInWithGoogle()` — `supabase.auth.signInWithOAuth({ provider: 'google' })`
- `signInWithGitHub()` — 同様
- `signOut()` — `supabase.auth.signOut()`
- `onAuthStateChange()` でセッション変化を監視

**src/app/auth/callback/route.ts**:

- OAuth コールバック処理 (code → session 交換)

**src/components/auth/AuthGuard.tsx**:

- 未ログインなら `/login` にリダイレクトするラッパー

### 6-4. 管理画面 (ステータス更新)

**src/app/dashboard/page.tsx** (AuthGuard で保護):

- 現在のステータスを `StatusCard` で表示
- プリセット選択 (`StatusSelector` — 6つのボタンをグリッド表示)
- カスタムメッセージ入力 (`CustomStatusInput`)
- 更新ボタンで PUT /api/v1/users/me/status
- 公開URL (`/{username}`) の共有リンク表示

### 6-5. 公開ステータスページ (SSE リアルタイム更新)

**src/app/[username]/page.tsx** (認証不要):

- 大きなステータスカードで現在の状態を表示
- 絵文字 + ラベル + カスタムメッセージ + 更新時刻

**src/hooks/useStatusStream.ts** — SSE 購読:

```typescript
const eventSource = new EventSource(
  `${API_URL}/api/v1/status/${username}/stream`,
);
eventSource.addEventListener("status", (e) => {
  setStatus(JSON.parse(e.data));
});
// エラー時は再接続ロジックを入れる
```

### Phase 6 の動作確認

- [ ] `npm run dev` でフロントが起動する
- [ ] OAuth ログイン (Google or GitHub) が成功する
- [ ] 初回セットアップでユーザー名が設定できる
- [ ] 管理画面でプリセット一覧が表示される
- [ ] ステータス更新が成功する
- [ ] 公開ページ (`/username`) でステータスが表示される
- [ ] 管理画面でステータスを変更 → 公開ページがリアルタイムで更新される

---

## Phase 7: デプロイ

### 7-1. バックエンド → Render

1. https://render.com でアカウント作成
2. New → Web Service → GitHub リポジトリを接続
3. 設定:
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Instance Type**: Free
4. 環境変数:
   - `DATABASE_URL` — Supabase の接続文字列 (Settings → Database → Connection string → URI)
   - `SUPABASE_JWT_SECRET` — Supabase の JWT Secret
   - `ALLOWED_ORIGINS` — Vercel のドメイン (例: `https://knockit.vercel.app`)
   - `ENVIRONMENT` — `production`

### 7-2. フロントエンド → Vercel

1. https://vercel.com で GitHub リポジトリを接続
2. 設定:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
3. 環境変数:
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase の Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase の anon public key
   - `NEXT_PUBLIC_API_URL` — Render の URL (例: `https://knockit-api.onrender.com`)

### 7-3. Supabase Auth のリダイレクト設定

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://knockit.vercel.app`
- **Redirect URLs**: `https://knockit.vercel.app/auth/callback`

### Phase 7 の動作確認

- [ ] Render でバックエンドが起動し、ヘルスチェックが通る
- [ ] Vercel でフロントエンドがデプロイされている
- [ ] 本番環境で OAuth ログインが成功する
- [ ] ステータス更新 → 公開ページリアルタイム更新が動作する
