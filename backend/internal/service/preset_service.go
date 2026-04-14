package service

import (
	"context"
	"time"

	"github.com/akito-0520/knockit/internal/model"
	"github.com/akito-0520/knockit/internal/repository"
	"github.com/akito-0520/knockit/internal/validator"
)

type PresetService struct {
	presetRepository *repository.PresetRepository
}

func NewPresetService(presetRepo *repository.PresetRepository) *PresetService {
	return &PresetService{

		presetRepository: presetRepo,
	}
}

func (s *PresetService) GetUserPresets(ctx context.Context, userID string) ([]model.Preset, error) {
	presets, err := s.presetRepository.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return presets, nil
}

func (s *PresetService) CreatePreset(ctx context.Context, userID string, req model.CreatePresetRequest) (*model.Preset, error) {
	// バリデーション
	errs := validator.ValidateCreatePreset(req)
	if len(errs) > 0 {
		return nil, model.ErrValidation
	}

	// 作成するプリセットのセット
	preset := &model.Preset{
		UserID:       userID,
		Label:        req.Label,
		Color:        req.Color,
		DisplayOrder: req.DisplayOrder,
	}

	// プリセットの作成
	err := s.presetRepository.Create(ctx, preset)
	if err != nil {
		return nil, err
	}

	return preset, nil
}

func (s *PresetService) UpdatePreset(ctx context.Context, userID string, id string, req model.UpdatePresetRequest) (*model.Preset, error) {
	// バリデーション
	errs := validator.ValidateUpdatePreset(req)
	if len(errs) > 0 {
		return nil, model.ErrValidation
	}

	// 更新対象のプリセットを取得
	existing, err := s.presetRepository.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// 更新対象のプリセット所有者とユーザーIDが等しいか
	if existing.UserID != userID {
		return nil, model.ErrForbidden
	}

	// 更新するプリセットのセット
	preset := &model.Preset{
		ID:           id,
		Label:        req.Label,
		Color:        req.Color,
		DisplayOrder: req.DisplayOrder,
		UpdatedAt:    time.Now(),
	}

	// プリセットの更新
	err = s.presetRepository.Update(ctx, preset)
	if err != nil {
		return nil, err
	}

	return preset, nil
}

func (s *PresetService) DeletePreset(ctx context.Context, userID string, id string) error {
	// 更新対象のプリセットを取得
	existing, err := s.presetRepository.FindByID(ctx, id)
	if err != nil {
		return err
	}

	// 更新対象のプリセット所有者とユーザーIDが等しいか
	if existing.UserID != userID {
		return model.ErrForbidden
	}

	err = s.presetRepository.Delete(ctx, id)
	if err != nil {
		return err
	}
	return nil
}
