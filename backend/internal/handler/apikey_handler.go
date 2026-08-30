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

type APIKeyHandler struct {
	apiKeyService *service.APIKeyService
}

func NewAPIKeyHandler(apiKeyService *service.APIKeyService) *APIKeyHandler {
	return &APIKeyHandler{apiKeyService: apiKeyService}
}

func (h *APIKeyHandler) ListAPIKeys(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	keys, err := h.apiKeyService.GetUserAPIKeys(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "internal server error")
		return
	}

	res := make([]model.APIKeyResponse, 0, len(keys))
	for i := range keys {
		res = append(res, keys[i].ToResponse())
	}

	response.JSON(w, http.StatusOK, res)
}

func (h *APIKeyHandler) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req model.CreateAPIKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	created, err := h.apiKeyService.CreateAPIKey(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrAlreadyExists):
			response.Error(w, http.StatusConflict, "label already in use")
		case errors.Is(err, model.ErrValidation):
			response.Error(w, http.StatusBadRequest, "validation error")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	response.JSON(w, http.StatusCreated, created)
}

func (h *APIKeyHandler) DeleteAPIKey(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	err := h.apiKeyService.DeleteAPIKey(r.Context(), userID, id)
	if err != nil {
		switch {
		case errors.Is(err, model.ErrNotFound):
			response.Error(w, http.StatusNotFound, "api key not found")
		case errors.Is(err, model.ErrForbidden):
			response.Error(w, http.StatusForbidden, "forbidden")
		default:
			response.Error(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	response.NoContent(w)
}
