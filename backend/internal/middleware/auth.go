package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/akito-0520/knockit/pkg/response"
	"github.com/golang-jwt/jwt/v5"
)

type AuthMiddleware struct {
	jwks        *keyfunc.JWKS
	expectedIss string
	expectedAud string
}

func NewAuthMiddleware(supabaseURL string) (*AuthMiddleware, error) {
	jwksURL := supabaseURL + "/auth/v1/.well-known/jwks.json"

	// 公開鍵を取得し、バックグラウンドで自動更新（鍵ローテーション対応）
	jwks, err := keyfunc.Get(jwksURL, keyfunc.Options{
		RefreshInterval:   time.Hour,
		RefreshRateLimit:  5 * time.Minute,
		RefreshTimeout:    10 * time.Second,
		RefreshUnknownKID: true,
		RefreshErrorHandler: func(err error) {
			log.Printf("[auth] JWKS refresh error: %v", err)
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS from %s: %w", jwksURL, err)
	}

	return &AuthMiddleware{
		jwks:        jwks,
		expectedIss: supabaseURL + "/auth/v1",
		expectedAud: "authenticated",
	}, nil
}

type contextKey string

const UserIDKey contextKey = "user_id"

func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")

		if !strings.HasPrefix(authHeader, "Bearer ") {
			response.Error(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// JWKSのkidに対応する公開鍵で検証。
		// iss / aud / exp / alg はパーサ側で同時に検証する。
		// algは非対称署名のみに限定し、"none"やHMACの混入を防ぐ。
		token, err := jwt.Parse(
			tokenString,
			m.jwks.Keyfunc,
			jwt.WithIssuer(m.expectedIss),
			jwt.WithAudience(m.expectedAud),
			jwt.WithExpirationRequired(),
			jwt.WithValidMethods([]string{"ES256", "ES384", "ES512", "RS256", "RS384", "RS512"}),
		)
		if err != nil || !token.Valid {
			log.Printf("[auth] token verification failed: %v", err)
			response.Error(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			response.Error(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			response.Error(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
