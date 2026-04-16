package service

import (
	"context"
	"sync"
	"time"

	"github.com/akito-0520/knockit/internal/model"
	"github.com/akito-0520/knockit/internal/repository"
	"github.com/akito-0520/knockit/internal/validator"
)

type StatusService struct {
	userRepository   *repository.UserRepository
	statusRepository *repository.StatusRepository

	clients map[string][]chan *model.RoomStatus // userID → チャネルのリスト作成
	mu      sync.RWMutex                        // 並行アクセスの保護
}

func NewStatusService(statusRepo *repository.StatusRepository, userRepo *repository.UserRepository) *StatusService {
	return &StatusService{
		statusRepository: statusRepo,
		userRepository:   userRepo,

		clients: make(map[string][]chan *model.RoomStatus),
	}
}

func (s *StatusService) GetStatusByUsername(ctx context.Context, username string) (*model.RoomStatus, *model.User, error) {
	// バリデーション
	errs := validator.ValidateUsername(username)
	if len(errs) > 0 {
		return nil, nil, model.ErrValidation
	}

	// ユーザーネームからユーザー情報を取得
	user, err := s.userRepository.FindByUsername(ctx, username)
	if err != nil {
		return nil, nil, err
	}

	// ユーザーIDからステータスを取得
	status, err := s.statusRepository.FindByUserID(ctx, user.ID)
	if err != nil {
		return nil, nil, err
	}

	return status, user, nil
}

func (s *StatusService) GetUserByID(ctx context.Context, userID string) (*model.User, error) {
	return s.userRepository.FindByID(ctx, userID)
}

func (s *StatusService) GetMyStatus(ctx context.Context, userID string) (*model.RoomStatus, error) {
	// ユーザーIDからステータス情報を取得
	status, err := s.statusRepository.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return status, nil
}

func (s *StatusService) UpdateStatus(ctx context.Context, userID string, req model.StatusUpdateRequest) (*model.RoomStatus, error) {
	// バリデーション
	errs := validator.ValidateStatusUpdate(req)
	if len(errs) > 0 {
		return nil, model.ErrValidation
	}

	// `PresetID`, `CustomMessage` の更新
	status := &model.RoomStatus{
		UserID:        userID,
		PresetID:      req.PresetID,
		CustomMessage: req.CustomMessage,
		UpdatedAt:     time.Now(),
	}

	// ステータスの更新
	err := s.statusRepository.Upsert(ctx, status)
	if err != nil {
		return nil, err
	}

	s.notifyClients(userID, status)

	return status, nil
}

func (s *StatusService) Subscribe(userID string) chan *model.RoomStatus {
	ch := make(chan *model.RoomStatus, 10) // バッファ付きチャネルの作成

	s.mu.Lock()         // 書き込みロック
	defer s.mu.Unlock() // アンロック
	s.clients[userID] = append(s.clients[userID], ch)

	return ch
}

func (s *StatusService) Unsubscribe(userID string, ch chan *model.RoomStatus) {
	s.mu.Lock()         // 書き込みロック
	defer s.mu.Unlock() // アンロック

	clients := s.clients[userID]
	for i, c := range clients {
		if c == ch {
			s.clients[userID] = append(clients[:i], clients[i+1:]...)
			break
		}
	}
	close(ch)
}

func (s *StatusService) notifyClients(userID string, status *model.RoomStatus) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, ch := range s.clients[userID] {
		// `ch` に `status` を送る
		select {
		case ch <- status:
		default: // チャネルがいっぱいならスキップ
		}
	}
}
