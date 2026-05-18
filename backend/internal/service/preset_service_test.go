package service

import (
	"context"
	"errors"
	"testing"

	"github.com/akito-0520/knockit/internal/model"
)

// ---------- Preset Repository のモック ---------------

type mockPresetRepository struct {
	findByUserIDFunc func(ctx context.Context, userID string) ([]model.Preset, error)
	findByIDFunc     func(ctx context.Context, id string) (*model.Preset, error)
	createFunc       func(ctx context.Context, preset *model.Preset) error
	updateFunc       func(ctx context.Context, preset *model.Preset) error
	deleteFunc       func(ctx context.Context, id string) error
}

func (m *mockPresetRepository) FindByUserID(ctx context.Context, userID string) ([]model.Preset, error) {
	return m.findByUserIDFunc(ctx, userID)
}

func (m *mockPresetRepository) FindByID(ctx context.Context, id string) (*model.Preset, error) {
	return m.findByIDFunc(ctx, id)
}

func (m *mockPresetRepository) Create(ctx context.Context, preset *model.Preset) error {
	return m.createFunc(ctx, preset)
}

func (m *mockPresetRepository) Update(ctx context.Context, preset *model.Preset) error {
	return m.updateFunc(ctx, preset)
}

func (m *mockPresetRepository) Delete(ctx context.Context, id string) error {
	return m.deleteFunc(ctx, id)
}

func TestGetUserPresets(t *testing.T) {
	uuid := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	dbErr := errors.New("connection timeout")

	tests := []struct {
		name             string
		findByUserIDFunc func(ctx context.Context, userID string) ([]model.Preset, error)
		wantCount        int
		wantErr          error
	}{
		{
			name: "正常系",
			findByUserIDFunc: func(ctx context.Context, userID string) ([]model.Preset, error) {
				return []model.Preset{
					{ID: "1", UserID: userID, Label: "勉強中", Color: "#3B82F6"},
					{ID: "2", UserID: userID, Label: "作業中", Color: "#8B5CF6"},
				}, nil
			},
			wantCount: 2,
			wantErr:   nil,
		},
		{
			name: "正常系: プリセットが 0 件",
			findByUserIDFunc: func(ctx context.Context, userID string) ([]model.Preset, error) {
				return []model.Preset{}, nil
			},
			wantCount: 0,
			wantErr:   nil,
		},
		{
			name: "異常系: DB 接続エラー",
			findByUserIDFunc: func(ctx context.Context, userID string) ([]model.Preset, error) {
				return nil, dbErr
			},
			wantErr: dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			presetMock := &mockPresetRepository{findByUserIDFunc: tt.findByUserIDFunc}
			presetService := NewPresetService(presetMock)

			presets, err := presetService.GetUserPresets(context.Background(), uuid)

			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
				if len(presets) != tt.wantCount {
					t.Errorf("len(presets) = %d, want %d", len(presets), tt.wantCount)
				}
			} else {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected %v, got %v", tt.wantErr, err)
				}
			}
		})
	}
}

func TestGetPresetByID(t *testing.T) {
	presetID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	dbErr := errors.New("connection timeout")

	tests := []struct {
		name         string
		findByIDFunc func(ctx context.Context, id string) (*model.Preset, error)
		wantPreset   *model.Preset
		wantErr      error
	}{
		{
			name: "正常系",
			findByIDFunc: func(ctx context.Context, id string) (*model.Preset, error) {
				return &model.Preset{ID: id, Label: "勉強中", Color: "#3B82F6"}, nil
			},
			wantPreset: &model.Preset{ID: presetID, Label: "勉強中", Color: "#3B82F6"},
			wantErr:    nil,
		},
		{
			name: "異常系: プリセットが見つからない",
			findByIDFunc: func(ctx context.Context, id string) (*model.Preset, error) {
				return nil, model.ErrNotFound
			},
			wantPreset: nil,
			wantErr:    model.ErrNotFound,
		},
		{
			name: "異常系: DB 接続エラー",
			findByIDFunc: func(ctx context.Context, id string) (*model.Preset, error) {
				return nil, dbErr
			},
			wantPreset: nil,
			wantErr:    dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			presetMock := &mockPresetRepository{findByIDFunc: tt.findByIDFunc}
			presetService := NewPresetService(presetMock)

			preset, err := presetService.GetPresetByID(context.Background(), presetID)

			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
				if preset == nil {
					t.Fatal("expected preset, got nil")
				}
				if preset.ID != tt.wantPreset.ID {
					t.Errorf("ID = %q, want %q", preset.ID, tt.wantPreset.ID)
				}
				if preset.Label != tt.wantPreset.Label {
					t.Errorf("Label = %q, want %q", preset.Label, tt.wantPreset.Label)
				}
			} else {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected %v, got %v", tt.wantErr, err)
				}
			}
		})
	}
}

func TestCreatePreset(t *testing.T) {
	uuid := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	dbErr := errors.New("connection timeout")

	noopCreate := func(ctx context.Context, preset *model.Preset) error { return nil }

	tests := []struct {
		name        string
		req         model.CreatePresetRequest
		createFunc  func(ctx context.Context, preset *model.Preset) error
		wantPreset  *model.Preset
		wantErr     error
	}{
		{
			name:       "正常系",
			req:        model.CreatePresetRequest{Label: "勉強中", Color: "#3B82F6", DisplayOrder: 1},
			createFunc: noopCreate,
			wantPreset: &model.Preset{UserID: uuid, Label: "勉強中", Color: "#3B82F6", DisplayOrder: 1},
			wantErr:    nil,
		},
		{
			name:    "異常系: バリデーションエラー (color が不正)",
			req:     model.CreatePresetRequest{Label: "勉強中", Color: "3B82F6", DisplayOrder: 1},
			wantErr: model.ErrValidation,
		},
		{
			name:    "異常系: バリデーションエラー (display_order が負の値)",
			req:     model.CreatePresetRequest{Label: "勉強中", Color: "#3B82F6", DisplayOrder: -1},
			wantErr: model.ErrValidation,
		},
		{
			name:       "異常系: DB 接続エラー",
			req:        model.CreatePresetRequest{Label: "勉強中", Color: "#3B82F6", DisplayOrder: 1},
			createFunc: func(ctx context.Context, preset *model.Preset) error { return dbErr },
			wantErr:    dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			presetMock := &mockPresetRepository{createFunc: tt.createFunc}
			presetService := NewPresetService(presetMock)

			preset, err := presetService.CreatePreset(context.Background(), uuid, tt.req)

			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
				if preset == nil {
					t.Fatal("expected preset, got nil")
				}
				if preset.UserID != tt.wantPreset.UserID {
					t.Errorf("UserID = %q, want %q", preset.UserID, tt.wantPreset.UserID)
				}
				if preset.Label != tt.wantPreset.Label {
					t.Errorf("Label = %q, want %q", preset.Label, tt.wantPreset.Label)
				}
				if preset.Color != tt.wantPreset.Color {
					t.Errorf("Color = %q, want %q", preset.Color, tt.wantPreset.Color)
				}
				if preset.DisplayOrder != tt.wantPreset.DisplayOrder {
					t.Errorf("DisplayOrder = %d, want %d", preset.DisplayOrder, tt.wantPreset.DisplayOrder)
				}
			} else {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected %v, got %v", tt.wantErr, err)
				}
			}
		})
	}
}

func TestUpdatePreset(t *testing.T) {
	ownerID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	otherID := "cccccccc-cccc-cccc-cccc-cccccccccccc"
	presetID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	dbErr := errors.New("connection timeout")

	ownedPreset := func(ctx context.Context, id string) (*model.Preset, error) {
		return &model.Preset{ID: id, UserID: ownerID, Label: "旧ラベル", Color: "#000000"}, nil
	}
	noopUpdate := func(ctx context.Context, preset *model.Preset) error { return nil }

	tests := []struct {
		name         string
		userID       string
		req          model.UpdatePresetRequest
		findByIDFunc func(ctx context.Context, id string) (*model.Preset, error)
		updateFunc   func(ctx context.Context, preset *model.Preset) error
		wantPreset   *model.Preset
		wantErr      error
	}{
		{
			name:         "正常系",
			userID:       ownerID,
			req:          model.UpdatePresetRequest{Label: "新ラベル", Color: "#3B82F6", DisplayOrder: 2},
			findByIDFunc: ownedPreset,
			updateFunc:   noopUpdate,
			wantPreset:   &model.Preset{ID: presetID, Label: "新ラベル", Color: "#3B82F6", DisplayOrder: 2},
			wantErr:      nil,
		},
		{
			name:    "異常系: バリデーションエラー (color が不正)",
			userID:  ownerID,
			req:     model.UpdatePresetRequest{Label: "新ラベル", Color: "3B82F6", DisplayOrder: 2},
			wantErr: model.ErrValidation,
		},
		{
			name:   "異常系: プリセットが見つからない",
			userID: ownerID,
			req:    model.UpdatePresetRequest{Label: "新ラベル", Color: "#3B82F6", DisplayOrder: 2},
			findByIDFunc: func(ctx context.Context, id string) (*model.Preset, error) {
				return nil, model.ErrNotFound
			},
			wantErr: model.ErrNotFound,
		},
		{
			name:         "異常系: 別ユーザーのプリセット (Forbidden)",
			userID:       otherID,
			req:          model.UpdatePresetRequest{Label: "新ラベル", Color: "#3B82F6", DisplayOrder: 2},
			findByIDFunc: ownedPreset,
			wantErr:      model.ErrForbidden,
		},
		{
			name:         "異常系: Update が DB エラー",
			userID:       ownerID,
			req:          model.UpdatePresetRequest{Label: "新ラベル", Color: "#3B82F6", DisplayOrder: 2},
			findByIDFunc: ownedPreset,
			updateFunc:   func(ctx context.Context, preset *model.Preset) error { return dbErr },
			wantErr:      dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			presetMock := &mockPresetRepository{
				findByIDFunc: tt.findByIDFunc,
				updateFunc:   tt.updateFunc,
			}
			presetService := NewPresetService(presetMock)

			preset, err := presetService.UpdatePreset(context.Background(), tt.userID, presetID, tt.req)

			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
				if preset == nil {
					t.Fatal("expected preset, got nil")
				}
				if preset.ID != tt.wantPreset.ID {
					t.Errorf("ID = %q, want %q", preset.ID, tt.wantPreset.ID)
				}
				if preset.Label != tt.wantPreset.Label {
					t.Errorf("Label = %q, want %q", preset.Label, tt.wantPreset.Label)
				}
				if preset.Color != tt.wantPreset.Color {
					t.Errorf("Color = %q, want %q", preset.Color, tt.wantPreset.Color)
				}
				if preset.DisplayOrder != tt.wantPreset.DisplayOrder {
					t.Errorf("DisplayOrder = %d, want %d", preset.DisplayOrder, tt.wantPreset.DisplayOrder)
				}
			} else {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected %v, got %v", tt.wantErr, err)
				}
			}
		})
	}
}

func TestDeletePreset(t *testing.T) {
	ownerID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	otherID := "cccccccc-cccc-cccc-cccc-cccccccccccc"
	presetID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	dbErr := errors.New("connection timeout")

	ownedPreset := func(ctx context.Context, id string) (*model.Preset, error) {
		return &model.Preset{ID: id, UserID: ownerID}, nil
	}
	noopDelete := func(ctx context.Context, id string) error { return nil }

	tests := []struct {
		name         string
		userID       string
		findByIDFunc func(ctx context.Context, id string) (*model.Preset, error)
		deleteFunc   func(ctx context.Context, id string) error
		wantErr      error
	}{
		{
			name:         "正常系",
			userID:       ownerID,
			findByIDFunc: ownedPreset,
			deleteFunc:   noopDelete,
			wantErr:      nil,
		},
		{
			name:   "異常系: プリセットが見つからない",
			userID: ownerID,
			findByIDFunc: func(ctx context.Context, id string) (*model.Preset, error) {
				return nil, model.ErrNotFound
			},
			wantErr: model.ErrNotFound,
		},
		{
			name:         "異常系: 別ユーザーのプリセット (Forbidden)",
			userID:       otherID,
			findByIDFunc: ownedPreset,
			wantErr:      model.ErrForbidden,
		},
		{
			name:         "異常系: Delete が DB エラー",
			userID:       ownerID,
			findByIDFunc: ownedPreset,
			deleteFunc:   func(ctx context.Context, id string) error { return dbErr },
			wantErr:      dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			presetMock := &mockPresetRepository{
				findByIDFunc: tt.findByIDFunc,
				deleteFunc:   tt.deleteFunc,
			}
			presetService := NewPresetService(presetMock)

			err := presetService.DeletePreset(context.Background(), tt.userID, presetID)

			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
			} else {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected %v, got %v", tt.wantErr, err)
				}
			}
		})
	}
}
