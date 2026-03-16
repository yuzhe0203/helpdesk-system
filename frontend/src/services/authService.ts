import api from "./api";
import type { LoginRequest, LoginResponse } from "../types/auth";

export async function login(request: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login", request);
    return response.data;
}

export async function logout(): Promise<void> {
    const token = localStorage.getItem("accessToken");

    try {
    if (token) {
      await api.post(
        "/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
  } finally {
    localStorage.removeItem("accessToken");
  }
}