# Helpdesk Ticketing System

**A full-stack helpdesk application** built with **React 19**, **NestJS**, **Prisma**, and **PostgreSQL**.

This project demonstrates a production-ready helpdesk workflow where users create support tickets, agents manage and resolve them, and administrators oversee the entire system. The application features a modern React frontend with real-time UI updates and a robust NestJS backend with JWT authentication and role-based access control.

---

## 📁 Project Structure

```
helpdesk-system/
├── frontend/                 # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── pages/           # Login, Register, TicketsPage, TicketDetailPage, CreateTicketPage
│   │   ├── components/      # ProtectedRoute, TicketItem
│   │   ├── services/        # API, authService, ticketService
│   │   ├── types/           # TypeScript interfaces (auth, ticket)
│   │   └── router/          # React Router configuration
│   └── package.json
│
├── backend/                 # NestJS + TypeScript + Prisma
│   ├── src/
│   │   ├── auth/           # Authentication (login, register, JWT strategies)
│   │   ├── tickets/        # Ticket CRUD and business logic
│   │   ├── users/          # User management and agent listing
│   │   ├── prisma/         # Database service
│   │   ├── app.module.ts   # Main module
│   │   └── main.ts         # Entry point
│   ├── prisma/             # Database schema and migrations
│   ├── scripts/            # Database seeding
│   └── package.json
│
├── docker/                 # Docker Compose for PostgreSQL
├── test_api/              # HTTP test files for API testing
└── docs/                  # Documentation
```

---

## 🛠 Tech Stack

### Frontend

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **UI:** HTML + CSS (inline styles)

### Backend

- **Framework:** NestJS 11
- **Language:** TypeScript
- **Database:** PostgreSQL 16
- **ORM:** Prisma 6
- **Authentication:** JWT (Access Token + Refresh Token Rotation)
- **Authorization:** RBAC (Role-Based Access Control)
- **Password Hashing:** bcrypt

---

## 🏗 System Architecture

```
React Frontend (Browser)
    ↓
Axios API Client with JWT Interceptor
    ↓
NestJS Controller Layer (REST API)
    ↓
Service Layer (Business Logic & Authorization)
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

The application follows a layered architecture:

- **Frontend Components** handle UI and user interactions
- **API Services** manage HTTP communication with automatic token injection
- **NestJS Controllers** expose REST endpoints
- **Service Layer** contains business logic, validation, and RBAC rules
- **Prisma ORM** provides type-safe database access
- **PostgreSQL** stores persistent data

---

## ✨ Features

### ✅ Authentication & Authorization

- **User Registration:** New users create accounts with email and password
- **User Login:** Secure login with JWT tokens
- **JWT Access Tokens:** Short-lived tokens for API requests
- **Refresh Token Rotation:** Secure token refresh mechanism
- **Logout:** Refresh token revocation for secure logout
- **Role-Based Access Control:** Three roles with different permissions

**Roles:**

| Role      | Permissions                                                                               |
| --------- | ----------------------------------------------------------------------------------------- |
| **USER**  | Create tickets, view own tickets, comment on own tickets                                  |
| **AGENT** | View unassigned & assigned tickets, assign tickets, update ticket status, manage comments |
| **ADMIN** | Full system access including user management                                              |

---

### ✅ Ticket Management

**Ticket Lifecycle:**

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
       ↑                    ↓
       +--------------------+
     (RESOLVED ↔ IN_PROGRESS)
```

**Supported Operations:**

- ✅ Create tickets (USER only)
- ✅ List tickets (filtered by role)
- ✅ View ticket details with full relationships
- ✅ Assign tickets to AGENT users
- ✅ Update ticket status with validation
- ✅ Reassign tickets with automatic status reset

**Assignment Rules:**

- Only ADMIN or AGENT can assign tickets
- Tickets can only be assigned to users with AGENT role
- First assignment (OPEN status) → automatically changes to IN_PROGRESS
- Reassignment (to different agent) → automatically resets to IN_PROGRESS
- CLOSED tickets cannot be assigned or modified

**Status Transition Rules:**

- OPEN → IN_PROGRESS (manual or automatic on assignment)
- IN_PROGRESS → RESOLVED
- RESOLVED → CLOSED
- RESOLVED ↔ IN_PROGRESS (can revert to in progress)
- Invalid transitions are rejected

---

### ✅ Visibility & Filtering (AGENT-specific)

**USER View:**

- Can only see their own created tickets

**AGENT View:**

- Can see unassigned tickets (available pool)
- Can see tickets assigned to themselves
- Cannot see tickets assigned to other AGENTS
- Filter buttons: All | Assigned | Unassigned

**ADMIN View:**

- Can see all tickets in the system

---

### ✅ Comment System

- Create comments on tickets
- Comments display author and timestamp
- Comments are ordered chronologically
- Author relationships are eagerly loaded
- Access control: Users can comment based on ticket ownership/assignment

---

### ✅ User-Friendly Frontend

- **Modern UI:** Clean, responsive design with color-coded status badges
- **Protected Routes:** Authentication checks on all protected pages
- **Error Handling:** Comprehensive error messages and 401 token validation
- **Loading States:** User feedback during async operations
- **Navigation:** Easy switching between pages with React Router
- **Form Validation:** Input validation on registration, login, and ticket creation

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/helpdesk-system.git
cd helpdesk-system
```

#### 2. Start PostgreSQL with Docker

```bash
cd docker
docker-compose up -d
```

#### 3. Setup Backend

```bash
cd backend
npm install

# Run migrations
npm run prisma:migrate

# Seed test users
npm run db:seed
```

#### 4. Setup Frontend

```bash
cd frontend
npm install
```

#### 5. Start the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run start:dev
```

Backend runs on `http://localhost:3000`

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 🧪 Test Users

After running `npm run db:seed`, use these credentials:

| Email          | Password | Role  |
| -------------- | -------- | ----- |
| user@test.com  | test123  | USER  |
| agent@test.com | test123  | AGENT |
| admin@test.com | test123  | ADMIN |

---

## 📚 API Endpoints

### Authentication

```
POST   /auth/register           Register new user
POST   /auth/login              User login (returns accessToken)
POST   /auth/refresh            Refresh access token
POST   /auth/logout             Logout (revoke refresh token)
GET    /auth/profile            Get current user profile
```

### Tickets

```
POST   /tickets                 Create new ticket (USER)
GET    /tickets                 List tickets (filtered by role)
GET    /tickets/:id             Get ticket details
PATCH  /tickets/:id/assign      Assign ticket to agent
PATCH  /tickets/:id/status      Update ticket status
```

### Comments

```
POST   /tickets/:id/comments    Add comment to ticket
GET    /tickets/:id/comments    Get all ticket comments
```

### Users

```
GET    /users/agents            Get list of all agents (for assignment dropdown)
```

---

## 📦 Database Models

### User

```typescript
{
  id: string(UUID);
  email: string(unique);
  passwordHash: string;
  role: "USER" | "AGENT" | "ADMIN";
  refreshTokenHash: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Ticket

```typescript
{
  id: string (UUID)
  title: string
  description: string
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
  creatorId: string (User.id)
  assigneeId: string | null (User.id)
  createdAt: DateTime
  updatedAt: DateTime

  // Relationships
  creator: User
  assignee: User | null
  comments: Comment[]
}
```

### Comment

```typescript
{
  id: string(UUID);
  content: string;
  ticketId: string(Ticket.id);
  authorId: string(User.id);
  createdAt: DateTime;

  // Relationships
  author: User;
  ticket: Ticket;
}
```

---

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ Refresh token rotation (invalidates old tokens)
- ✅ Role-based access control guards
- ✅ Protected API endpoints
- ✅ Authorization checks on all operations
- ✅ Token stored in localStorage with validation
- ✅ Automatic logout on 401 Unauthorized

---

## 📝 Development Notes

### Frontend Structure

- Components are located in `src/components/` (reusable UI elements)
- Pages are in `src/pages/` (full page components)
- API clients are in `src/services/` with Axios instance
- TypeScript types are in `src/types/`

### Backend Structure

- Controllers handle HTTP requests and routing
- Services contain business logic and database operations
- Guards handle authentication and authorization
- Decorators provide access to current user context

### Environment Variables

**Backend (.env)**

```
DATABASE_URL=postgresql://user:password@localhost:5432/helpdesk
JWT_SECRET=your_secret_key
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

---

## 🚧 Future Improvements

- [ ] Ticket search and advanced filtering
- [ ] Sorting by creation date, status, assignee
- [ ] Admin dashboard with system statistics
- [ ] AGENT workload visualization
- [ ] Email notifications for ticket updates
- [ ] File attachments on tickets and comments
- [ ] Ticket priority levels
- [ ] SLA tracking and reporting
- [ ] Audit logging
- [ ] Bulk ticket operations
- [ ] Dark mode UI toggle
- [ ] Pagination customization
- [ ] API documentation with Swagger/OpenAPI

---

## 📄 License

This project is for educational and portfolio purposes.

---

## 👥 Contributing

Suggestions and improvements welcome! Feel free to fork and submit pull requests.
