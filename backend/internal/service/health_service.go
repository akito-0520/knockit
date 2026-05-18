package service

import (
	"context"
)

type HealthRepositoryInterface interface {
	PingDB(ctx context.Context) error
}

type HealthService struct {
	healthRepository HealthRepositoryInterface
}

func NewHealthService(healthRepo HealthRepositoryInterface) *HealthService {
	return &HealthService{healthRepository: healthRepo}
}

func (s *HealthService) CheckReadiness(ctx context.Context) error {
	err := s.healthRepository.PingDB(ctx)
	if err != nil {
		return err
	}
	return nil
}
