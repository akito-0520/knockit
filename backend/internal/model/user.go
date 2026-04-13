package model

import "time"

type User struct {
	ID          string    `json:"id"` // Supabase OAuth UUID
	Username    string    `json:"username"`
	DisplayName string    `json:"display_name"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UserSetupRequest struct {
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
}

type UserUpdateRequest struct {
	DisplayName string `json:"display_name"`
}

type UserResponse struct {
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		Username:    u.Username,
		DisplayName: u.DisplayName,
	}
}
