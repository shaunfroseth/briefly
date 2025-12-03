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
    // 1) Fetch and extract article text
    const { title, content } = await extractArticleFromUrl(url);

    // 2) (Optional) limit content length to keep token usage sane
    const maxChars = 8000;
    const trimmedContent =
      content.length > maxChars ? content.slice(0, maxChars) : content;

    // 3) Send to OpenAI for summarization
    const { summary, keywords, tone, is_political, political_topics } =
      await summarizeArticle(trimmedContent);

    // 4) Return to client
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
    return res.status(500).json({
      error: err?.message || "Failed to summarize article",
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
