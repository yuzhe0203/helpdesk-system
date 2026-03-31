export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketFilter = "ALL" | TicketStatus;

export interface Ticket {
    id: string
    title: string
    description: string
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
    createdAt: string
    updatedAt: string
}

export interface TicketResponse {
    data: Ticket[]
    page: number
    limit: number
    total: number
    totalPages: number
}

export interface GetTicketsParams {
    page: number
    limit: number
    status?: TicketStatus
}

export interface CreateTicketRequest {
    title: string
    description: string
}

export interface CreateTicketResponse {
    id: string
    title: string
    description: string
    status: TicketStatus
    createdAt: string
    updatedAt: string
}