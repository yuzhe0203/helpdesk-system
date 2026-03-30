import api from "./api";
import type { GetTicketsParams, TicketResponse } from "../types/ticket";

export async function getTickets(params: GetTicketsParams): Promise<TicketResponse> {
    const queryParams: GetTicketsParams= {
        page: params.page,
        limit: params.limit,
    };

    if (params?.status) {
        queryParams.status = params.status;
    }

    const response = await api.get<TicketResponse>("/tickets", {
        params: queryParams,
    });

    return response.data;
}