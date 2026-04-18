package repository

import (
	"context"
	"database/sql"
)

type HealthRepository struct {
	db *sql.DB
}

func NewHealthRepository(db *sql.DB) *HealthRepository {
	return &HealthRepository{db: db}
}

func (r *HealthRepository) PingDB(ctx context.Context) error {
	err := r.db.PingContext(ctx)
	if err != nil {
		return err
	}
	return nil
}
