package repository

import (
	"context"
	"database/sql"

	"github.com/akito-0520/knockit/internal/model"
)

type StatusRepository struct {
	db *sql.DB
}

func NewStatusRepository(db *sql.DB) *StatusRepository {
	return &StatusRepository{db: db}
}

func (r *StatusRepository) FindByUserID(ctx context.Context, userID string) (*model.RoomStatus, error) {
	var s model.RoomStatus
	query := "SELECT id, user_id, preset_id, custom_message, updated_at FROM room_statuses WHERE user_id = $1"
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&s.ID, &s.UserID, &s.PresetID, &s.CustomMessage, &s.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *StatusRepository) Upsert(ctx context.Context, status *model.RoomStatus) error {
	query := `
	INSERT INTO room_statuses (user_id, preset_id, custom_message, updated_at)
	VALUES ($1, $2, $3, $4)
	ON CONFLICT (user_id)
	DO UPDATE SET preset_id = $2, custom_message = $3, updated_at = $4`
	_, err := r.db.ExecContext(ctx, query, status.UserID, status.PresetID, status.CustomMessage, status.UpdatedAt)
	if err != nil {
		return err
	}
	return nil
}
