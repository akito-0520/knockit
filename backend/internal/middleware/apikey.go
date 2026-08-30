package middleware

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/akito-0520/knockit/internal/model"
	"github.com/akito-0520/knockit/pkg/response"
)

const apiKeyHeader = "X-API-Key"

// apiKeyAuthenticator は生キーを検証して user_id を返す。*service.APIKeyService が満たす。
type apiKeyAuthenticator interface {
	Authenticate(ctx context.Context, rawKey string) (string, error)
}

type APIKeyMiddleware struct {
	auth apiKeyAuthenticator
}

func NewAPIKeyMiddleware(auth apiKeyAuthenticator) *APIKeyMiddleware {
	return &APIKeyMiddleware{auth: auth}
}

// EitherAuth は X-API-Key ヘッダがあれば APIキーで検証し（失敗時は即 401、JWT には
// フォールバックしない）、ヘッダが無ければ渡された jwt ミドルウェアに委譲する。
// どちらの経路でも成功時は context に UserIDKey で user_id を詰める。
func (m *APIKeyMiddleware) EitherAuth(jwt func(http.Handler) http.Handler) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		jwtHandler := jwt(next)
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			rawKey := r.Header.Get(apiKeyHeader)
			if rawKey == "" {
				jwtHandler.ServeHTTP(w, r)
				return
			}

			userID, err := m.auth.Authenticate(r.Context(), rawKey)
			if errors.Is(err, model.ErrNotFound) {
				response.Error(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			if err != nil {
				log.Printf("[apikey] authentication error: %v", err)
				response.Error(w, http.StatusInternalServerError, "internal server error")
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
