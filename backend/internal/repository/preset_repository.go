package repository

import (
	"context"
	"database/sql"

	"github.com/akito-0520/knockit/internal/model"
)

// データベース接続のポインタ．この接続を使ってSQLを実行．
type PresetRepository struct {
	db *sql.DB
}

// デフォルトのプリセット定義
type defaultPreset struct {
	Label        string
	Color        string
	DisplayOrder int
}

var defaultPresets = []defaultPreset{
	{"面接中", "#EF4444", 1},
	{"会議中", "#F59E0B", 2},
	{"勉強中", "#3B82F6", 3},
	{"作業中", "#8B5CF6", 4},
	{"電話中", "#EC4899", 5},
	{"入室OK", "#10B981", 6},
}

// コントラクタ関数: DB接続を1度作ってそれをリポジトリに渡す（依存性の注入）．
func NewPresetRepository(db *sql.DB) *PresetRepository {
	return &PresetRepository{db: db}
}

func (r *PresetRepository) FindByUserID(ctx context.Context, userId string) ([]model.Preset, error) {
	query := "SELECT id, user_id, label, color, display_order, created_at, updated_at FROM presets WHERE user_id = $1 ORDER BY display_order ASC"
	rows, err := r.db.QueryContext(ctx, query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var presets []model.Preset
	for rows.Next() {
		var p model.Preset
		if err := rows.Scan(&p.ID, &p.UserID, &p.Label, &p.Color, &p.DisplayOrder, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		presets = append(presets, p)

	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return presets, nil
}

func (r *PresetRepository) FindByID(ctx context.Context, id string) (*model.Preset, error) {
	var p model.Preset
	query := "SELECT id, user_id, label, color, display_order, created_at, updated_at FROM presets WHERE id = $1"
	err := r.db.QueryRowContext(ctx, query, id).Scan(&p.ID, &p.UserID, &p.Label, &p.Color, &p.DisplayOrder, &p.CreatedAt, &p.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrNotFound
	}

	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PresetRepository) Create(ctx context.Context, preset *model.Preset) error {
	query := "INSERT INTO presets (user_id, label, color, display_order) VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at"
	err := r.db.QueryRowContext(ctx, query, preset.UserID, preset.Label, preset.Color, preset.DisplayOrder).Scan(&preset.ID, &preset.CreatedAt, &preset.UpdatedAt)
	if err != nil {
		return err
	}
	return nil
}

func (r *PresetRepository) Update(ctx context.Context, preset *model.Preset) error {
	query := "UPDATE presets SET label = $1, color = $2, display_order = $3, updated_at = $4 WHERE id = $5"
	result, err := r.db.ExecContext(ctx, query, preset.Label, preset.Color, preset.DisplayOrder, preset.UpdatedAt, preset.ID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return model.ErrNotFound
	}
	return nil
}

func (r *PresetRepository) Delete(ctx context.Context, id string) error {
	query := "DELETE FROM presets WHERE id = $1"
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return model.ErrNotFound
	}
	return nil
}

func (r *PresetRepository) CreateDefaultPresets(ctx context.Context, userID string) error {
	for _, dp := range defaultPresets {
		preset := &model.Preset{
			UserID:       userID,
			Label:        dp.Label,
			Color:        dp.Color,
			DisplayOrder: dp.DisplayOrder,
		}
		if err := r.Create(ctx, preset); err != nil {
			return err
		}
	}
	return nil
}
