import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import { getTickets } from "../services/ticketService";
import type { Ticket } from "../types/ticket";
import TicketItem from "../components/TicketItem";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        setError("");

        const result = await getTickets();
        console.log("tickets result:", result);

        setTickets(result.data);
      } catch (err) {
        console.error(err);
        setError("取得 tickets 失敗");
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, []);

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
    return <div>Loading tickets...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Tickets</h1>
      <button onClick={handleLogout}>Logout</button>

      {tickets.length === 0 ? (
        <p>目前沒有 ticket</p>
      ) : (
        <ul>
          {tickets.map((ticket) => (
            <TicketItem key={ticket.id} ticket={ticket} />
          ))}
        </ul>
      )}
    </div>
  );
}
