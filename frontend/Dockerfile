# ビルド用
FROM node:20-alpine AS builder 

# ベースイメージを更新
RUN apk update && apk upgrade

# 作業環境
WORKDIR /frontend

# 依存関係をコピーしてインストール
COPY package.json package-lock.json ./
RUN npm ci

# ソースをコピーしてビルド
COPY . .
RUN npm run build

# 実行用
FROM node:20-alpine

# ベースイメージを更新
RUN apk update && apk upgrade

# 作業環境
WORKDIR /frontend

# ビルド環境からビルドファイルをコピー
COPY --from=builder /frontend/.next/standalone ./
COPY --from=builder /frontend/.next/static ./.next/static
COPY --from=builder /frontend/public ./public

# ポートを公開
EXPOSE 3000

# 実行ファイルを実行
CMD [ "node", "server.js" ]