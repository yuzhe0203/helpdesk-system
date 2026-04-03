import { useNavigate } from "react-router-dom";
import type { Ticket } from "../types/ticket";

interface TicketItemProps {
  ticket: Ticket;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "OPEN":
      return "#ff6b6b";
    case "IN_PROGRESS":
      return "#ffa500";
    case "RESOLVED":
      return "#4caf50";
    case "CLOSED":
      return "#999";
    default:
      return "#000";
  }
}

export default function TicketItem({ ticket }: TicketItemProps) {
  const navigate = useNavigate();

  return (
    <li
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      style={{
        padding: "10px",
        margin: "10px 0",
        border: "1px solid #ddd",
        borderRadius: "4px",
        cursor: "pointer",
        backgroundColor: "#f9f9f9",
        transition: "background-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
    >
      <p style={{ margin: "5px 0" }}>
        <strong>ID:</strong> {ticket.id.slice(0, 8)}...
      </p>
      <p style={{ margin: "5px 0" }}>
        <strong>Title:</strong> {ticket.title}
      </p>
      <p style={{ margin: "5px 0" }}>
        <strong>Status:</strong>{" "}
        <span style={{ color: getStatusColor(ticket.status) }}>
          {ticket.status}
        </span>
      </p>
      <p style={{ margin: "5px 0", color: "#999", fontSize: "0.9em" }}>
        {ticket.assignee ? (
          <>✅ Assigned to: {ticket.assignee.email}</>
        ) : (
          <>⏳ Unassigned</>
        )}
      </p>
      <p style={{ margin: "5px 0", color: "#999", fontSize: "0.9em" }}>
        {new Date(ticket.createdAt).toLocaleDateString()}
      </p>
    </li>
  );
}
