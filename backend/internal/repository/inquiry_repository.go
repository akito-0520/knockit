package repository

import (
	"context"
	"database/sql"

	"github.com/akito-0520/knockit/internal/model"
)

type InquiryRepository struct {
	db *sql.DB
}

func NewInquiryRepository(db *sql.DB) *InquiryRepository {
	return &InquiryRepository{db: db}
}

func (r *InquiryRepository) Create(ctx context.Context, inquiry *model.Inquiry) (*model.Inquiry, error) {
	query := "INSERT INTO inquiries (user_id, category, body, reply_requested, reply_to) VALUES ($1, $2, $3, $4,$5) RETURNING id, created_at"
	err := r.db.QueryRowContext(ctx, query, inquiry.UserID, inquiry.Category, inquiry.Body, inquiry.ReplyRequested, inquiry.ReplyTo).Scan(&inquiry.ID, &inquiry.CreatedAt)
	if err != nil {
		return nil, err
	}
	return inquiry, nil
}
