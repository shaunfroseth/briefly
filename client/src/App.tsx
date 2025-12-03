import { useState } from "react";
import axios from "axios";

type Article = {
  id: number;
  url: string;
  title: string;
  summary: string;
  keywords: string[];
  tone: string;
  isPolitical: boolean;
  politicalTopics: string[];
  createdAt: string; // ISO string from the API
};

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Article[]>([]);

  async function loadHistory() {
    try {
      const res = await axios.get<Article[]>("http://localhost:4000/history");
      setHistory(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load history");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setData(null);

    try {
      const res = await axios.post<Article>("http://localhost:4000/summarize", {
        url,
      });
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root">
      <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Briefly</h1>
      <p style={{ color: "#9ca3af" }}>
        Paste an article URL and get a concise summary.
      </p>

      <form className="url-form" onSubmit={handleSubmit}>
        <input
          type="url"
          className="url-input"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit" className="url-button" disabled={loading}>
          {loading ? "Summarizing..." : "Summarize"}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {data && (
        <div className="summary-card">
          <h2>{data.title}</h2>
          <p style={{ marginTop: 0, color: "#9ca3af" }}>
            <strong>Tone:</strong> {data.tone}
          </p>

          <p style={{ marginTop: 0, color: "#9ca3af" }}>
            <strong>Political article:</strong>{" "}
            {data.isPolitical ? "Yes" : "No"}
          </p>

          {data.politicalTopics.length > 0 && (
            <>
              <h3>Political topics</h3>
              <ul>
                {data.politicalTopics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </>
          )}

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

      <div style={{ marginTop: "2rem" }}>
        <button className="url-button" onClick={loadHistory}>
          View History
        </button>

        {history.length > 0 && (
          <div className="summary-card" style={{ marginTop: "1rem" }}>
            <h2>History</h2>
            <ul>
              {history.map((h) => (
                <li key={h.id}>
                  <strong>{h.title}</strong> —{" "}
                  {new Date(h.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
