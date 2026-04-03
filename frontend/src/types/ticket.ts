export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketFilter = "ALL" | TicketStatus;

export interface UserInfo {
    id: string
    email: string
    role: "USER" | "AGENT" | "ADMIN"
}

export interface Comment {
    id: string
    content: string
    authorId: string
    author: UserInfo
    ticketId: string
    createdAt: string
}

export interface Ticket {
    id: string
    title: string
    description: string
    status: TicketStatus
    createdAt: string
    updatedAt: string
    creatorId?: string
    creator?: UserInfo
    assigneeId?: string | null
    assignee?: UserInfo | null
    comments?: Comment[]
}

export interface TicketResponse {
    data: Ticket[]
    page: number
    limit: number
    total: number
    totalPages: number
}

export interface TicketDetailResponse {
    id: string
    title: string
    description: string
    status: TicketStatus
    creatorId: string
    creator: UserInfo
    assigneeId: string | null
    assignee: UserInfo | null
    createdAt: string
    updatedAt: string
    comments: Comment[]
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

export interface CreateCommentRequest {
    content: string
}

export interface CreateCommentResponse {
    id: string
    content: string
    authorId: string
    author: UserInfo
    ticketId: string
    createdAt: string
}

export interface AssignTicketRequest {
    assigneeId: string
}

export interface AssignTicketResponse {
    id: string
    status: TicketStatus
    assigneeId: string
    updatedAt: string
}