package service

import (
	"context"
	"log"
	"strings"

	"github.com/akito-0520/knockit/internal/apikey"
	"github.com/akito-0520/knockit/internal/model"
	"github.com/akito-0520/knockit/internal/validator"
)

// MaxAPIKeysPerUser は1ユーザーが保持できるAPIキーの上限。
const MaxAPIKeysPerUser = 10

type APIKeyRepositoryInterface interface {
	FindByUserID(ctx context.Context, userID string) ([]model.APIKey, error)
	FindByID(ctx context.Context, id string) (*model.APIKey, error)
	FindByHash(ctx context.Context, keyHash string) (*model.APIKey, error)
	ExistsByUserIDAndLabel(ctx context.Context, userID, label string) (bool, error)
	CountByUserID(ctx context.Context, userID string) (int, error)
	Create(ctx context.Context, k *model.APIKey) error
	Delete(ctx context.Context, id string) error
	TouchLastUsed(ctx context.Context, id string) error
}

type APIKeyService struct {
	repo APIKeyRepositoryInterface
}

func NewAPIKeyService(repo APIKeyRepositoryInterface) *APIKeyService {
	return &APIKeyService{repo: repo}
}

func (s *APIKeyService) GetUserAPIKeys(ctx context.Context, userID string) ([]model.APIKey, error) {
	return s.repo.FindByUserID(ctx, userID)
}

func (s *APIKeyService) CreateAPIKey(ctx context.Context, userID string, req model.CreateAPIKeyRequest) (*model.CreatedAPIKeyResponse, error) {
	label := strings.TrimSpace(req.Label)

	if errs := validator.ValidateAPIKeyLabel(label); len(errs) > 0 {
		return nil, model.ErrValidation
	}

	exists, err := s.repo.ExistsByUserIDAndLabel(ctx, userID, label)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, model.ErrAlreadyExists
	}

	count, err := s.repo.CountByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if count >= MaxAPIKeysPerUser {
		return nil, model.ErrValidation
	}

	raw, hash, prefix, err := apikey.Generate()
	if err != nil {
		return nil, err
	}

	k := &model.APIKey{
		UserID:    userID,
		Label:     label,
		KeyHash:   hash,
		KeyPrefix: prefix,
	}
	if err := s.repo.Create(ctx, k); err != nil {
		return nil, err
	}

	return &model.CreatedAPIKeyResponse{
		ID:        k.ID,
		Label:     k.Label,
		Key:       raw,
		KeyPrefix: k.KeyPrefix,
		CreatedAt: k.CreatedAt,
	}, nil
}

func (s *APIKeyService) DeleteAPIKey(ctx context.Context, userID, id string) error {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing.UserID != userID {
		return model.ErrForbidden
	}
	return s.repo.Delete(ctx, id)
}

// Authenticate は生キーを検証し、対応する user_id を返す。
// last_used_at の更新に失敗しても認証自体は成功させる。
func (s *APIKeyService) Authenticate(ctx context.Context, rawKey string) (string, error) {
	k, err := s.repo.FindByHash(ctx, apikey.Hash(rawKey))
	if err != nil {
		return "", err
	}
	if err := s.repo.TouchLastUsed(ctx, k.ID); err != nil {
		log.Printf("[apikey] failed to update last_used_at for %s: %v", k.ID, err)
	}
	return k.UserID, nil
}
