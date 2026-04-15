import {
  CreatePresetRequest,
  PresetResponse,
  UpdatePresetRequest,
} from "@/types/preset";
import { API_URL, authHeaders, unwrap } from ".";

export const getUserPresets = async (token: string) => {
  const res = await fetch(`${API_URL}/presets`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return unwrap<PresetResponse[]>(res);
};

export const createPreset = async (token: string, req: CreatePresetRequest) => {
  const res = await fetch(`${API_URL}/presets`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      label: req.label,
      color: req.color,
      display_order: req.displayOrder,
    }),
  });
  return unwrap<PresetResponse>(res);
};

export const updatePreset = async (
  token: string,
  id: string,
  req: UpdatePresetRequest,
) => {
  const res = await fetch(`${API_URL}/presets/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({
      label: req.label,
      color: req.color,
      display_order: req.displayOrder,
    }),
  });
  return unwrap<PresetResponse>(res);
};

export const deletePreset = async (token: string, id: string) => {
  const res = await fetch(`${API_URL}/presets/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
};
