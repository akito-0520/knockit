package service

import (
	"context"
	"errors"
	"testing"
)

// ---------- Health Repository のモック ---------------

type mockHealthRepository struct {
	pingDBFunc func(ctx context.Context) error
}

func (m *mockHealthRepository) PingDB(ctx context.Context) error {
	return m.pingDBFunc(ctx)
}

func TestCheckReadiness(t *testing.T) {
	dbErr := errors.New("connection timeout")

	tests := []struct {
		name       string
		pingDBFunc func(ctx context.Context) error
		wantErr    error
	}{
		{
			name:       "正常系",
			pingDBFunc: func(ctx context.Context) error { return nil },
			wantErr:    nil,
		},
		{
			name:       "異常系: DB 接続エラー",
			pingDBFunc: func(ctx context.Context) error { return dbErr },
			wantErr:    dbErr,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			healthMock := &mockHealthRepository{pingDBFunc: tt.pingDBFunc}
			healthService := NewHealthService(healthMock)

			err := healthService.CheckReadiness(context.Background())

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
