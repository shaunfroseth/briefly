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
  createdAt: string; // ISO string from API
};

function toneToClass(tone: string): string {
  const t = tone.toLowerCase();
  if (t === "critical") return "badge badge-tone-critical";
  if (t === "optimistic" || t === "enthusiastic")
    return "badge badge-tone-optimistic";
  if (t === "pessimistic" || t === "urgent")
    return "badge badge-tone-pessimistic";
  return "badge badge-tone-neutral";
}

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Article[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  async function loadHistory() {
    try {
      setError(null);
      const res = await axios.get<Article[]>("http://localhost:4000/history");
      setHistory(res.data);
      setHistoryLoaded(true);
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
      // Optionally refresh history after a successful save
      loadHistory();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Briefly</h1>
        <p className="app-subtitle">
          Paste an article URL to get an AI-generated summary, tone, and topical
          tags.
        </p>
      </header>

      {error && <p className="error-text">{error}</p>}

      <main className="app-grid">
        {/* Left: input + latest summary */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">New summary</h2>
              <p className="card-subtitle">
                We’ll fetch the article, analyze it, and store the result.
              </p>
            </div>
          </div>

          <form className="url-form" onSubmit={handleSubmit}>
            <input
              type="url"
              className="url-input"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <div className="btn-row">
              <button
                type="submit"
                className="button button-primary"
                disabled={loading}
              >
                {loading ? "Summarizing..." : "Summarize article"}
              </button>
            </div>
          </form>

          {data && (
            <div style={{ marginTop: "1.25rem" }}>
              <div className="summary-meta">
                <span className="muted">URL:</span> <span>{data.url}</span>
              </div>
              <div
                className="card-header"
                style={{ padding: 0, marginBottom: "0.5rem" }}
              >
                <h3 className="card-title" style={{ fontSize: "1rem" }}>
                  {data.title}
                </h3>
                <span className={toneToClass(data.tone)}>{data.tone}</span>
              </div>
              <div className="summary-meta">
                <span>
                  <strong>Political article:</strong>{" "}
                  {data.isPolitical ? "Yes" : "No"}
                </span>
              </div>

              {data.politicalTopics.length > 0 && (
                <div>
                  <p className="summary-section-title">Political topics</p>
                  <div className="tag-row">
                    {data.politicalTopics.map((topic) => (
                      <span className="tag" key={topic}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="summary-section-title">Summary</p>
              <p className="summary-text">{data.summary}</p>

              <p className="summary-section-title">Keywords</p>
              <div className="tag-row">
                {data.keywords.map((k) => (
                  <span className="tag" key={k}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right: history */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">History</h2>
              <p className="card-subtitle">
                Recently summarized articles, newest first.
              </p>
            </div>
            <button
              className="button button-secondary"
              type="button"
              onClick={loadHistory}
            >
              Refresh
            </button>
          </div>

          {!historyLoaded && (
            <p className="muted">
              Click <strong>Refresh</strong> to load your recent summaries.
            </p>
          )}

          {historyLoaded && history.length === 0 && (
            <p className="muted">No summaries saved yet.</p>
          )}

          {history.length > 0 && (
            <ul className="history-list">
              {history.map((h) => (
                <li className="history-item" key={h.id}>
                  <div className="history-item-title">{h.title}</div>
                  <div className="history-item-meta">
                    {new Date(h.createdAt).toLocaleString()} ·{" "}
                    {h.isPolitical ? "Political" : "Non-political"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
