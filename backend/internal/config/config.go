package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port              int
	DatabaseURL       string
	SupabaseJWTSecret string
	AllowedOrigins    []string
	Environment       string
}

func Load() (*Config, error) {
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

	supabaseJWTSecret := os.Getenv("SUPABASE_JWT_SECRET")
	if supabaseJWTSecret == "" {
		return nil, errors.New("SUPABASE_JWT_SECRET is required")
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
		Port:              port,
		DatabaseURL:       databaseURL,
		SupabaseJWTSecret: supabaseJWTSecret,
		AllowedOrigins:    allowedOrigins,
		Environment:       environment,
	}, nil
}
