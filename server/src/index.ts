import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// TEMP: mocked summarize endpoint
app.post("/summarize", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // For now, this is hard-coded. We'll plug in scraping + AI later.
  return res.json({
    title: "Example Article Title",
    summary:
      "This is a placeholder summary for the provided article. Later, this will come from the OpenAI API based on the real article content.",
    keywords: ["placeholder", "summary", "article"],
    tone: "neutral",
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
