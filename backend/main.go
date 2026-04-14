package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	_ "github.com/lib/pq"

	"github.com/akito-0520/knockit/internal/config"
	"github.com/akito-0520/knockit/internal/handler"
	"github.com/akito-0520/knockit/internal/middleware"
	"github.com/akito-0520/knockit/internal/repository"
	"github.com/akito-0520/knockit/internal/service"
)

func main() {
	// 環境変数の取得
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	// DB接続
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// 接続確認
	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	// レポジトリの初期化
	userRepo := repository.NewUserRepository(db)
	statusRepo := repository.NewStatusRepository(db)
	presetRepo := repository.NewPresetRepository(db)

	// サービスの初期化
	authService := service.NewAuthService(userRepo, presetRepo)
	statusService := service.NewStatusService(statusRepo, userRepo)
	presetService := service.NewPresetService(presetRepo)

	// ハンドラーの初期化
	authHandler := handler.NewAuthHandler(authService)
	statusHandler := handler.NewStatusHandler(statusService, presetService)
	presetHandler := handler.NewPresetHandler(presetService)

	// ミドルウェアの初期化
	authMiddleware := middleware.NewAuthMiddleware(cfg.SupabaseJWTSecret)

	// ルーティングの設定
	mux := http.NewServeMux()

	// 認証不要
	mux.HandleFunc("GET /status/{username}", statusHandler.GetPublicStatus)
	mux.HandleFunc("GET /status/{username}/stream", statusHandler.StreamStatus)

	// 認証必要
	auth := authMiddleware.Authenticate
	mux.Handle("POST /auth/setup", auth(http.HandlerFunc(authHandler.SetupUser)))
	mux.Handle("GET /auth/me", auth(http.HandlerFunc(authHandler.GetCurrentUser)))
	mux.Handle("PATCH /auth/me", auth(http.HandlerFunc(authHandler.UpdateUser)))
	mux.Handle("GET /status/me", auth(http.HandlerFunc(statusHandler.GetMyStatus)))
	mux.Handle("PUT /status/me", auth(http.HandlerFunc(statusHandler.UpdateStatus)))
	mux.Handle("GET /presets", auth(http.HandlerFunc(presetHandler.GetUserPresets)))
	mux.Handle("POST /presets", auth(http.HandlerFunc(presetHandler.CreatePreset)))
	mux.Handle("PATCH /presets/{id}", auth(http.HandlerFunc(presetHandler.UpdatePreset)))
	mux.Handle("DELETE /presets/{id}", auth(http.HandlerFunc(presetHandler.DeletePreset)))

	// サーバーの起動
	log.Printf("Server starting on port %d", cfg.Port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", cfg.Port), mux); err != nil {
		log.Fatal(err)
	}
}
