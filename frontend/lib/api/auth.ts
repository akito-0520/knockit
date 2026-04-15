import { SetupUserRequest, UpdateUserRequest } from "@/types/user";
import { API_URL, authHeaders } from ".";

export const setupUser = async (token: string, req: SetupUserRequest) => {
  const res = await fetch(`${API_URL}/auth/setup`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      username: req.username,
      display_name: req.displayName,
    }),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
};

export const getCurrentUser = async (token: string) => {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
};

export const updateUser = async (token: string, req: UpdateUserRequest) => {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({
      display_name: req.displayName,
    }),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  return res.json();
};
