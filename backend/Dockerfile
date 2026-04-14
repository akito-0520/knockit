# ビルド用
FROM golang:1.22-alpine AS builder

# ベースイメージを更新
RUN apk update && apk upgrade

# 作業場所
WORKDIR /backend

# 依存関係をコピーしてダウンロード
COPY go.mod go.sum ./
RUN go mod download

# ソースをコピーしてビルド
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .


# 実行用
FROM alpine:3.19

# ベースイメージを更新
RUN apk update && apk upgrade

# 作業場所
WORKDIR /backend

# ビルド環境からバイナリーをコピー
COPY --from=builder /backend/server ./

# ポートを公開
EXPOSE 8080

# 実行ファイルを実行
CMD [ "./server" ]
