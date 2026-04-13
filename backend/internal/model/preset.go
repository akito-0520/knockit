package model

type Preset struct {
	ID           string `json:"id"`
	Label        string `json:"label"`
	Color        string `json:"color"`
	DisplayOrder int    `json:"display_order"`
}

type CreatePresetRequest struct {
	Label        string `json:"label"`
	Color        string `json:"color"`
	DisplayOrder int    `json:"display_order"`
}

type PresetResponse struct {
	Label        string `json:"label"`
	Color        string `json:"color"`
	DisplayOrder int    `json:"display_order"`
}

func (p *Preset) ToResponse() PresetResponse {
	return PresetResponse{
		Label:        p.Label,
		Color:        p.Color,
		DisplayOrder: p.DisplayOrder,
	}
}
