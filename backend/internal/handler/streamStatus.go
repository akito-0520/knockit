package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/akito-0520/knockit/internal/model"
	"github.com/akito-0520/knockit/pkg/response"
)

func (h *StatusHandler) StreamStatus(w http.ResponseWriter, r *http.Request) {
	// パスからユーザー名を取得
	username := r.PathValue("username")

	// SSE用のヘッダーをセット
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// ステータス情報の取得
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

	// チャネルを取得
	ch := h.statusService.Subscribe(status.UserID)
	defer h.statusService.Unsubscribe(status.UserID, ch)

	// クライアントが切断したら終了，データが来たら送信
	for {
		select {
		case <-r.Context().Done(): // クライアント切断
			return

		case status := <-ch: // ステータス更新
			// プリセットIDからプリセット情報を取得
			var preset *model.Preset
			if status.PresetID != "" {
				preset, err = h.presetService.GetPresetByID(r.Context(), status.PresetID)
				if err != nil {
					continue
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

			data, _ := json.Marshal(res)
			fmt.Fprintf(w, "data: %s\n\n", data)
			w.(http.Flusher).Flush()
		}
	}
}
