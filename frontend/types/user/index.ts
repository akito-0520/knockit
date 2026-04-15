type UserResponse = {
  username: string;
  displayName: string;
};

type SetupUserRequest = {
  username: string;
  displayName: string;
};

type UpdateUserRequest = {
  displayName: string;
};

export type { UserResponse, SetupUserRequest, UpdateUserRequest };
