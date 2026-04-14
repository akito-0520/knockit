package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/akito-0520/knockit/internal/model"
	"github.com/akito-0520/knockit/internal/service"
	"github.com/akito-0520/knockit/pkg/response"
)

type PresetHandler struct {
	presetService *service.PresetService
}

func NewPresetHandler(presetService *service.PresetService) *PresetHandler {
	return &PresetHandler{presetService: presetService}
}

func (h *PresetHandler) GetUserPresets(w http.ResponseWriter, r *http.Request) {
	// 認証確認
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// ユーザーのプリセットをUserIDから取得
	presets, err := h.presetService.GetUserPresets(r.Context(), userID)
	if err != nil {

		response.Error(w, http.StatusInternalServerError, "internal server error")
		return
	}

	// プリセットを成形
	var presetRes []model.PresetResponse
	for _, p := range presets {
		presetRes = append(presetRes, p.ToResponse())
	}

	// パーズしてレスポンスを返す
	response.JSON(w, http.StatusOK, presetRes)
}

func (h *PresetHandler) CreatePreset(w http.ResponseWriter, r *http.Request) {
	// 認証確認
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// jsonをデコード
	var req model.CreatePresetRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// presetの作成
	preset, err := h.presetService.CreatePreset(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrValidation):
			response.Error(w, http.StatusBadRequest, "validation error")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	// パーズしてレスポンスを返す
	response.JSON(w, http.StatusCreated, preset.ToResponse())
}

func (h *PresetHandler) UpdatePreset(w http.ResponseWriter, r *http.Request) {
	// パスからプリセットIDを取得
	id := r.PathValue("id")

	// 認証確認
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// jsonをデコード
	var req model.UpdatePresetRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// プリセットを更新
	preset, err := h.presetService.UpdatePreset(r.Context(), userID, id, req)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrValidation):
			response.Error(w, http.StatusBadRequest, "validation error")
		case errors.Is(err, model.ErrNotFound):
			response.Error(w, http.StatusNotFound, "preset not found")
		case errors.Is(err, model.ErrForbidden):
			response.Error(w, http.StatusForbidden, "forbidden")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	// パーズしてレスポンスを返す
	response.JSON(w, http.StatusOK, preset.ToResponse())
}

func (h *PresetHandler) DeletePreset(w http.ResponseWriter, r *http.Request) {
	// パスからプリセットIDを取得
	id := r.PathValue("id")

	// 認証確認
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// プリセットを削除
	err := h.presetService.DeletePreset(r.Context(), userID, id)
	if err != nil {

		switch {
		case errors.Is(err, model.ErrNotFound):
			response.Error(w, http.StatusNotFound, "preset not found")
		case errors.Is(err, model.ErrForbidden):
			response.Error(w, http.StatusForbidden, "forbidden")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return

	}

	// レスポンスを返す
	response.NoContent(w)
}
