package service

import (
	"context"

	"github.com/akito-0520/knockit/internal/repository"
)

type HealthService struct {
	healthRepository *repository.HealthRepository
}

func NewHealthService(healthRepo *repository.HealthRepository) *HealthService {
	return &HealthService{healthRepository: healthRepo}
}

func (s *HealthService) CheckReadiness(ctx context.Context) error {
	err := s.healthRepository.PingDB(ctx)
	if err != nil {
		return err
	}
	return nil
}
