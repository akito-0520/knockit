package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/akito-0520/knockit/pkg/response"
	"github.com/golang-jwt/jwt/v5"
)

type AuthMiddleware struct {
	jwtSecret string
}

func NewAuthMiddleware(jwtSecret string) *AuthMiddleware {
	return &AuthMiddleware{jwtSecret: jwtSecret}
}

type contextKey string

const UserIDKey contextKey = "user_id"

func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// ヘッダーからJWTトークンを取得
		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			response.Error(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// JWT認証
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(m.jwtSecret), nil
		})
		if err != nil || !token.Valid {
			response.Error(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		// クレーム層の取得
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			response.Error(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		// subフィールドに格納されているユーザーIDを取得
		userID, ok := claims["sub"].(string)
		if !ok {
			response.Error(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		// contextに `UserIDkey` としてユーザーIDを格納
		ctx := context.WithValue(r.Context(), UserIDKey, userID)

		// httpを返す
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
