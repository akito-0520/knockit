package middleware

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/akito-0520/knockit/internal/model"
)

type stubAuthenticator struct {
	userID string
	err    error
	calls  int
}

func (s *stubAuthenticator) Authenticate(ctx context.Context, rawKey string) (string, error) {
	s.calls++
	return s.userID, s.err
}

func TestEitherAuth(t *testing.T) {
	newNext := func(gotUserID *string, called *bool) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			*called = true
			if v, ok := r.Context().Value(UserIDKey).(string); ok {
				*gotUserID = v
			}
			w.WriteHeader(http.StatusOK)
		})
	}

	// X-API-Key が無いときに呼ばれる JWT ミドルウェアのスタブ
	newJWTStub := func(called *bool) func(http.Handler) http.Handler {
		return func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				*called = true
				w.WriteHeader(http.StatusTeapot) // 呼ばれたことが分かる目印
			})
		}
	}

	t.Run("有効なキー → next が UserIDKey 付きで呼ばれる", func(t *testing.T) {
		var nextCalled, jwtCalled bool
		var gotUserID string

		m := NewAPIKeyMiddleware(&stubAuthenticator{userID: "user-42"})
		h := m.EitherAuth(newJWTStub(&jwtCalled))(newNext(&gotUserID, &nextCalled))

		req := httptest.NewRequest(http.MethodPut, "/status/me", nil)
		req.Header.Set("X-API-Key", "knk_valid")
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("status = %d, want 200", rr.Code)
		}
		if !nextCalled {
			t.Error("next handler was not called")
		}
		if jwtCalled {
			t.Error("jwt middleware should not be called when X-API-Key is present")
		}
		if gotUserID != "user-42" {
			t.Errorf("UserIDKey = %q, want %q", gotUserID, "user-42")
		}
	})

	t.Run("未知のキー → 401、next も jwt も呼ばれない", func(t *testing.T) {
		var nextCalled, jwtCalled bool
		var gotUserID string

		m := NewAPIKeyMiddleware(&stubAuthenticator{err: model.ErrNotFound})
		h := m.EitherAuth(newJWTStub(&jwtCalled))(newNext(&gotUserID, &nextCalled))

		req := httptest.NewRequest(http.MethodPut, "/status/me", nil)
		req.Header.Set("X-API-Key", "knk_unknown")
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		if rr.Code != http.StatusUnauthorized {
			t.Errorf("status = %d, want 401", rr.Code)
		}
		if nextCalled || jwtCalled {
			t.Error("no downstream handler should be called on invalid key")
		}
	})

	t.Run("認証時の予期しないエラー → 500", func(t *testing.T) {
		var nextCalled, jwtCalled bool
		var gotUserID string

		m := NewAPIKeyMiddleware(&stubAuthenticator{err: errors.New("db down")})
		h := m.EitherAuth(newJWTStub(&jwtCalled))(newNext(&gotUserID, &nextCalled))

		req := httptest.NewRequest(http.MethodPut, "/status/me", nil)
		req.Header.Set("X-API-Key", "knk_x")
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Errorf("status = %d, want 500", rr.Code)
		}
		if nextCalled {
			t.Error("next should not be called on error")
		}
	})

	t.Run("X-API-Key 無し → jwt ミドルウェアに委譲", func(t *testing.T) {
		var nextCalled, jwtCalled bool
		var gotUserID string

		stub := &stubAuthenticator{userID: "should-not-matter"}
		m := NewAPIKeyMiddleware(stub)
		h := m.EitherAuth(newJWTStub(&jwtCalled))(newNext(&gotUserID, &nextCalled))

		req := httptest.NewRequest(http.MethodPut, "/status/me", nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		if !jwtCalled {
			t.Error("jwt middleware should be called when X-API-Key is absent")
		}
		if rr.Code != http.StatusTeapot {
			t.Errorf("status = %d, want 418 (jwt stub marker)", rr.Code)
		}
		if stub.calls != 0 {
			t.Error("api key authenticator should not be called without X-API-Key")
		}
	})
}
