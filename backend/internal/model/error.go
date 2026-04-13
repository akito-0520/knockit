package model

import "errors"

var (
	ErrNotFound      = errors.New("not found")
	ErrAlreadyExists = errors.New("already exists")
	ErrUnauthorized  = errors.New("unauthorized error")
	ErrForbidden     = errors.New("forbidden error")
	ErrValidation    = errors.New("validation error")
	ErrInternal      = errors.New("internal error")
)

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}
