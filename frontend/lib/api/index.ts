export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// 認証ヘッダーを共通化するヘルパー関数
export const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});
