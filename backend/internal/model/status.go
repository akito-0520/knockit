package model

import "time"

type RoomStatus struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	PresetID      string    `json:"preset_id"`
	CustomMessage string    `json:"custom_message"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type StatusUpdateRequest struct {
	PresetID      string `json:"preset_id"`
	CustomMessage string `json:"custom_message"`
}

type StatusResponse struct {
	DisplayName   string `json:"display_name"`
	Preset        Preset `json:"preset"`
	CustomMessage string `json:"custom_message"`
}
