package config

import (
	"errors"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           int
	DatabaseURL    string
	SupabaseURL    string
	AllowedOrigins []string
	Environment    string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	portStr := os.Getenv("PORT")
	if portStr == "" {
		portStr = "8080"
	}

	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, err
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, errors.New("DATABASE_URL is required")
	}

	supabaseURL := strings.TrimRight(os.Getenv("SUPABASE_URL"), "/")
	if supabaseURL == "" {
		return nil, errors.New("SUPABASE_URL is required")
	}

	allowedOriginsStr := os.Getenv("ALLOWED_ORIGINS")
	allowedOrigins := make([]string, 0)
	if allowedOriginsStr != "" {
		allowedOrigins = strings.Split(allowedOriginsStr, ",")
	}

	environment := os.Getenv("ENVIRONMENT")
	if environment == "" {
		environment = "development"
	}

	return &Config{
		Port:           port,
		DatabaseURL:    databaseURL,
		SupabaseURL:    supabaseURL,
		AllowedOrigins: allowedOrigins,
		Environment:    environment,
	}, nil
}
