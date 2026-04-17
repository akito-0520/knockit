package response

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/akito-0520/knockit/internal/model"
)

type response struct {
	Success bool                    `json:"success"`
	Data    interface{}             `json:"data,omitempty"`
	Error   string                  `json:"error,omitempty"`
	Details []model.ValidationError `json:"details,omitempty"`
}

func JSON(w http.ResponseWriter, status int, data interface{}) {
	// レスポンスヘッダーを設定
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// ステータスコードを設定
	w.WriteHeader(status)

	// response構造体を用いて JSONエンコード
	if err := json.NewEncoder(w).Encode(response{
		Success: true,
		Data:    data,
	}); err != nil {
		log.Printf("JSON encode error: %v", err)
	}
}

func Error(w http.ResponseWriter, status int, message string) {
	// レスポンスヘッダーを設定
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// ステータスコードを設定
	w.WriteHeader(status)

	// response構造体を用いて JSONエンコード
	if err := json.NewEncoder(w).Encode(response{
		Success: false,
		Error:   message,
	}); err != nil {
		log.Printf("JSON encode error: %v", err)
	}
}

func ValidationErrors(w http.ResponseWriter, errs []model.ValidationError) {
	// レスポンスヘッダーを設定
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// ステータスコードを設定
	w.WriteHeader(400)

	// response構造体を用いて JSONエンコード
	if err := json.NewEncoder(w).Encode(response{
		Success: false,
		Error:   "validation error",
		Details: errs,
	}); err != nil {
		log.Printf("JSON encode error: %v", err)
	}
}

func NoContent(w http.ResponseWriter) {
	// ステータスコードを設定
	w.WriteHeader(204)
}
