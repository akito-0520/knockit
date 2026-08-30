package repository

import (
	"context"
	"database/sql"
	"log"

	"github.com/akito-0520/knockit/internal/model"
)

type APIKeyRepository struct {
	db *sql.DB
}

func NewAPIKeyRepository(db *sql.DB) *APIKeyRepository {
	return &APIKeyRepository{db: db}
}

const apiKeyColumns = "id, user_id, label, key_hash, key_prefix, last_used_at, created_at"

func scanAPIKey(row interface{ Scan(...any) error }) (*model.APIKey, error) {
	var k model.APIKey
	err := row.Scan(&k.ID, &k.UserID, &k.Label, &k.KeyHash, &k.KeyPrefix, &k.LastUsedAt, &k.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &k, nil
}

func (r *APIKeyRepository) FindByUserID(ctx context.Context, userID string) ([]model.APIKey, error) {
	query := "SELECT " + apiKeyColumns + " FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC"
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := rows.Close(); err != nil {
			log.Printf("rows close failed: %v", err)
		}
	}()

	var keys []model.APIKey
	for rows.Next() {
		k, err := scanAPIKey(rows)
		if err != nil {
			return nil, err
		}
		keys = append(keys, *k)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return keys, nil
}

func (r *APIKeyRepository) FindByID(ctx context.Context, id string) (*model.APIKey, error) {
	query := "SELECT " + apiKeyColumns + " FROM api_keys WHERE id = $1"
	k, err := scanAPIKey(r.db.QueryRowContext(ctx, query, id))
	if err == sql.ErrNoRows {
		return nil, model.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return k, nil
}

func (r *APIKeyRepository) FindByHash(ctx context.Context, keyHash string) (*model.APIKey, error) {
	query := "SELECT " + apiKeyColumns + " FROM api_keys WHERE key_hash = $1"
	k, err := scanAPIKey(r.db.QueryRowContext(ctx, query, keyHash))
	if err == sql.ErrNoRows {
		return nil, model.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return k, nil
}

func (r *APIKeyRepository) ExistsByUserIDAndLabel(ctx context.Context, userID, label string) (bool, error) {
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM api_keys WHERE user_id = $1 AND label = $2)"
	if err := r.db.QueryRowContext(ctx, query, userID, label).Scan(&exists); err != nil {
		return false, err
	}
	return exists, nil
}

func (r *APIKeyRepository) CountByUserID(ctx context.Context, userID string) (int, error) {
	var count int
	query := "SELECT COUNT(*) FROM api_keys WHERE user_id = $1"
	if err := r.db.QueryRowContext(ctx, query, userID).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

func (r *APIKeyRepository) Create(ctx context.Context, k *model.APIKey) error {
	query := `INSERT INTO api_keys (user_id, label, key_hash, key_prefix)
	VALUES ($1, $2, $3, $4)
	RETURNING id, created_at`
	return r.db.QueryRowContext(ctx, query, k.UserID, k.Label, k.KeyHash, k.KeyPrefix).
		Scan(&k.ID, &k.CreatedAt)
}

func (r *APIKeyRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM api_keys WHERE id = $1", id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return model.ErrNotFound
	}
	return nil
}

// TouchLastUsed は last_used_at を更新する。直近1分以内に更新済みなら何もしない
// （設定ミスで連打してくるクライアント対策）。
func (r *APIKeyRepository) TouchLastUsed(ctx context.Context, id string) error {
	query := `UPDATE api_keys SET last_used_at = now()
	WHERE id = $1 AND (last_used_at IS NULL OR last_used_at < now() - interval '1 minute')`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
