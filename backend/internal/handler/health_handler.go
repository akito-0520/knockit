package handler

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/akito-0520/knockit/internal/service"
)

type healthHandler struct {
	healthService *service.HealthService
}

func NewHealthHandler(healthService *service.HealthService) *healthHandler {
	return &healthHandler{healthService: healthService}
}

func (h *healthHandler) Live(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte(`{"status":"ok"}`)); err != nil {
		log.Printf("liveness write failed: %v", err)
	}
}

func (h *healthHandler) Ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := h.healthService.CheckReadiness(ctx); err != nil {
		log.Printf("readiness failed: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		if _, err = w.Write([]byte(`{"status":"unavailable"}`)); err != nil {
			log.Printf("readiness body write failed: %v", err)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte(`{"status":"ok"}`)); err != nil {
		log.Printf("readiness write failed: %v", err)
	}
}
