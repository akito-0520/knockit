package model

import "time"

type APIKey struct {
	ID         string
	UserID     string
	Label      string
	KeyHash    string
	KeyPrefix  string
	LastUsedAt *time.Time
	CreatedAt  time.Time
}

type CreateAPIKeyRequest struct {
	Label string `json:"label"`
}

// CreatedAPIKeyResponse は発行時のみ生キーを含んで返すレスポンス。
type CreatedAPIKeyResponse struct {
	ID        string    `json:"id"`
	Label     string    `json:"label"`
	Key       string    `json:"key"`
	KeyPrefix string    `json:"key_prefix"`
	CreatedAt time.Time `json:"created_at"`
}

// APIKeyResponse は一覧用。生キーもハッシュも含まない。
type APIKeyResponse struct {
	ID         string     `json:"id"`
	Label      string     `json:"label"`
	KeyPrefix  string     `json:"key_prefix"`
	LastUsedAt *time.Time `json:"last_used_at"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (k *APIKey) ToResponse() APIKeyResponse {
	return APIKeyResponse{
		ID:         k.ID,
		Label:      k.Label,
		KeyPrefix:  k.KeyPrefix,
		LastUsedAt: k.LastUsedAt,
		CreatedAt:  k.CreatedAt,
	}
}
