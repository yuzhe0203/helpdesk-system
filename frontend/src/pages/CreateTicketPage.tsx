import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTicket } from "../services/ticketService";

export default function CreateTicketPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setError("Title and description are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createTicket({
        title: trimmedTitle,
        description: trimmedDescription,
      });

      navigate("/tickets");
    } catch (err) {
      console.error(err);
      setError("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <button
        onClick={() => navigate("/tickets")}
        style={{ marginBottom: "20px" }}
      >
        ← Back
      </button>

      <h1>Create Ticket</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="title">Title</label>
          <br />
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="Enter ticket title"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="description">Description</label>
          <br />
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            placeholder="Describe your issue in detail..."
            rows={6}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "5px",
              fontFamily: "Arial",
            }}
          />
        </div>

        {error && <p style={{ color: "red", marginBottom: "15px" }}>{error}</p>}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "10px 20px" }}
          >
            {loading ? "Creating..." : "Create Ticket"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/tickets")}
            disabled={loading}
            style={{ padding: "10px 20px", backgroundColor: "#f0f0f0" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
