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

type StatusHandler struct {
	statusService *service.StatusService
	presetService *service.PresetService
}

func NewStatusHandler(statusService *service.StatusService, presetService *service.PresetService) *StatusHandler {
	return &StatusHandler{
		statusService: statusService,
		presetService: presetService,
	}
}

func (h *StatusHandler) GetPublicStatus(w http.ResponseWriter, r *http.Request) {
	// パスからユーザー名を取得
	username := r.PathValue("username")

	// ユーザー名から公開ステータスを取得
	status, user, err := h.statusService.GetStatusByUsername(r.Context(), username)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrNotFound):
			response.Error(w, http.StatusNotFound, "status not found")
		case errors.Is(err, model.ErrValidation):
			response.Error(w, http.StatusBadRequest, "invalid username")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	// プリセットIDからプリセット情報を取得
	var preset *model.Preset
	if status.PresetID != nil && *status.PresetID != "" {
		preset, err = h.presetService.GetPresetByID(r.Context(), *status.PresetID)
		if err != nil {
			switch {
			case errors.Is(err, model.ErrNotFound):
				response.Error(w, http.StatusNotFound, "preset not found")
			default:
				response.Error(w, http.StatusInternalServerError, "internal server error")
			}
			return
		}

	}

	// ステータスレスポンスを組み立てる
	res := model.StatusResponse{
		DisplayName:   user.DisplayName,
		CustomMessage: status.CustomMessage,
	}
	if preset != nil {
		res.Preset = *preset
	}

	// パーズしてレスポンスを返す
	response.JSON(w, http.StatusOK, res)
}

func (h *StatusHandler) GetMyStatus(w http.ResponseWriter, r *http.Request) {
	// 認証確認
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// ユーザーIDからステータスを取得
	status, err := h.statusService.GetMyStatus(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrNotFound):
			response.Error(w, http.StatusNotFound, "status not found")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	// ユーザー情報の取得
	user, err := h.statusService.GetUserByID(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrNotFound):
			response.Error(w, http.StatusNotFound, "user not found")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	// プリセットIDからプリセット情報を取得
	var preset *model.Preset
	if status.PresetID != nil && *status.PresetID != "" {
		preset, err = h.presetService.GetPresetByID(r.Context(), *status.PresetID)
		if err != nil {
			switch {
			case errors.Is(err, model.ErrNotFound):
				response.Error(w, http.StatusNotFound, "preset not found")
			default:
				response.Error(w, http.StatusInternalServerError, "internal server error")
			}
			return
		}
	}

	// ステータスレスポンスを組み立てる
	res := model.StatusResponse{
		DisplayName:   user.DisplayName,
		CustomMessage: status.CustomMessage,
	}
	if preset != nil {
		res.Preset = *preset
	}

	// パーズしてレスポンスを返す
	response.JSON(w, http.StatusOK, res)
}

func (h *StatusHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	// 認証確認
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// jsonをデコード
	var req model.StatusUpdateRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// ステータス情報を更新
	status, err := h.statusService.UpdateStatus(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrValidation):
			response.Error(w, http.StatusBadRequest, "validation error")
		case errors.Is(err, model.ErrNotFound):
			response.Error(w, http.StatusNotFound, "status not found")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	// ユーザー情報の取得
	user, err := h.statusService.GetUserByID(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrNotFound):
			response.Error(w, http.StatusNotFound, "user not found")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	// プリセットIDからプリセット情報を取得
	var preset *model.Preset
	if status.PresetID != nil && *status.PresetID != "" {
		preset, err = h.presetService.GetPresetByID(r.Context(), *status.PresetID)
		if err != nil {
			switch {
			case errors.Is(err, model.ErrNotFound):
				response.Error(w, http.StatusNotFound, "preset not found")
			default:
				response.Error(w, http.StatusInternalServerError, "internal server error")
			}
			return
		}
	}

	// ステータスレスポンスを組み立てる
	res := model.StatusResponse{
		DisplayName:   user.DisplayName,
		CustomMessage: status.CustomMessage,
	}
	if preset != nil {
		res.Preset = *preset
	}

	// パーズしてレスポンスを返す
	response.JSON(w, http.StatusOK, res)
}
