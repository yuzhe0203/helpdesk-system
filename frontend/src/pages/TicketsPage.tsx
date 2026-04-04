import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  logout,
  getUserRole,
  getUserId,
  getProfile,
  saveUserId,
} from "../services/authService";
import { getTickets } from "../services/ticketService";
import type { Ticket, TicketFilter } from "../types/ticket";
import TicketItem from "../components/TicketItem";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<
    "ALL" | "ASSIGNED" | "UNASSIGNED"
  >("ALL"); // For AGENT to toggle between assigned/unassigned

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<TicketFilter>("ALL");

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const role = getUserRole();
    let id = getUserId();

    // If no userId in localStorage, fetch from profile
    if (!id && role === "AGENT") {
      getProfile()
        .then((profile) => {
          if (profile.userId) {
            saveUserId(profile.userId);
            setUserId(profile.userId);
            id = profile.userId;
          }
        })
        .catch((err) => {
          console.error("Failed to fetch profile in TicketsPage:", err);
          // If profile fetch fails, might be token issue, redirect to login
          if (err.response?.status === 401) {
            navigate("/login");
          }
        });
    }

    setUserRole(role);
    setUserId(id);
  }, [navigate]);

  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        setError("");

        const result = await getTickets({
          page,
          limit,
          status: filter === "ALL" ? undefined : filter,
        });

        setTickets(result.data);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch (err: any) {
        console.error("Error loading tickets:", err);

        // Handle 401 Unauthorized - token expired or invalid
        if (err.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userId");
          navigate("/login");
          return;
        }

        setError("Failed to load tickets");
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }

    // Only fetch if we have a token
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      setError("No authentication token found");
      return;
    }

    fetchTickets();
  }, [page, limit, filter, navigate]);

  function handlePreviousPage() {
    setPage((prev) => Math.max(prev - 1, 1));
  }

  function handleNextPage() {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error("logout failed:", err);
    } finally {
      navigate("/login");
    }
  }

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading tickets...</div>;
  }

  // Separate tickets for AGENT view
  const assignedTickets =
    userRole === "AGENT" && userId
      ? tickets.filter((t) => {
          const isAssigned = t.assigneeId === userId;
          return isAssigned;
        })
      : [];
  const unassignedTickets =
    userRole === "AGENT"
      ? tickets.filter((t) => !t.assigneeId) // Handles both null and undefined
      : [];

  // Filter tickets for display based on assignmentFilter (AGENT mode)
  let displayTickets = tickets;
  if (userRole === "AGENT") {
    if (assignmentFilter === "ASSIGNED") {
      displayTickets = assignedTickets;
    } else if (assignmentFilter === "UNASSIGNED") {
      displayTickets = unassignedTickets;
    } else {
      displayTickets = tickets;
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Tickets</h1>
          {userRole && (
            <p
              style={{ margin: "5px 0 0 0", color: "#666", fontSize: "0.9em" }}
            >
              Role: <strong>{userRole}</strong>
            </p>
          )}
        </div>
        <button onClick={handleLogout} style={{ padding: "8px 16px" }}>
          Logout
        </button>
      </div>

      {error && <p style={{ color: "red", marginBottom: "20px" }}>{error}</p>}

      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {userRole === "USER" && (
          <Link to="/tickets/create">
            <button style={{ padding: "8px 16px" }}>+ Create Ticket</button>
          </Link>
        )}
        {userRole === "AGENT" && (
          <div
            style={{
              padding: "8px 16px",
              color: "#666",
              fontSize: "0.9em",
              fontStyle: "italic",
            }}
          >
            👨‍💼 Agent Mode: Manage assigned tickets
          </div>
        )}
        {userRole === "ADMIN" && (
          <Link to="/tickets/create">
            <button style={{ padding: "8px 16px" }}>+ Create Ticket</button>
          </Link>
        )}

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label htmlFor="statusFilter">Filter: </label>
          <select
            id="statusFilter"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as TicketFilter);
              setPage(1);
            }}
            style={{ padding: "6px" }}
          >
            <option value="ALL">All</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {userRole === "AGENT" && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setAssignmentFilter("ALL")}
                style={{
                  padding: "6px 12px",
                  backgroundColor:
                    assignmentFilter === "ALL" ? "#333" : "#e0e0e0",
                  color: assignmentFilter === "ALL" ? "white" : "#333",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                All
              </button>
              <button
                onClick={() => setAssignmentFilter("ASSIGNED")}
                style={{
                  padding: "6px 12px",
                  backgroundColor:
                    assignmentFilter === "ASSIGNED" ? "#4CAF50" : "#e0e0e0",
                  color: assignmentFilter === "ASSIGNED" ? "white" : "#333",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ✅ Assigned
              </button>
              <button
                onClick={() => setAssignmentFilter("UNASSIGNED")}
                style={{
                  padding: "6px 12px",
                  backgroundColor:
                    assignmentFilter === "UNASSIGNED" ? "#FF9800" : "#e0e0e0",
                  color: assignmentFilter === "UNASSIGNED" ? "white" : "#333",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                ⏳ Unassigned
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "20px", color: "#666" }}>
        <p>
          Page {page} of {totalPages} | Total: {total} tickets
        </p>
      </div>

      {/* Tickets list - filtered by assignmentFilter for AGENT users */}
      {displayTickets.length === 0 ? (
        <p style={{ padding: "20px", textAlign: "center", color: "#999" }}>
          No tickets found
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {displayTickets.map((ticket) => (
            <TicketItem key={ticket.id} ticket={ticket} />
          ))}
        </ul>
      )}

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "10px",
          justifyContent: "center",
        }}
      >
        <button onClick={handlePreviousPage} disabled={page === 1}>
          ← Previous
        </button>
        <button onClick={handleNextPage} disabled={page === totalPages}>
          Next →
        </button>
      </div>
    </div>
  );
}
