package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/akito-0520/knockit/internal/middleware"
	"github.com/akito-0520/knockit/internal/model"
	"github.com/akito-0520/knockit/internal/service"
	"github.com/akito-0520/knockit/pkg/response"
)

type InquiryHandler struct {
	inquiryService *service.InquiryService
}

func NewInquiryHandler(inquiryService *service.InquiryService) *InquiryHandler {
	return &InquiryHandler{inquiryService: inquiryService}
}

func (h *InquiryHandler) CreateInquiry(w http.ResponseWriter, r *http.Request) {
	// 認証確認
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// json デコード
	var req model.CreateInquiryRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// inquiry の作成
	res, err := h.inquiryService.CreateInquiry(r.Context(), userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrValidation):
			response.Error(w, http.StatusBadRequest, "validation error")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	response.JSON(w, http.StatusOK, res.ToResponse())
}
