import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTicketById,
  createComment,
  assignTicket,
  getAllAgents,
  updateTicketStatus,
} from "../services/ticketService";
import { getUserRole } from "../services/authService";
import type {
  TicketDetailResponse,
  Comment,
  UserInfo,
  TicketStatus,
} from "../types/ticket";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<TicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [agents, setAgents] = useState<UserInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [assigningTicket, setAssigningTicket] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function fetchTicket() {
      if (!id) {
        setError("Invalid ticket ID");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const ticketData = await getTicketById(id);
        setTicket(ticketData);
      } catch (err) {
        console.error(err);
        setError("Failed to load ticket details");
      } finally {
        setLoading(false);
      }
    }

    async function setupPage() {
      // Get user role
      const role = getUserRole();
      setUserRole(role);

      // Get agents list if user is ADMIN or AGENT
      if (role === "ADMIN" || role === "AGENT") {
        try {
          const agentsList = await getAllAgents();
          setAgents(agentsList);
        } catch (err) {
          console.error("Failed to load agents:", err);
        }
      }
    }

    fetchTicket();
    setupPage();
  }, [id]);

  async function handleAddComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedText = commentText.trim();
    if (!trimmedText || !id) {
      return;
    }

    try {
      setSubmittingComment(true);
      const newComment = await createComment(id, { content: trimmedText });
      setCommentText("");

      // Update the ticket with the new comment
      if (ticket) {
        setTicket({
          ...ticket,
          comments: [...ticket.comments, newComment as Comment],
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleUpdateStatus(newStatus: TicketStatus) {
    if (!id || !ticket) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");
      const result = await updateTicketStatus(id, newStatus);

      // Update ticket with new status
      setTicket({
        ...ticket,
        status: result.status,
        updatedAt: result.updatedAt,
      });
    } catch (err: any) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message || "Failed to update ticket status";
      setError(errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAssignTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedAgent || !id || !ticket) {
      return;
    }

    try {
      setAssigningTicket(true);
      const result = await assignTicket(id, { assigneeId: selectedAgent });

      // Update ticket with new assignment
      const assignedAgent = agents.find((a) => a.id === selectedAgent);
      setTicket({
        ...ticket,
        status: result.status,
        assigneeId: result.assigneeId,
        assignee: assignedAgent || null,
      });
      setSelectedAgent("");
    } catch (err) {
      console.error(err);
      setError("Failed to assign ticket");
    } finally {
      setAssigningTicket(false);
    }
  }

  if (loading) {
    return <div>Loading ticket...</div>;
  }

  if (error || !ticket) {
    return (
      <div>
        <p>{error || "Ticket not found"}</p>
        <button onClick={() => navigate("/tickets")}>Back to Tickets</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <button
        onClick={() => navigate("/tickets")}
        style={{ marginBottom: "20px" }}
      >
        ← Back to Tickets
      </button>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "15px",
          marginBottom: "20px",
        }}
      >
        <h1>{ticket.title}</h1>
        <p>
          <strong>Status:</strong> {ticket.status}
        </p>
        <p>
          <strong>Created by:</strong> {ticket.creator?.email || "Unknown"}
        </p>
        {ticket.assignee && (
          <p>
            <strong>Assigned to:</strong> {ticket.assignee.email}
          </p>
        )}
        {!ticket.assignee && userRole === "AGENT" && (
          <p style={{ color: "#ff6b6b", fontWeight: "bold" }}>
            ⚠️ Unassigned - You can assign this ticket
          </p>
        )}
        <p>
          <strong>Created:</strong>{" "}
          {new Date(ticket.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Updated:</strong>{" "}
          {new Date(ticket.updatedAt).toLocaleString()}
        </p>

        <div style={{ marginTop: "20px" }}>
          <h3>Description</h3>
          <p>{ticket.description}</p>
        </div>

        {(userRole === "ADMIN" || userRole === "AGENT") &&
          ticket.status !== "CLOSED" && (
            <div
              style={{
                marginTop: "20px",
                borderTop: "1px solid #eee",
                paddingTop: "15px",
              }}
            >
              <h3>🎯 Assign Ticket</h3>
              <form
                onSubmit={handleAssignTicket}
                style={{ marginBottom: "15px" }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <label htmlFor="agentSelect">
                    {ticket.assignee
                      ? "Reassign to Agent:"
                      : "Assign to Agent:"}
                  </label>
                  <br />
                  <select
                    id="agentSelect"
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    disabled={assigningTicket}
                    style={{ padding: "6px", marginRight: "10px" }}
                  >
                    <option value="">-- Select Agent --</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.email}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={assigningTicket || !selectedAgent}
                  >
                    {assigningTicket ? "Assigning..." : "Assign"}
                  </button>
                </div>
                {ticket.status === "OPEN" && (
                  <p
                    style={{
                      fontSize: "0.85em",
                      color: "#666",
                      margin: "5px 0 0 0",
                    }}
                  >
                    ℹ️ Assigning will change status to IN_PROGRESS
                  </p>
                )}
                {ticket.status !== "OPEN" && ticket.assignee && (
                  <p
                    style={{
                      fontSize: "0.85em",
                      color: "#FF9800",
                      margin: "5px 0 0 0",
                    }}
                  >
                    ℹ️ Reassigning will reset status to IN_PROGRESS
                  </p>
                )}
                {userRole === "AGENT" && !ticket.assignee && (
                  <p
                    style={{
                      fontSize: "0.85em",
                      color: "#4caf50",
                      margin: "5px 0 0 0",
                    }}
                  >
                    💡 You can select yourself from the list to take this ticket
                  </p>
                )}
              </form>
            </div>
          )}

        {(userRole === "ADMIN" || userRole === "AGENT") && (
          <div
            style={{
              marginTop: "20px",
              borderTop: "1px solid #eee",
              paddingTop: "15px",
            }}
          >
            <h3>📊 Update Status</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {ticket.status === "OPEN" && (
                <button
                  onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  disabled={updatingStatus}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#FF9800",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: updatingStatus ? "not-allowed" : "pointer",
                    opacity: updatingStatus ? 0.6 : 1,
                  }}
                >
                  {updatingStatus
                    ? "Updating..."
                    : "▶️ Start Work (IN_PROGRESS)"}
                </button>
              )}

              {ticket.status === "IN_PROGRESS" && (
                <button
                  onClick={() => handleUpdateStatus("RESOLVED")}
                  disabled={updatingStatus}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: updatingStatus ? "not-allowed" : "pointer",
                    opacity: updatingStatus ? 0.6 : 1,
                  }}
                >
                  {updatingStatus ? "Updating..." : "✅ Mark as Resolved"}
                </button>
              )}

              {ticket.status === "RESOLVED" && (
                <>
                  <button
                    onClick={() => handleUpdateStatus("CLOSED")}
                    disabled={updatingStatus}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#9C27B0",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: updatingStatus ? "not-allowed" : "pointer",
                      opacity: updatingStatus ? 0.6 : 1,
                    }}
                  >
                    {updatingStatus ? "Updating..." : "🔒 Close Ticket"}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("IN_PROGRESS")}
                    disabled={updatingStatus}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: updatingStatus ? "not-allowed" : "pointer",
                      opacity: updatingStatus ? 0.6 : 1,
                    }}
                  >
                    {updatingStatus ? "Updating..." : "↩️ In Progress"}
                  </button>
                </>
              )}

              {ticket.status === "CLOSED" && (
                <p style={{ color: "#999", fontStyle: "italic" }}>
                  🔒 This ticket is closed and cannot be modified.
                </p>
              )}
            </div>

            <p style={{ fontSize: "0.85em", color: "#666", marginTop: "10px" }}>
              ℹ️ Allowed transitions: OPEN → IN_PROGRESS → RESOLVED → CLOSED
              (RESOLVED can also return to IN_PROGRESS)
            </p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h2>Comments ({ticket.comments.length})</h2>

        {ticket.comments.length === 0 ? (
          <p>No comments yet</p>
        ) : (
          <div style={{ marginBottom: "20px" }}>
            {ticket.comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  border: "1px solid #eee",
                  padding: "10px",
                  marginBottom: "10px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <p>
                  <strong>{comment.author?.email || "Unknown"}</strong>{" "}
                  <span style={{ color: "#999", fontSize: "0.9em" }}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </p>
                <p>{comment.content}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddComment} style={{ marginTop: "20px" }}>
          <h3>Add a Comment</h3>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={submittingComment}
            placeholder="Write your comment here..."
            rows={4}
            style={{ width: "100%", padding: "10px", fontFamily: "Arial" }}
          />
          <br />
          <button
            type="submit"
            disabled={submittingComment || !commentText.trim()}
          >
            {submittingComment ? "Posting..." : "Post Comment"}
          </button>
        </form>
      </div>
    </div>
  );
}
