package service

import (
	"context"
	"errors"
	"reflect"
	"testing"
	"time"

	"github.com/akito-0520/knockit/internal/model"
)

// ---------- User Repository のモック ---------------

type mockUserRepository struct {
	findByIDFunc       func(ctx context.Context, id string) (*model.User, error)
	findByUsernameFunc func(ctx context.Context, username string) (*model.User, error)
}

func (m *mockUserRepository) FindByID(ctx context.Context, id string) (*model.User, error) {
	return m.findByIDFunc(ctx, id)
}

func (m *mockUserRepository) FindByUsername(ctx context.Context, username string) (*model.User, error) {
	return m.findByUsernameFunc(ctx, username)
}

// ---------- Status Repository のモック ---------------

type mockStatusRepository struct {
	findByUserIDFunc func(ctx context.Context, userID string) (*model.RoomStatus, error)
	upsertFunc       func(ctx context.Context, status *model.RoomStatus) error
	UpsertCalls      int
}

func (m *mockStatusRepository) FindByUserID(ctx context.Context, userID string) (*model.RoomStatus, error) {
	return m.findByUserIDFunc(ctx, userID)
}

func (m *mockStatusRepository) Upsert(ctx context.Context, status *model.RoomStatus) error {
	m.UpsertCalls++
	return m.upsertFunc(ctx, status)
}

// ヘルパー関数(*だとnilの時パニックになる)
func derefStr(p *string) string {
	if p == nil {
		return "<nil>"
	}
	return *p
}

func TestGetStatusByUsername(t *testing.T) {
	uuid := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	dbErr := errors.New("connection timeout")

	tests := []struct {
		name               string
		username           string
		findByUsernameFunc func(ctx context.Context, username string) (*model.User, error)
		findByUserIDFunc   func(ctx context.Context, userID string) (*model.RoomStatus, error)
		wantErr            error // nil なら成功を期待
	}{
		{
			name:     "成功",
			username: "test",
			findByUsernameFunc: func(ctx context.Context, username string) (*model.User, error) {
				return &model.User{ID: uuid, Username: "test"}, nil
			},
			findByUserIDFunc: func(ctx context.Context, userID string) (*model.RoomStatus, error) {
				return &model.RoomStatus{UserID: userID, CustomMessage: "勉強中"}, nil
			},
			wantErr: nil,
		},
		{
			name:     "バリデーションエラー",
			username: "Invalid!!Username",
			wantErr:  model.ErrValidation,
		},
		{
			name:     "ユーザーが見つからない",
			username: "ghostuser",
			findByUsernameFunc: func(ctx context.Context, username string) (*model.User, error) {
				return nil, model.ErrNotFound
			},
			wantErr: model.ErrNotFound,
		},
		{
			name:     "ステータスが見つからない",
			username: "test",
			findByUsernameFunc: func(ctx context.Context, username string) (*model.User, error) {
				return &model.User{ID: uuid}, nil
			},
			findByUserIDFunc: func(ctx context.Context, userID string) (*model.RoomStatus, error) {
				return nil, model.ErrNotFound
			},
			wantErr: model.ErrNotFound,
		},
		{
			name:     "DB接続エラー",
			username: "test",
			findByUsernameFunc: func(ctx context.Context, username string) (*model.User, error) {
				return nil, dbErr
			},
			wantErr: dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := &mockUserRepository{
				findByUsernameFunc: tt.findByUsernameFunc,
			}
			statusMock := &mockStatusRepository{
				findByUserIDFunc: tt.findByUserIDFunc,
			}

			service := NewStatusService(statusMock, userMock)

			_, _, err := service.GetStatusByUsername(context.Background(), tt.username)

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

func TestGetMyStatus(t *testing.T) {
	uuid := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	dbErr := errors.New("connection timeout")

	tests := []struct {
		name             string
		findByUserIDFunc func(ctx context.Context, userID string) (*model.RoomStatus, error)
		wantStatus       *model.RoomStatus
		wantErr          error
	}{
		{
			name: "正常系",
			findByUserIDFunc: func(ctx context.Context, userID string) (*model.RoomStatus, error) {
				return &model.RoomStatus{UserID: userID, CustomMessage: "test"}, nil
			},
			wantStatus: &model.RoomStatus{UserID: uuid, CustomMessage: "test"},
			wantErr:    nil,
		},
		{
			name: "異常系: status が見つからない",
			findByUserIDFunc: func(ctx context.Context, userID string) (*model.RoomStatus, error) {
				return nil, model.ErrNotFound
			},
			wantStatus: nil,
			wantErr:    model.ErrNotFound,
		},
		{
			name: "異常系: DB接続エラー",
			findByUserIDFunc: func(ctx context.Context, userID string) (*model.RoomStatus, error) {
				return nil, dbErr
			},
			wantStatus: nil,
			wantErr:    dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			statusMock := &mockStatusRepository{
				findByUserIDFunc: tt.findByUserIDFunc,
			}
			userMock := &mockUserRepository{}

			statusService := NewStatusService(statusMock, userMock)

			status, err := statusService.GetMyStatus(context.Background(), uuid)

			// --- エラーの検証 ---
			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
			} else {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected %v, got %v", tt.wantErr, err)
				}
			}

			// --- 戻り値の検証 ---
			if tt.wantStatus == nil {
				if status != nil {
					t.Errorf("expected nil status, got %+v", status)
				}
				return
			}

			if status == nil {
				t.Fatal("expected status, got nil")
			}

			if status.UserID != tt.wantStatus.UserID {
				t.Errorf("UserID = %q, want %q", status.UserID, tt.wantStatus.UserID)
			}

			if !reflect.DeepEqual(status.PresetID, tt.wantStatus.PresetID) {
				t.Errorf("PresetID = %v, want %v",
					derefStr(status.PresetID), derefStr(tt.wantStatus.PresetID))
			}

			if status.CustomMessage != tt.wantStatus.CustomMessage {
				t.Errorf("CustomMessage = %q, want %q", status.CustomMessage, tt.wantStatus.CustomMessage)
			}
		})
	}
}

func TestUpdateStatus(t *testing.T) {
	uuid := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	dbErr := errors.New("connection timeout")

	tests := []struct {
		name             string
		req              model.StatusUpdateRequest
		upsertFunc       func(ctx context.Context, status *model.RoomStatus) error
		upsertCalls      int
		wantStatus       *model.RoomStatus
		wantNotification bool
		wantErr          error
	}{
		{
			name: "正常系",
			req: model.StatusUpdateRequest{
				PresetID:      &uuid,
				CustomMessage: "test",
			},
			upsertFunc: func(ctx context.Context, status *model.RoomStatus) error {
				return nil
			},
			upsertCalls: 1,
			wantStatus: &model.RoomStatus{
				UserID:        uuid,
				PresetID:      &uuid,
				CustomMessage: "test",
			},
			wantNotification: true,
			wantErr:          nil,
		},
		{
			name: "異常系: presetID と customMessage の両方が空",
			req: model.StatusUpdateRequest{
				PresetID:      nil,
				CustomMessage: "",
			},
			upsertFunc:       nil,
			upsertCalls:      0,
			wantStatus:       nil,
			wantNotification: false,
			wantErr:          model.ErrValidation,
		},
		{
			name: "異常系: DB接続エラー",
			req: model.StatusUpdateRequest{
				PresetID:      &uuid,
				CustomMessage: "test",
			},
			upsertFunc: func(ctx context.Context, status *model.RoomStatus) error {
				return dbErr
			},
			upsertCalls:      1,
			wantStatus:       nil,
			wantNotification: false,
			wantErr:          dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockStatusRepository := &mockStatusRepository{
				upsertFunc: tt.upsertFunc,
			}
			mockUserRepository := &mockUserRepository{}

			statusService := NewStatusService(mockStatusRepository, mockUserRepository)

			// --- 購読開始 ---
			ch := statusService.Subscribe(uuid)
			defer statusService.Unsubscribe(uuid, ch)

			status, err := statusService.UpdateStatus(context.Background(), uuid, tt.req)

			if mockStatusRepository.UpsertCalls != tt.upsertCalls {
				t.Errorf("got upsert calls: %d, want upsert calls: %d", mockStatusRepository.UpsertCalls, tt.upsertCalls)
			}

			// --- エラーの検証 ---
			if tt.wantErr == nil {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
			} else {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected %v, got %v", tt.wantErr, err)
				}
			}

			// --- 戻り値の検証 ---
			if tt.wantStatus == nil {
				if status != nil {
					t.Errorf("expected nil status, got %+v", status)
				}
				return // nil のときはここで終了(以降のフィールド比較は不要)
			}

			if status == nil {
				t.Fatal("expected status, got nil")
			}

			if status.UserID != tt.wantStatus.UserID {
				t.Errorf("UserID = %q, want %q", status.UserID, tt.wantStatus.UserID)
			}

			if !reflect.DeepEqual(status.PresetID, tt.wantStatus.PresetID) {
				t.Errorf("PresetID = %v, want %v",
					derefStr(status.PresetID), derefStr(tt.wantStatus.PresetID))
			}

			if status.CustomMessage != tt.wantStatus.CustomMessage {
				t.Errorf("CustomMessage = %q, want %q", status.CustomMessage, tt.wantStatus.CustomMessage)
			}

			if tt.wantNotification {
				select {
				case got := <-ch:
					if got.CustomMessage != tt.wantStatus.CustomMessage {
						t.Errorf("notified CustomMessage = %q, want %q",
							got.CustomMessage, tt.wantStatus.CustomMessage)
					}

					if !reflect.DeepEqual(got.PresetID, tt.wantStatus.PresetID) {
						t.Errorf("notified PresetID = %q, want %q",
							derefStr(got.PresetID), derefStr(tt.wantStatus.PresetID))
					}
				case <-time.After(100 * time.Millisecond):
					t.Error("expected notification, got none")
				}
			} else {
				select {
				case got := <-ch:
					t.Errorf("should not notify, but got %+v", got)
				case <-time.After(50 * time.Millisecond):
				}
			}
		})
	}
}
