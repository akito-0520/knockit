type PresetResponse = {
  id: string;
  label: string;
  color: string;
  displayOrder: number;
};

type CreatePresetRequest = {
  label: string;
  color: string;
  displayOrder: number;
};

type UpdatePresetRequest = {
  label: string;
  color: string;
  displayOrder: number;
};

export type { PresetResponse, CreatePresetRequest, UpdatePresetRequest };
