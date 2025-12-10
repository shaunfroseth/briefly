// server/src/index.ts
import express from "express";
import cors from "cors";
import "dotenv/config";

import { extractArticleFromUrl } from "./services/scraper";
import { extractRecipe } from "./services/ai";
import { saveRecipe, getRecentRecipes } from "./services/db";

const app = express();
const PORT = process.env.PORT || 4000;
const MAX_RECIPE_CHARS = 24000;

// Allow the frontend to talk to this API
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev
      // add your deployed frontend origin here, e.g.:
      // "https://briefly-recipes.vercel.app",
    ],
    methods: ["GET", "POST", "OPTIONS"],
  })
);

app.use(express.json());

// Simple health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * Focus on the part of the page that actually looks like a recipe.
 * We try to start near the first "Ingredients" heading and keep up to
 * MAX_RECIPE_CHARS characters from there.
 */
function focusOnRecipeSection(full: string): string {
  const lower = full.toLowerCase();

  const markers = ["ingredients", "ingredient"];
  let idx = -1;

  // Find the first occurrence of "ingredients"
  for (const m of markers) {
    const pos = lower.indexOf(m);
    if (pos !== -1 && (idx === -1 || pos < idx)) {
      idx = pos;
    }
  }

  if (idx !== -1) {
    const start = Math.max(0, idx - 500); // a bit of context above the heading
    // 👇 IMPORTANT: no artificial cap, keep everything to the end
    return full.slice(start);
  }

  // Fallback: if we can't find "ingredients", you can still cap for safety
  if (full.length > MAX_RECIPE_CHARS) {
    return full.slice(full.length - MAX_RECIPE_CHARS);
  }

  return full;
}

/**
 * POST /summarize
 *
 * Body: { url: string }
 *
 * For a recipe URL, this:
 *  - fetches the page
 *  - extracts main text
 *  - runs extractRecipe(content)
 *  - saves the recipe
 *  - returns the saved recipe row
 */
app.post("/summarize", async (req, res) => {
  const { url } = req.body as { url?: string };

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const { content } = await extractArticleFromUrl(url);

    const trimmedContent = focusOnRecipeSection(content);
    const recipe = await extractRecipe(trimmedContent);

    if (!recipe.isRecipe) {
      return res.status(400).json({
        errorCode: "NOT_A_RECIPE",
        error:
          "This page doesn't look like a cooking recipe. Try another link.",
      });
    }

    const saved = await saveRecipe(url, recipe);
    return res.json(saved);
  } catch (err: any) {
    console.error("Error in /summarize:", err);
    const msg = String(err?.message || "");

    if (msg.includes("Could not extract readable article content")) {
      return res.status(400).json({
        errorCode: "EXTRACT_FAILED",
        error:
          "I couldn't reliably extract the recipe from this page. Some sites are heavily scripted or use unusual layouts.",
      });
    }

    if (msg.includes("Failed to fetch URL: 403")) {
      return res.status(400).json({
        errorCode: "FETCH_FORBIDDEN",
        error:
          "This site is blocking automated access. You can open it in your browser, but I can't read it directly.",
      });
    }

    return res.status(500).json({
      errorCode: "UNKNOWN",
      error: "Something went wrong while extracting the recipe.",
    });
  }
});

/**
 * POST /summarize-text
 *
 * Body: { text: string; title?: string; url?: string }
 *
 * For when the site blocks scraping: user pastes the recipe text manually.
 */
app.post("/summarize-text", async (req, res) => {
  const { text, title, url } = req.body as {
    text?: string;
    title?: string;
    url?: string;
  };

  if (!text || typeof text !== "string" || text.trim().length < 50) {
    return res.status(400).json({
      error: "Please provide at least a few sentences of recipe text.",
    });
  }

  try {
    const trimmedContent = focusOnRecipeSection(text);
    const recipe = await extractRecipe(trimmedContent);

    if (!recipe.isRecipe) {
      return res.status(400).json({
        errorCode: "NOT_A_RECIPE",
        error:
          "The text you pasted doesn't look like a cooking recipe. Make sure you include ingredients and steps.",
      });
    }

    if (title && title.trim()) {
      recipe.title = title.trim();
    }

    const saved = await saveRecipe(url || "manual-input", recipe);
    return res.json(saved);
  } catch (err: any) {
    console.error("Error in /summarize-text:", err);

    return res.status(500).json({
      error: "Something went wrong while summarizing the pasted recipe.",
    });
  }
});

/**
 * GET /history
 *
 * Returns the most recent recipes, newest first.
 */
app.get("/history", async (_req, res) => {
  try {
    const recipes = await getRecentRecipes(20);
    res.json(recipes);
  } catch (err) {
    console.error("Error in /history:", err);
    res.status(500).json({ error: "Failed to load recipe history." });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
