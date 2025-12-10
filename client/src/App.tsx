import { useState } from "react";
import axios from "axios";
import { RecipeSkeleton } from "./components/RecipeSkeleton";

type Recipe = {
  id: number;
  url: string;
  title: string;
  servings: string | null;
  totalTime: string | null;
  ingredients: string[];
  steps: string[];
  createdAt: string;
};

type ApiError = {
  error?: string;
  errorCode?: string;
};

const API_BASE = "http://localhost:4000";

function normalizeRecipe(raw: any): Recipe {
  return {
    id: raw.id,
    url: raw.url,
    title: raw.title,
    servings: raw.servings ?? null,
    totalTime: raw.totalTime ?? null,
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients : [],
    steps: Array.isArray(raw.steps) ? raw.steps : [],
    createdAt: raw.createdAt,
  };
}

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Recipe[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  const isExtracting = loading || manualLoading;

  async function loadHistory() {
    try {
      setError(null);
      const res = await axios.get<Recipe[]>(`${API_BASE}/history`);
      const normalized = res.data.map(normalizeRecipe);
      setHistory(normalized);
      setHistoryLoaded(true);
    } catch (err) {
      console.error(err);
      setError("Failed to load recipe history");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setData(null);
    setShowManualInput(false);

    try {
      const res = await axios.post(`${API_BASE}/summarize`, { url });
      const recipe = normalizeRecipe(res.data);
      setData(recipe);
      loadHistory();
    } catch (err: any) {
      console.error(err);

      const apiErr: ApiError | undefined = err?.response?.data;
      const msg =
        apiErr?.error ||
        err?.message ||
        "Something went wrong extracting the recipe.";

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
      const res = await axios.post(`${API_BASE}/summarize-text`, {
        text: manualText,
        title: "",
        url,
      });
      const recipe = normalizeRecipe(res.data);
      setData(recipe);
      loadHistory();
    } catch (err: any) {
      console.error(err);
      const apiErr: ApiError | undefined = err?.response?.data;
      setError(
        apiErr?.error ||
          err?.message ||
          "Something went wrong summarizing the pasted recipe."
      );
    } finally {
      setManualLoading(false);
    }
  };

  const handleHistoryClick = (recipe: Recipe) => {
    setData(recipe);
    setUrl(recipe.url === "manual-input" ? "" : recipe.url);
    setShowManualInput(false);
    setManualText("");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo-mark">B</div>
        <div>
          <h1 className="app-title">Briefly (Recipes)</h1>
          <p className="app-subtitle">
            Paste a recipe URL to strip away the fluff and get only the
            ingredients and step-by-step instructions. If a site blocks
            automated access, you can paste the recipe text instead.
          </p>
        </div>
      </header>

      {error && <p className="error-text">{error}</p>}

      <main className="app-grid">
        {/* Left: input + latest recipe */}
        <section className={`card ${data ? "card--active" : ""}`}>
          <div className="card-header">
            <div>
              <h2 className="card-title">New recipe</h2>
              <p className="card-subtitle">
                Paste a recipe URL and we&apos;ll extract what you actually need
                to cook.
              </p>
            </div>
          </div>

          <form className="url-form" onSubmit={handleSubmit}>
            <input
              type="url"
              className="url-input"
              placeholder="https://example.com/my-favorite-recipe"
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
                {loading ? "Extracting recipe..." : "Extract recipe"}
              </button>
              {loading && (
                <div className="loading-row">
                  <div className="spinner" />
                  <span className="muted">Working on this recipe…</span>
                </div>
              )}
            </div>
          </form>

          {showManualInput && (
            <div style={{ marginTop: "1.25rem" }}>
              <p className="muted">
                This site is hard to read automatically. If you like, copy and
                paste the full recipe text (ingredients and steps) below and
                I&apos;ll extract it from there.
              </p>
              <textarea
                rows={8}
                className="url-input"
                style={{ fontFamily: "monospace", marginTop: "0.5rem" }}
                placeholder="Paste the recipe text here..."
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
                  {manualLoading
                    ? "Extracting from text..."
                    : "Extract from pasted text"}
                </button>
              </div>
            </div>
          )}

          {/* Skeleton while extracting and no recipe yet */}
          {isExtracting && !data && (
            <div style={{ marginTop: "1.25rem" }}>
              <RecipeSkeleton />
            </div>
          )}

          {/* Actual recipe */}
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
              </div>

              <div className="summary-meta">
                {data.servings && <span>Servings: {data.servings}</span>}
                {data.servings && data.totalTime && <span> · </span>}
                {data.totalTime && <span>Total time: {data.totalTime}</span>}
              </div>

              <p className="summary-section-title">Ingredients</p>
              {data.ingredients.length === 0 ? (
                <p className="muted">
                  No ingredients were detected. This might not be a standard
                  recipe format.
                </p>
              ) : (
                <ul className="summary-text">
                  {data.ingredients.map((line, idx) => (
                    <li key={`${line}-${idx}`}>{line}</li>
                  ))}
                </ul>
              )}

              <p className="summary-section-title">Steps</p>
              {data.steps.length === 0 ? (
                <p className="muted">
                  No steps were detected. This might not be a standard recipe
                  format.
                </p>
              ) : (
                <ol className="steps-list">
                  {data.steps.map((step, idx) => (
                    <li key={idx} className="step-item">
                      <div className="step-number">{idx + 1}</div>
                      <div className="step-content">{step}</div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>

        {/* Right: history */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">History</h2>
              <p className="card-subtitle">
                Recently extracted recipes, newest first. Click one to reopen
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
              Click <strong>Refresh</strong> to load your recent recipes.
            </p>
          )}

          {historyLoaded && history.length === 0 && (
            <p className="muted">No recipes saved yet.</p>
          )}

          {history.length > 0 && (
            <ul className="history-list">
              {history.map((r) => (
                <li
                  className="history-item"
                  key={r.id}
                  onClick={() => handleHistoryClick(r)}
                >
                  <div className="history-item-title">{r.title}</div>
                  <div className="history-item-meta">
                    {new Date(r.createdAt).toLocaleString()}
                    {r.servings && ` · ${r.servings}`}
                    {r.totalTime && ` · ${r.totalTime}`}
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
