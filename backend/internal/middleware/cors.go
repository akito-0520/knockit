package middleware

import "net/http"

func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// ヘッダーからオリジンを取得
			origin := r.Header.Get("Origin")

			for _, allowed := range allowedOrigins {
				if origin == allowed {
					w.Header().Set("Access-Control-Allow-Origin", origin)                                    // どのオリジンを許可するか
					w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS") // どのメソッドを許可するか
					w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")            // どのヘッダーを許可するか
					break
				}
			}

			// preflight リクエストへの対応
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
