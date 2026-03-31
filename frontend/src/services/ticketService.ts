import api from "./api";
import type { CreateTicketRequest, CreateTicketResponse, GetTicketsParams, Ticket, TicketResponse } from "../types/ticket";

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

export async function createTicket(request: CreateTicketRequest): Promise<CreateTicketResponse> {
  const response = await api.post<CreateTicketResponse>("/tickets", request);
  return response.data;
}