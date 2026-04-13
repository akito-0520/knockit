package model

import "time"

type Preset struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	Label        string    `json:"label"`
	Color        string    `json:"color"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreatePresetRequest struct {
	Label        string `json:"label"`
	Color        string `json:"color"`
	DisplayOrder int    `json:"display_order"`
}

type UpdatePresetRequest struct {
	Label        string `json:"label"`
	Color        string `json:"color"`
	DisplayOrder int    `json:"display_order"`
}

type PresetResponse struct {
	ID           string `json:"id"`
	Label        string `json:"label"`
	Color        string `json:"color"`
	DisplayOrder int    `json:"display_order"`
}

func (p *Preset) ToResponse() PresetResponse {
	return PresetResponse{
		ID:           p.ID,
		Label:        p.Label,
		Color:        p.Color,
		DisplayOrder: p.DisplayOrder,
	}
}
