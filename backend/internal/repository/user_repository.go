package repository

import (
	"context"
	"database/sql"

	"github.com/akito-0520/knockit/internal/model"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*model.User, error) {
	var u model.User
	query := "SELECT id, username, display_name, created_at, updated_at FROM users WHERE id = $1"
	err := r.db.QueryRowContext(ctx, query, id).Scan(&u.ID, &u.Username, &u.DisplayName, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*model.User, error) {
	var u model.User
	query := "SELECT id, username, display_name, created_at, updated_at FROM users WHERE username = $1"
	err := r.db.QueryRowContext(ctx, query, username).Scan(&u.ID, &u.Username, &u.DisplayName, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) ExistsByUsername(ctx context.Context, username string) (bool, error) {
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)"
	err := r.db.QueryRowContext(ctx, query, username).Scan(&exists)
	if err != nil {
		return exists, err
	}
	return exists, nil
}

func (r *UserRepository) Create(ctx context.Context, user *model.User) error {
	query := "INSERT INTO users (id, username, display_name) VALUES ($1, $2, $3) RETURNING created_at, updated_at"
	err := r.db.QueryRowContext(ctx, query, user.ID, user.Username, user.DisplayName).Scan(&user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return err
	}
	return nil
}

func (r *UserRepository) Update(ctx context.Context, user *model.User) error {
	query := "UPDATE users SET username = $1, display_name = $2, updated_at = $3 WHERE id = $4"
	result, err := r.db.ExecContext(ctx, query, user.Username, user.DisplayName, user.UpdatedAt, user.ID)
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
