import apiClient from "../client/client";
import type {
  AuthResponse,
  AuthRole,
  AuthUser,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from "./types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", payload);
    return response.data;
  },

  async forgotPassword(
    payload: ForgotPasswordPayload,
  ): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      payload,
    );
    return response.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      "/auth/reset-password",
      payload,
    );
    return response.data;
  },

  async profile(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>("/auth/profile");
    return response.data;
  },

  async roles(): Promise<AuthRole[]> {
    const response = await apiClient.get<AuthRole[]>("/auth/roles");
    return response.data;
  },

  async createUser(payload: RegisterPayload): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>("/auth/users", payload);
    return response.data;
  },
};
