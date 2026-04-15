import { PresetResponse } from "../preset";

type RoomStatusResponse = {
  presetId: string;
  customMessage: string;
  updatedAt: string;
};

type StatusResponse = {
  preset: PresetResponse;
  customMessage: string;
};

type UpdateStatusRequest = {
  presetId?: string;
  customMessage?: string;
};

export type { RoomStatusResponse, StatusResponse, UpdateStatusRequest };
