import { StatusResponse, UpdateStatusRequest } from "@/types/roomStatus";
import { API_URL, authHeaders, unwrap } from ".";

export const getPublicStatus = async (username: string) => {
  const res = await fetch(`${API_URL}/status/${username}`);
  return unwrap<StatusResponse>(res);
};

export const getMyStatus = async (token: string) => {
  const res = await fetch(`${API_URL}/status/me`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return unwrap<StatusResponse>(res);
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
  return unwrap<StatusResponse>(res);
};
