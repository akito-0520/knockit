package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/akito-0520/knockit/internal/model"
	"github.com/akito-0520/knockit/internal/service"
	"github.com/akito-0520/knockit/pkg/response"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

type contextKey string

const UserIDKey contextKey = "user_id"

func (h *AuthHandler) SetupUser(w http.ResponseWriter, r *http.Request) {
	// 認証確認
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// jsonをデコード
	var req model.UserSetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// ユーザーを作成
	user, err := h.authService.SetupUser(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrAlreadyExists):
			response.Error(w, http.StatusConflict, "username already exists")
		case errors.Is(err, model.ErrValidation):
			response.Error(w, http.StatusBadRequest, "validation error")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	// パーズしてレスポンスを返す
	response.JSON(w, http.StatusCreated, user.ToResponse())
}

func (h *AuthHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	// 認証確認
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// ユーザー情報を取得
	user, err := h.authService.GetCurrentUser(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrNotFound):
			response.Error(w, http.StatusNotFound, "user not found")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	// パーズしてレスポンスを返す
	response.JSON(w, http.StatusOK, user.ToResponse())
}

func (h *AuthHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	// 認証確認
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// jsonをデコード
	var req model.UserUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// ユーザー情報を更新
	user, err := h.authService.UpdateUser(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrValidation):
			response.Error(w, http.StatusBadRequest, "validation error")
		case errors.Is(err, model.ErrNotFound):
			response.Error(w, http.StatusNotFound, "user not found")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	// パーズしてレスポンスを返す
	response.JSON(w, http.StatusOK, user.ToResponse())
}
