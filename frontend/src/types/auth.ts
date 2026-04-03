export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface RegisterResponse {
    id: string;
    email: string;
    role: string;
}

export interface UserProfile {
    userId: string;
    email: string;
    role: "USER" | "AGENT" | "ADMIN";
}
