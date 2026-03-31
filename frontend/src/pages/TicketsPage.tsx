import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../services/authService";
import { getTickets } from "../services/ticketService";
import type { Ticket, TicketFilter } from "../types/ticket";
import TicketItem from "../components/TicketItem";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<TicketFilter>("ALL");

  const navigate = useNavigate();

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
        console.log("tickets result:", result);

        setTickets(result.data);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch (err) {
        console.error(err);
        setError("取得 tickets 失敗");
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [page, limit, filter]);

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
    return <div>Loading tickets...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Tickets</h1>
      <button onClick={handleLogout}>Logout</button>

      <div>
        <p>Page: {page}</p>
        <p>Total Pages: {totalPages}</p>
        <p>Total Tickets: {total}</p>
      </div>

      <button onClick={() => navigate("/tickets/create")}>Create Ticket</button>

      <div>
        <label htmlFor="statusFilter">Filter by status: </label>
        <select
          id="statusFilter"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as TicketFilter);
            setPage(1); // Reset to first page when filter changes
          }}
        >
          <option value="ALL">ALL</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      <div>
        <button onClick={handlePreviousPage} disabled={page === 1}>
          Previous
        </button>

        <button onClick={handleNextPage} disabled={page === totalPages}>
          Next
        </button>
      </div>

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
