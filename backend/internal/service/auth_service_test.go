package service

import (
	"context"
	"errors"
	"testing"

	"github.com/akito-0520/knockit/internal/model"
)

// ---------- User Repository のモック ---------------

type mockAuthUserRepository struct {
	findByIDFunc         func(ctx context.Context, id string) (*model.User, error)
	existsByUsernameFunc func(ctx context.Context, username string) (bool, error)
	createFunc           func(ctx context.Context, user *model.User) error
	updateFunc           func(ctx context.Context, user *model.User) error
}

func (m *mockAuthUserRepository) FindByID(ctx context.Context, id string) (*model.User, error) {
	return m.findByIDFunc(ctx, id)
}

func (m *mockAuthUserRepository) ExistsByUsername(ctx context.Context, username string) (bool, error) {
	return m.existsByUsernameFunc(ctx, username)
}

func (m *mockAuthUserRepository) Create(ctx context.Context, user *model.User) error {
	return m.createFunc(ctx, user)
}

func (m *mockAuthUserRepository) Update(ctx context.Context, user *model.User) error {
	return m.updateFunc(ctx, user)
}

// ---------- Status Repository のモック ---------------

type mockAuthStatusRepository struct {
	createInitialFunc func(ctx context.Context, userID string) error
}

func (m *mockAuthStatusRepository) CreateInitial(ctx context.Context, userID string) error {
	return m.createInitialFunc(ctx, userID)
}

// ---------- Preset Repository のモック ---------------

type mockAuthPresetRepository struct {
	createDefaultPresetsFunc func(ctx context.Context, userID string) error
}

func (m *mockAuthPresetRepository) CreateDefaultPresets(ctx context.Context, userID string) error {
	return m.createDefaultPresetsFunc(ctx, userID)
}

func TestSetupUser(t *testing.T) {
	uuid := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	dbErr := errors.New("connection timeout")

	noopCreate := func(ctx context.Context, user *model.User) error { return nil }
	noopCreateDefaultPresets := func(ctx context.Context, userID string) error { return nil }
	noopCreateInitial := func(ctx context.Context, userID string) error { return nil }
	notExists := func(ctx context.Context, username string) (bool, error) { return false, nil }

	tests := []struct {
		name                     string
		req                      model.UserSetupRequest
		existsByUsernameFunc     func(ctx context.Context, username string) (bool, error)
		createFunc               func(ctx context.Context, user *model.User) error
		createDefaultPresetsFunc func(ctx context.Context, userID string) error
		createInitialFunc        func(ctx context.Context, userID string) error
		wantUsername             string
		wantDisplayName          string
		wantErr                  error
	}{
		{
			name:                     "正常系",
			req:                      model.UserSetupRequest{Username: "testuser", DisplayName: "Test User"},
			existsByUsernameFunc:     notExists,
			createFunc:               noopCreate,
			createDefaultPresetsFunc: noopCreateDefaultPresets,
			createInitialFunc:        noopCreateInitial,
			wantUsername:             "testuser",
			wantDisplayName:          "Test User",
			wantErr:                  nil,
		},
		{
			name:    "異常系: バリデーションエラー (username が短すぎる)",
			req:     model.UserSetupRequest{Username: "ab", DisplayName: "Test User"},
			wantErr: model.ErrValidation,
		},
		{
			name:                 "異常系: ユーザー名が重複している",
			req:                  model.UserSetupRequest{Username: "testuser", DisplayName: "Test User"},
			existsByUsernameFunc: func(ctx context.Context, username string) (bool, error) { return true, nil },
			wantErr:              model.ErrAlreadyExists,
		},
		{
			name:                 "異常系: ExistsByUsername が DB エラー",
			req:                  model.UserSetupRequest{Username: "testuser", DisplayName: "Test User"},
			existsByUsernameFunc: func(ctx context.Context, username string) (bool, error) { return false, dbErr },
			wantErr:              dbErr,
		},
		{
			name:                 "異常系: ユーザー作成が DB エラー",
			req:                  model.UserSetupRequest{Username: "testuser", DisplayName: "Test User"},
			existsByUsernameFunc: notExists,
			createFunc:           func(ctx context.Context, user *model.User) error { return dbErr },
			wantErr:              dbErr,
		},
		{
			name:                     "異常系: デフォルトプリセット作成が DB エラー",
			req:                      model.UserSetupRequest{Username: "testuser", DisplayName: "Test User"},
			existsByUsernameFunc:     notExists,
			createFunc:               noopCreate,
			createDefaultPresetsFunc: func(ctx context.Context, userID string) error { return dbErr },
			wantErr:                  dbErr,
		},
		{
			name:                     "異常系: 初期ステータス作成が DB エラー",
			req:                      model.UserSetupRequest{Username: "testuser", DisplayName: "Test User"},
			existsByUsernameFunc:     notExists,
			createFunc:               noopCreate,
			createDefaultPresetsFunc: noopCreateDefaultPresets,
			createInitialFunc:        func(ctx context.Context, userID string) error { return dbErr },
			wantErr:                  dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := &mockAuthUserRepository{
				existsByUsernameFunc: tt.existsByUsernameFunc,
				createFunc:           tt.createFunc,
			}
			presetMock := &mockAuthPresetRepository{
				createDefaultPresetsFunc: tt.createDefaultPresetsFunc,
			}
			statusMock := &mockAuthStatusRepository{
				createInitialFunc: tt.createInitialFunc,
			}

			authService := NewAuthService(userMock, statusMock, presetMock)
			user, err := authService.SetupUser(context.Background(), uuid, tt.req)

			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
				if user == nil {
					t.Fatal("expected user, got nil")
				}
				if user.Username != tt.wantUsername {
					t.Errorf("Username = %q, want %q", user.Username, tt.wantUsername)
				}
				if user.DisplayName != tt.wantDisplayName {
					t.Errorf("DisplayName = %q, want %q", user.DisplayName, tt.wantDisplayName)
				}
			} else {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected %v, got %v", tt.wantErr, err)
				}
			}
		})
	}
}

func TestGetCurrentUser(t *testing.T) {
	uuid := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	dbErr := errors.New("connection timeout")

	tests := []struct {
		name         string
		findByIDFunc func(ctx context.Context, id string) (*model.User, error)
		wantUser     *model.User
		wantErr      error
	}{
		{
			name: "正常系",
			findByIDFunc: func(ctx context.Context, id string) (*model.User, error) {
				return &model.User{ID: id, Username: "testuser", DisplayName: "Test User"}, nil
			},
			wantUser: &model.User{ID: uuid, Username: "testuser", DisplayName: "Test User"},
			wantErr:  nil,
		},
		{
			name: "異常系: ユーザーが見つからない",
			findByIDFunc: func(ctx context.Context, id string) (*model.User, error) {
				return nil, model.ErrNotFound
			},
			wantUser: nil,
			wantErr:  model.ErrNotFound,
		},
		{
			name: "異常系: DB 接続エラー",
			findByIDFunc: func(ctx context.Context, id string) (*model.User, error) {
				return nil, dbErr
			},
			wantUser: nil,
			wantErr:  dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := &mockAuthUserRepository{findByIDFunc: tt.findByIDFunc}
			authService := NewAuthService(userMock, &mockAuthStatusRepository{}, &mockAuthPresetRepository{})

			user, err := authService.GetCurrentUser(context.Background(), uuid)

			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
				if user == nil {
					t.Fatal("expected user, got nil")
				}
				if user.ID != tt.wantUser.ID {
					t.Errorf("ID = %q, want %q", user.ID, tt.wantUser.ID)
				}
				if user.Username != tt.wantUser.Username {
					t.Errorf("Username = %q, want %q", user.Username, tt.wantUser.Username)
				}
			} else {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected %v, got %v", tt.wantErr, err)
				}
			}
		})
	}
}

func TestUpdateUser(t *testing.T) {
	uuid := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	dbErr := errors.New("connection timeout")

	existingUser := func(ctx context.Context, id string) (*model.User, error) {
		return &model.User{ID: id, Username: "testuser", DisplayName: "Old Name"}, nil
	}
	noopUpdate := func(ctx context.Context, user *model.User) error { return nil }

	tests := []struct {
		name            string
		req             model.UserUpdateRequest
		findByIDFunc    func(ctx context.Context, id string) (*model.User, error)
		updateFunc      func(ctx context.Context, user *model.User) error
		wantDisplayName string
		wantErr         error
	}{
		{
			name:            "正常系",
			req:             model.UserUpdateRequest{DisplayName: "New Display Name"},
			findByIDFunc:    existingUser,
			updateFunc:      noopUpdate,
			wantDisplayName: "New Display Name",
			wantErr:         nil,
		},
		{
			name:    "異常系: バリデーションエラー (DisplayName が空)",
			req:     model.UserUpdateRequest{DisplayName: ""},
			wantErr: model.ErrValidation,
		},
		{
			name: "異常系: ユーザーが見つからない",
			req:  model.UserUpdateRequest{DisplayName: "New Display Name"},
			findByIDFunc: func(ctx context.Context, id string) (*model.User, error) {
				return nil, model.ErrNotFound
			},
			wantErr: model.ErrNotFound,
		},
		{
			name:         "異常系: Update が DB エラー",
			req:          model.UserUpdateRequest{DisplayName: "New Display Name"},
			findByIDFunc: existingUser,
			updateFunc:   func(ctx context.Context, user *model.User) error { return dbErr },
			wantErr:      dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := &mockAuthUserRepository{
				findByIDFunc: tt.findByIDFunc,
				updateFunc:   tt.updateFunc,
			}
			authService := NewAuthService(userMock, &mockAuthStatusRepository{}, &mockAuthPresetRepository{})

			user, err := authService.UpdateUser(context.Background(), uuid, tt.req)

			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
				if user == nil {
					t.Fatal("expected user, got nil")
				}
				if user.DisplayName != tt.wantDisplayName {
					t.Errorf("DisplayName = %q, want %q", user.DisplayName, tt.wantDisplayName)
				}
			} else {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected %v, got %v", tt.wantErr, err)
				}
			}
		})
	}
}
