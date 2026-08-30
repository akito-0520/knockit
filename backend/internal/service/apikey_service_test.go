package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/akito-0520/knockit/internal/apikey"
	"github.com/akito-0520/knockit/internal/model"
)

type mockAPIKeyRepository struct {
	findByUserIDFunc  func(ctx context.Context, userID string) ([]model.APIKey, error)
	findByIDFunc      func(ctx context.Context, id string) (*model.APIKey, error)
	findByHashFunc    func(ctx context.Context, keyHash string) (*model.APIKey, error)
	existsFunc        func(ctx context.Context, userID, label string) (bool, error)
	countFunc         func(ctx context.Context, userID string) (int, error)
	createFunc        func(ctx context.Context, k *model.APIKey) error
	deleteFunc        func(ctx context.Context, id string) error
	touchLastUsedFunc func(ctx context.Context, id string) error

	created       *model.APIKey
	touchLastUsed int
	deleted       int
}

func (m *mockAPIKeyRepository) FindByUserID(ctx context.Context, userID string) ([]model.APIKey, error) {
	return m.findByUserIDFunc(ctx, userID)
}

func (m *mockAPIKeyRepository) FindByID(ctx context.Context, id string) (*model.APIKey, error) {
	return m.findByIDFunc(ctx, id)
}

func (m *mockAPIKeyRepository) FindByHash(ctx context.Context, keyHash string) (*model.APIKey, error) {
	return m.findByHashFunc(ctx, keyHash)
}

func (m *mockAPIKeyRepository) ExistsByUserIDAndLabel(ctx context.Context, userID, label string) (bool, error) {
	if m.existsFunc == nil {
		return false, nil
	}
	return m.existsFunc(ctx, userID, label)
}

func (m *mockAPIKeyRepository) CountByUserID(ctx context.Context, userID string) (int, error) {
	if m.countFunc == nil {
		return 0, nil
	}
	return m.countFunc(ctx, userID)
}

func (m *mockAPIKeyRepository) Create(ctx context.Context, k *model.APIKey) error {
	m.created = k
	if m.createFunc != nil {
		return m.createFunc(ctx, k)
	}
	k.ID = "generated-id"
	return nil
}

func (m *mockAPIKeyRepository) Delete(ctx context.Context, id string) error {
	m.deleted++
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, id)
	}
	return nil
}

func (m *mockAPIKeyRepository) TouchLastUsed(ctx context.Context, id string) error {
	m.touchLastUsed++
	if m.touchLastUsedFunc != nil {
		return m.touchLastUsedFunc(ctx, id)
	}
	return nil
}

func TestCreateAPIKey(t *testing.T) {
	const userID = "user-1"

	t.Run("正常系: 生キーを返し、ハッシュを保存する", func(t *testing.T) {
		repo := &mockAPIKeyRepository{}
		svc := NewAPIKeyService(repo)

		res, err := svc.CreateAPIKey(context.Background(), userID, model.CreateAPIKeyRequest{Label: "  iOS  "})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if !strings.HasPrefix(res.Key, apikey.Prefix) {
			t.Errorf("Key %q does not start with %q", res.Key, apikey.Prefix)
		}
		if res.Label != "iOS" {
			t.Errorf("Label = %q, want trimmed %q", res.Label, "iOS")
		}
		if repo.created.KeyHash != apikey.Hash(res.Key) {
			t.Errorf("stored KeyHash does not match Hash(rawKey)")
		}
		if repo.created.KeyHash == res.Key {
			t.Error("raw key must not be stored as key_hash")
		}
		if repo.created.KeyPrefix != res.KeyPrefix || res.KeyPrefix == "" {
			t.Errorf("KeyPrefix mismatch: stored=%q res=%q", repo.created.KeyPrefix, res.KeyPrefix)
		}
	})

	t.Run("異常系: ラベル重複", func(t *testing.T) {
		repo := &mockAPIKeyRepository{
			existsFunc: func(ctx context.Context, userID, label string) (bool, error) { return true, nil },
		}
		svc := NewAPIKeyService(repo)

		_, err := svc.CreateAPIKey(context.Background(), userID, model.CreateAPIKeyRequest{Label: "dup"})
		if !errors.Is(err, model.ErrAlreadyExists) {
			t.Errorf("want ErrAlreadyExists, got %v", err)
		}
		if repo.created != nil {
			t.Error("should not create when label duplicates")
		}
	})

	t.Run("異常系: 上限到達", func(t *testing.T) {
		repo := &mockAPIKeyRepository{
			countFunc: func(ctx context.Context, userID string) (int, error) { return MaxAPIKeysPerUser, nil },
		}
		svc := NewAPIKeyService(repo)

		_, err := svc.CreateAPIKey(context.Background(), userID, model.CreateAPIKeyRequest{Label: "over"})
		if !errors.Is(err, model.ErrValidation) {
			t.Errorf("want ErrValidation, got %v", err)
		}
	})

	t.Run("異常系: ラベルが空", func(t *testing.T) {
		repo := &mockAPIKeyRepository{}
		svc := NewAPIKeyService(repo)

		_, err := svc.CreateAPIKey(context.Background(), userID, model.CreateAPIKeyRequest{Label: "   "})
		if !errors.Is(err, model.ErrValidation) {
			t.Errorf("want ErrValidation, got %v", err)
		}
	})
}

func TestDeleteAPIKey(t *testing.T) {
	const userID = "user-1"

	t.Run("正常系", func(t *testing.T) {
		repo := &mockAPIKeyRepository{
			findByIDFunc: func(ctx context.Context, id string) (*model.APIKey, error) {
				return &model.APIKey{ID: id, UserID: userID}, nil
			},
		}
		svc := NewAPIKeyService(repo)

		if err := svc.DeleteAPIKey(context.Background(), userID, "k1"); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if repo.deleted != 1 {
			t.Errorf("Delete called %d times, want 1", repo.deleted)
		}
	})

	t.Run("異常系: 他人のキー", func(t *testing.T) {
		repo := &mockAPIKeyRepository{
			findByIDFunc: func(ctx context.Context, id string) (*model.APIKey, error) {
				return &model.APIKey{ID: id, UserID: "someone-else"}, nil
			},
		}
		svc := NewAPIKeyService(repo)

		err := svc.DeleteAPIKey(context.Background(), userID, "k1")
		if !errors.Is(err, model.ErrForbidden) {
			t.Errorf("want ErrForbidden, got %v", err)
		}
		if repo.deleted != 0 {
			t.Error("must not delete another user's key")
		}
	})

	t.Run("異常系: 存在しない", func(t *testing.T) {
		repo := &mockAPIKeyRepository{
			findByIDFunc: func(ctx context.Context, id string) (*model.APIKey, error) {
				return nil, model.ErrNotFound
			},
		}
		svc := NewAPIKeyService(repo)

		err := svc.DeleteAPIKey(context.Background(), userID, "missing")
		if !errors.Is(err, model.ErrNotFound) {
			t.Errorf("want ErrNotFound, got %v", err)
		}
	})
}

func TestAuthenticate(t *testing.T) {
	t.Run("正常系: user_id を返し last_used_at を更新する", func(t *testing.T) {
		repo := &mockAPIKeyRepository{
			findByHashFunc: func(ctx context.Context, keyHash string) (*model.APIKey, error) {
				if keyHash != apikey.Hash("knk_raw") {
					t.Errorf("FindByHash called with %q, want Hash(knk_raw)", keyHash)
				}
				return &model.APIKey{ID: "k1", UserID: "user-9"}, nil
			},
		}
		svc := NewAPIKeyService(repo)

		userID, err := svc.Authenticate(context.Background(), "knk_raw")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if userID != "user-9" {
			t.Errorf("userID = %q, want %q", userID, "user-9")
		}
		if repo.touchLastUsed != 1 {
			t.Errorf("TouchLastUsed called %d times, want 1", repo.touchLastUsed)
		}
	})

	t.Run("正常系: last_used_at 更新失敗でも認証は通す", func(t *testing.T) {
		repo := &mockAPIKeyRepository{
			findByHashFunc: func(ctx context.Context, keyHash string) (*model.APIKey, error) {
				return &model.APIKey{ID: "k1", UserID: "user-9"}, nil
			},
			touchLastUsedFunc: func(ctx context.Context, id string) error { return errors.New("db down") },
		}
		svc := NewAPIKeyService(repo)

		userID, err := svc.Authenticate(context.Background(), "knk_raw")
		if err != nil || userID != "user-9" {
			t.Errorf("want (user-9, nil), got (%q, %v)", userID, err)
		}
	})

	t.Run("異常系: キーが存在しない", func(t *testing.T) {
		repo := &mockAPIKeyRepository{
			findByHashFunc: func(ctx context.Context, keyHash string) (*model.APIKey, error) {
				return nil, model.ErrNotFound
			},
		}
		svc := NewAPIKeyService(repo)

		_, err := svc.Authenticate(context.Background(), "knk_unknown")
		if !errors.Is(err, model.ErrNotFound) {
			t.Errorf("want ErrNotFound, got %v", err)
		}
	})
}
