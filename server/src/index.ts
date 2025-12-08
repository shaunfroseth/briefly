import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { summarizeArticle } from "./services/ai";
import { extractArticleFromUrl } from "./services/scraper";
import { saveArticle, getRecentArticles } from "./services/db";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/summarize", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const { title, content } = await extractArticleFromUrl(url);

    const maxChars = 8000;
    const trimmedContent =
      content.length > maxChars ? content.slice(0, maxChars) : content;

    const { summary, keywords, tone, is_political, political_topics } =
      await summarizeArticle(trimmedContent);

    const saved = await saveArticle({
      url,
      title,
      summary,
      keywords,
      tone,
      isPolitical: is_political,
      politicalTopics: political_topics,
    });

    return res.json(saved);
  } catch (err: any) {
    console.error("Error in /summarize:", err);

    const msg = String(err.message || "");

    // Couldn’t extract readable content (Readability + fallbacks failed)
    if (msg.includes("Could not extract readable article content")) {
      return res.status(400).json({
        errorCode: "EXTRACT_FAILED",
        error:
          "I couldn't reliably extract the article text from this page. Some journal or PDF-style pages are tricky.",
      });
    }

    // Fetch blocked / forbidden
    if (msg.includes("Failed to fetch URL: 403")) {
      return res.status(400).json({
        errorCode: "FETCH_FORBIDDEN",
        error:
          "This site is blocking automated access. You can open it normally in your browser but I can't read it directly.",
      });
    }

    return res.status(500).json({
      errorCode: "UNKNOWN",
      error: "Something went wrong while summarizing this article.",
    });
  }
});

app.post("/summarize-text", async (req, res) => {
  const { text, title, url } = req.body;

  if (!text || typeof text !== "string" || text.trim().length < 50) {
    return res.status(400).json({
      error: "Please provide at least a few sentences of text to summarize.",
    });
  }

  try {
    const maxChars = 8000;
    const trimmedContent =
      text.length > maxChars ? text.slice(0, maxChars) : text;

    const { summary, keywords, tone, is_political, political_topics } =
      await summarizeArticle(trimmedContent);

    const saved = await saveArticle({
      url: url || "manual-input",
      title: title || "Pasted article",
      summary,
      keywords,
      tone,
      isPolitical: is_political,
      politicalTopics: political_topics,
    });

    return res.json(saved);
  } catch (err) {
    console.error("Error in /summarize-text:", err);
    return res.status(500).json({
      error: "Something went wrong while summarizing the pasted text.",
    });
  }
});

app.get("/history", async (_req, res) => {
  try {
    const articles = await getRecentArticles(50);
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
