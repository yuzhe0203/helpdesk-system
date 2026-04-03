import api from "./api";
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UserProfile } from "../types/auth";

export async function login(request: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login", request);
    return response.data;
}

export async function logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
    }
}

export async function register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>("/auth/register", request);
    return response.data;
}

export async function getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>("/auth/profile");
    return response.data;
}

export function getUserRole(): string | null {
    return localStorage.getItem("userRole");
}

export function saveUserRole(role: string): void {
    localStorage.setItem("userRole", role);
}

export function saveUserId(userId: string | undefined): void {
    console.log("DEBUG - saveUserId called with:", userId);
    if (!userId) {
        console.warn("DEBUG - WARNING: userId is null/undefined");
        return;
    }
    localStorage.setItem("userId", userId);
}

export function getUserId(): string | null {
    const id = localStorage.getItem("userId");
    console.log("DEBUG - getUserId from localStorage:", id);
    return id;
}