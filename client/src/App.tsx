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
  createdAt: string;
};

type ApiError = {
  error?: string;
  errorCode?: string;
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

  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

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
    setShowManualInput(false);

    try {
      const res = await axios.post<Article>("http://localhost:4000/summarize", {
        url,
      });
      setData(res.data);
      loadHistory();
    } catch (err: any) {
      console.error(err);

      const apiErr: ApiError | undefined = err?.response?.data;
      const msg =
        apiErr?.error || err?.message || "Something went wrong summarizing.";

      setError(msg || null);

      if (
        apiErr?.errorCode === "EXTRACT_FAILED" ||
        apiErr?.errorCode === "FETCH_FORBIDDEN"
      ) {
        setShowManualInput(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeText = async () => {
    setError(null);
    setManualLoading(true);
    setData(null);

    try {
      const res = await axios.post<Article>(
        "http://localhost:4000/summarize-text",
        {
          text: manualText,
          title: "",
          url,
        }
      );
      setData(res.data);
      loadHistory();
    } catch (err: any) {
      console.error(err);
      const apiErr: ApiError | undefined = err?.response?.data;
      setError(
        apiErr?.error ||
          err?.message ||
          "Something went wrong summarizing the pasted text."
      );
    } finally {
      setManualLoading(false);
    }
  };

  const handleHistoryClick = (article: Article) => {
    setData(article);
    setUrl(article.url === "manual-input" ? "" : article.url);
    setShowManualInput(false);
    setManualText("");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo-mark">B</div>
        <div>
          <h1 className="app-title">Briefly</h1>
          <p className="app-subtitle">
            Paste an article URL to get an AI-generated summary, tone, and
            topical tags. If a site blocks automated access, you can paste the
            text instead.
          </p>
        </div>
      </header>

      {error && <p className="error-text">{error}</p>}

      <main className="app-grid">
        {/* Left: input + latest summary */}
        <section className={`card ${data ? "card--active" : ""}`}>
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
                className={`button button-primary ${
                  loading ? "button--loading" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Summarizing..." : "Summarize article"}
              </button>
            </div>
          </form>

          {showManualInput && (
            <div style={{ marginTop: "1.25rem" }}>
              <p className="muted">
                This site is hard to read automatically. If you like, copy and
                paste the article text below and I&apos;ll summarize that
                instead.
              </p>
              <textarea
                rows={8}
                className="url-input"
                style={{ fontFamily: "monospace", marginTop: "0.5rem" }}
                placeholder="Paste the article text here..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
              <div className="btn-row" style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={manualLoading || manualText.trim().length < 50}
                  onClick={handleSummarizeText}
                >
                  {manualLoading ? "Summarizing..." : "Summarize pasted text"}
                </button>
              </div>
            </div>
          )}

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
                Recently summarized articles, newest first. Click one to reopen
                it.
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
                <li
                  className="history-item"
                  key={h.id}
                  onClick={() => handleHistoryClick(h)}
                >
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
