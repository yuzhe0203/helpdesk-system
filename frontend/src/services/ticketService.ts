import api from "./api";
import type { CreateTicketRequest, CreateTicketResponse, GetTicketsParams, TicketResponse, TicketDetailResponse, CreateCommentRequest, CreateCommentResponse, Comment, AssignTicketRequest, AssignTicketResponse, UserInfo, TicketStatus } from "../types/ticket";

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

export async function getTicketById(id: string): Promise<TicketDetailResponse> {
  const response = await api.get<TicketDetailResponse>(`/tickets/${id}`);
  return response.data;
}

export async function getComments(ticketId: string): Promise<Comment[]> {
  const response = await api.get<Comment[]>(`/tickets/${ticketId}/comments`);
  return response.data;
}

export async function createComment(ticketId: string, request: CreateCommentRequest): Promise<CreateCommentResponse> {
  const response = await api.post<CreateCommentResponse>(`/tickets/${ticketId}/comments`, request);
  return response.data;
}

export async function assignTicket(ticketId: string, request: AssignTicketRequest): Promise<AssignTicketResponse> {
  const response = await api.patch<AssignTicketResponse>(`/tickets/${ticketId}/assign`, request);
  return response.data;
}

export async function getAllAgents(): Promise<UserInfo[]> {
  const response = await api.get<UserInfo[]>("/users/agents");
  return response.data;
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<{ id: string; status: TicketStatus; updatedAt: string }> {
  const response = await api.patch(`/tickets/${ticketId}/status`, { status });
  return response.data;
}