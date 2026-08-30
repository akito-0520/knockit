type APIKeyResponse = {
  id: string;
  label: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

// 発行時のみ返る。last_used_at は含まれない。
type CreatedAPIKeyResponse = {
  id: string;
  label: string;
  key: string;
  keyPrefix: string;
  createdAt: string;
};

type CreateAPIKeyRequest = {
  label: string;
};

export type { APIKeyResponse, CreatedAPIKeyResponse, CreateAPIKeyRequest };
