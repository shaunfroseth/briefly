import { useState } from "react";
import axios from "axios";

type SummaryResponse = {
  title: string;
  summary: string;
  keywords: string[];
  tone: string;
};

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setData(null);

    try {
      const res = await axios.post<SummaryResponse>(
        "http://localhost:4000/summarize",
        { url }
      );
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "2rem auto",
        fontFamily: "system-ui",
        padding: "1rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Briefly</h1>
      <p style={{ color: "#555" }}>
        Paste an article URL and get a concise summary.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <input
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: "100%",
            padding: "0.6rem 0.8rem",
            fontSize: "1rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "0.75rem",
            padding: "0.6rem 1.2rem",
            fontSize: "1rem",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Summarizing..." : "Summarize"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {data && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #eee",
            backgroundColor: "#fafafa",
          }}
        >
          <h2 style={{ marginBottom: "0.25rem" }}>{data.title}</h2>
          <p style={{ marginTop: 0, color: "#666" }}>
            <strong>Tone:</strong> {data.tone}
          </p>

          <h3>Summary</h3>
          <p>{data.summary}</p>

          <h3>Keywords</h3>
          <ul>
            {data.keywords.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
