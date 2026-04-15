import { UpdateStatusRequest } from "@/types/roomStatus";
import { API_URL, authHeaders } from ".";

export const getPublicStatus = async (username: string) => {
  const res = await fetch(`${API_URL}/status/${username}`, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
};

export const getMyStatus = async (token: string) => {
  const res = await fetch(`${API_URL}/status/me`, {
    method: "GET",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
};

export const updateStatus = async (token: string, req: UpdateStatusRequest) => {
  const res = await fetch(`${API_URL}/status/me`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({
      preset_id: req.presetId,
      custom_message: req.customMessage,
    }),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
};
