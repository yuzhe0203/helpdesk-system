# Helpdesk System Backend

A Helpdesk backend system built with **NestJS**, **Prisma**, and **PostgreSQL**.

This project demonstrates a production-style backend architecture with secure authentication, role-based access control (RBAC), ticket lifecycle management, and threaded comments for communication between users and support agents.

The system is designed to simulate a real-world helpdesk workflow where users create support tickets and agents manage and resolve them.

---

# Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (Access Token + Refresh Token Rotation)
- **Authorization:** RBAC (Role-Based Access Control)

---

# System Architecture

Client
↓
NestJS Controller
↓
Service Layer (Business Logic)
↓
Prisma ORM
↓
PostgreSQL Database

The application follows a layered architecture:

- **Controller Layer** handles HTTP requests.
- **Service Layer** contains business logic and authorization rules.
- **Prisma ORM** manages database access.
- **PostgreSQL** stores persistent data.

---

# Features

## Authentication

Secure authentication system using JWT.

- User registration
- User login
- JWT Access Token
- Refresh Token Rotation
- Secure logout (refresh token revocation)

Access tokens are short-lived while refresh tokens are securely stored and rotated.

---

## Role-Based Access Control (RBAC)

The system supports three roles:

- **USER**
- **AGENT**
- **ADMIN**

Permissions differ depending on the role.

| Role  | Permissions                                     |
| ----- | ----------------------------------------------- |
| USER  | Create tickets and comment on their own tickets |
| AGENT | Manage assigned tickets                         |
| ADMIN | Full system access                              |

RBAC is implemented using guards and role decorators.

---

## Ticket Management

Users can create and manage support tickets.

Supported operations:

- Create ticket
- List tickets
- View ticket details
- Assign tickets to agents

Access to ticket data is restricted based on role and ownership.

For example:

- Users can only view their own tickets.
- Agents can only manage tickets assigned to them.
- Admins can view all tickets.

---

## Ticket Assignment

Tickets can be assigned to support agents.

Rules:

- Only **ADMIN** or **AGENT** can assign tickets.
- Tickets can only be assigned to users with the **AGENT** role.
- If a ticket is in **OPEN** status and gets assigned, it automatically changes to **IN_PROGRESS**.
- **CLOSED** tickets cannot be assigned.

---

## Ticket Lifecycle (State Machine)

Ticket status follows a controlled lifecycle:
OPEN → IN_PROGRESS → RESOLVED → CLOSED

Allowed transitions:

| From        | To          |
| ----------- | ----------- |
| OPEN        | IN_PROGRESS |
| IN_PROGRESS | RESOLVED    |
| RESOLVED    | CLOSED      |
| RESOLVED    | IN_PROGRESS |

Invalid transitions are rejected by the system.

Examples:

- `OPEN → CLOSED` ❌
- `CLOSED → IN_PROGRESS` ❌

---

## Comment System

Each ticket supports threaded comments.

Users and agents can communicate through comments within a ticket.

Features:

- Create comment on a ticket
- Retrieve all comments of a ticket
- Comments are ordered by creation time
- Access is restricted by ticket ownership

Comment permissions:

| Role  | Permission                   |
| ----- | ---------------------------- |
| USER  | Comment on their own tickets |
| AGENT | Comment on assigned tickets  |
| ADMIN | Comment on any ticket        |

---

# API Overview

## Auth

POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout

---

## Tickets

POST /tickets
GET /tickets
GET /tickets/:id

PATCH /tickets/:id/assign
PATCH /tickets/:id/status

---

## Comments

POST /tickets/:id/comments
GET /tickets/:id/comments

---

# Database Models

## User

id
email
passwordHash
role
createdAt
updatedAt

---

## Ticket

id
title
description
status
creatorId
assigneeId
createdAt
updatedAt

---

## Comment

id
ticketId
authorId
content
createdAt

Relationships:

- A **User** can create many tickets
- A **User** can write many comments
- A **Ticket** can contain many comments

---

# Future Improvements

Possible improvements for this project:

- Pagination for ticket listing
- Filtering and sorting APIs
- Optimistic locking for concurrent updates
- API documentation using Swagger
- Integration tests

---

# License

This project is for educational and portfolio purposes.
