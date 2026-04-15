export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// 認証ヘッダーを共通化するヘルパー関数
export const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// バックエンドの {success, data, error} ラッパを剥がして data のみを返す
export const unwrap = async <T>(res: Response): Promise<T> => {
  const json = await res.json();
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error ?? `HTTP error: ${res.status}`);
  }
  return json.data as T;
};
