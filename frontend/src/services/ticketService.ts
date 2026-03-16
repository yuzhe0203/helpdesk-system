import api from "./api";
import type { TicketResponse } from "../types/ticket";

export async function getTickets(): Promise<TicketResponse> {
    const token = localStorage.getItem("accessToken");

    const response = await api.get<TicketResponse>("/tickets", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
}