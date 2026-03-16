import type { Ticket } from "../types/ticket";

interface TicketItemProps {
  ticket: Ticket;
}

export default function TicketItem({ ticket }: TicketItemProps) {
  return (
    <li>
      <p>Ticket ID: {ticket.id}</p>
      <p>Title: {ticket.title}</p>
      <p>Status: {ticket.status}</p>
    </li>
  );
}
