package service

import (
	"context"

	"github.com/akito-0520/knockit/internal/model"
	"github.com/akito-0520/knockit/internal/validator"
)

type AuthUserRepositoryInterface interface {
	FindByID(ctx context.Context, id string) (*model.User, error)
	ExistsByUsername(ctx context.Context, username string) (bool, error)
	Create(ctx context.Context, user *model.User) error
	Update(ctx context.Context, user *model.User) error
}

type AuthStatusRepositoryInterface interface {
	CreateInitial(ctx context.Context, userID string) error
}

type AuthPresetRepositoryInterface interface {
	CreateDefaultPresets(ctx context.Context, userID string) error
}

type AuthService struct {
	userRepository   AuthUserRepositoryInterface
	statusRepository AuthStatusRepositoryInterface
	presetRepository AuthPresetRepositoryInterface
}

func NewAuthService(userRepo AuthUserRepositoryInterface, statusRepo AuthStatusRepositoryInterface, presetRepo AuthPresetRepositoryInterface) *AuthService {
	return &AuthService{
		userRepository:   userRepo,
		statusRepository: statusRepo,
		presetRepository: presetRepo,
	}
}

func (s *AuthService) SetupUser(ctx context.Context, supabaseUserID string, req model.UserSetupRequest) (*model.User, error) {
	// バリデーション
	errs := validator.ValidateUserSetup(req)
	if len(errs) > 0 {
		return nil, model.ErrValidation
	}

	// ユーザー名の重複チェック
	exists, err := s.userRepository.ExistsByUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, model.ErrAlreadyExists
	}

	// ユーザーの新規作成
	user := &model.User{
		ID:          supabaseUserID,
		Username:    req.Username,
		DisplayName: req.DisplayName,
	}
	err = s.userRepository.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	// デフォルトプリセットの作成
	err = s.presetRepository.CreateDefaultPresets(ctx, supabaseUserID)
	if err != nil {
		return nil, err
	}

	err = s.statusRepository.CreateInitial(ctx, supabaseUserID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) GetCurrentUser(ctx context.Context, userID string) (*model.User, error) {
	// userIDを検索して返す
	user, err := s.userRepository.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AuthService) UpdateUser(ctx context.Context, userID string, req model.UserUpdateRequest) (*model.User, error) {
	// バリデーション
	errs := validator.ValidateUserUpdate(req)
	if len(errs) > 0 {
		return nil, model.ErrValidation
	}

	// userIDを検索して返す
	user, err := s.userRepository.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// `DisplayName` の更新
	user.DisplayName = req.DisplayName

	// ユーザー情報の更新
	err = s.userRepository.Update(ctx, user)
	if err != nil {
		return nil, err
	}
	return user, nil
}
