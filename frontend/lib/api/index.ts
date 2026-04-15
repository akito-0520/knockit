// サーバーサイド（Docker内）→ backend サービス名
// クライアントサイド（ブラウザ）→ localhost
export const API_URL =
  typeof window === "undefined"
    ? (process.env.API_URL ?? "http://localhost:8080")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080");

export const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const toCamel = (key: string) =>
  key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export const camelize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(camelize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        toCamel(k),
        camelize(v),
      ]),
    );
  }
  return value;
};

export const unwrap = async <T>(res: Response): Promise<T> => {
  const json = await res.json();
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error ?? `HTTP error: ${res.status}`);
  }
  return camelize(json.data) as T;
};
