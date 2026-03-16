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