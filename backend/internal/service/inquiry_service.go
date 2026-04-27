package service

import (
	"context"

	"github.com/akito-0520/knockit/internal/model"
	"github.com/akito-0520/knockit/internal/repository"
	"github.com/akito-0520/knockit/internal/validator"
)

type InquiryService struct {
	InquiryRepository *repository.InquiryRepository
}

func NewInquiryRepository(InquiryRepo *repository.InquiryRepository) *InquiryService {
	return &InquiryService{InquiryRepository: InquiryRepo}
}

func (s *InquiryService) CreateInquiry(ctx context.Context, userID string, req *model.CreateInquiryRequest) (*model.Inquiry, error) {
	// バリデーションチェック
	errs := validator.ValidateInquiryFields(req)
	if len(errs) > 0 {
		return nil, model.ErrValidation
	}

	// 作成する問い合わせのセット
	inquiry := &model.Inquiry{
		UserID:         &userID,
		Category:       req.Category,
		Body:           req.Body,
		ReplyRequested: req.ReplyRequested,
		ReplyTo:        req.ReplyTo,
	}

	// 問い合わせの作成
	res, err := s.InquiryRepository.Create(ctx, inquiry)
	if err != nil {
		return nil, err
	}

	return res, nil
}
