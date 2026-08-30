import {
  APIKeyResponse,
  CreateAPIKeyRequest,
  CreatedAPIKeyResponse,
} from "@/types/apiKey";
import { API_URL, authHeaders, unwrap } from ".";

export const getApiKeys = async (token: string) => {
  const res = await fetch(`${API_URL}/auth/api-keys`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return unwrap<APIKeyResponse[]>(res);
};

export const createApiKey = async (token: string, req: CreateAPIKeyRequest) => {
  const res = await fetch(`${API_URL}/auth/api-keys`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ label: req.label }),
  });
  return unwrap<CreatedAPIKeyResponse>(res);
};

export const deleteApiKey = async (token: string, id: string) => {
  const res = await fetch(`${API_URL}/auth/api-keys/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
};
