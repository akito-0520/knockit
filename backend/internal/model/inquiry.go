package model

import "time"

type InquiryCategory string

const (
	InquiryCategoryBug     InquiryCategory = "bug"
	InquiryCategoryFeature InquiryCategory = "feature"
	InquiryCategoryOther   InquiryCategory = "other"
)

func (c InquiryCategory) Valid() bool {
	switch c {
	case InquiryCategoryBug, InquiryCategoryFeature, InquiryCategoryOther:
		return true
	}
	return false
}

type Inquiry struct {
	ID             string          `json:"id"`
	UserID         *string         `json:"user_id"`
	Category       InquiryCategory `json:"category"`
	Body           string          `json:"body"`
	ReplyRequested bool            `json:"reply_requested"`
	ReplyTo        *string         `json:"reply_to"`
	CreatedAt      time.Time       `json:"created_at"`
}

type CreateInquiryRequest struct {
	UserID         string          `json:"user_id"`
	Category       InquiryCategory `json:"category"`
	Body           string          `json:"body"`
	ReplyRequested bool            `json:"reply_requested"`
	ReplyTo        *string         `json:"reply_to"`
}

type InquiryResponse struct {
	ID             string          `json:"id"`
	Category       InquiryCategory `json:"category"`
	Body           string          `json:"body"`
	ReplyRequested bool            `json:"reply_requested"`
	ReplyTo        *string         `json:"reply_to"`
	CreatedAt      time.Time       `json:"created_at"`
}

func (i *Inquiry) ToResponse() InquiryResponse {
	return InquiryResponse{
		ID:             i.ID,
		Category:       i.Category,
		Body:           i.Body,
		ReplyRequested: i.ReplyRequested,
		ReplyTo:        i.ReplyTo,
		CreatedAt:      i.CreatedAt,
	}
}
