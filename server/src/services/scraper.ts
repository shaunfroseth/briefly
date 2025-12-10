// server/src/services/scraper.ts
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";

export type ExtractedArticle = {
  title: string;
  content: string;
};

export async function extractArticleFromUrl(
  url: string
): Promise<ExtractedArticle> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Upgrade-Insecure-Requests": "1",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Basic title – just use the page title, AI will refine if needed
  const title =
    doc.querySelector("title")?.textContent?.trim() || "Untitled page";

  // -------------------------------------------
  // Full-page structured extraction (preferred)
  // -------------------------------------------

  // Collect text from regions likely to contain recipe details
  const selectors = [
    "article",
    "main",
    '[class*="recipe"]',
    '[id*="recipe"]',
    ".content",
    ".entry-content",
    ".post",
    ".post-content",
    ".recipe-card",
    ".wprm-recipe-container", // very common recipe plugin
    ".tasty-recipes", // another common recipe plugin
    ".instructions",
    ".ingredients",
  ];

  const collected: string[] = [];

  selectors.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length > 0) {
        collected.push(text);
      }
    });
  });

  // Combine unique chunks
  let content = Array.from(new Set(collected)).join("\n\n").trim();

  // Final fallback: all <p> tags if selectors didn't give us anything useful
  if (!content) {
    const paragraphs = Array.from(doc.querySelectorAll("p"))
      .map((p) => p.textContent?.trim() || "")
      .filter((t) => t.length > 0);

    content = paragraphs.join("\n\n").trim();
  }

  // If we truly have nothing, bail
  if (!content) {
    throw new Error("Could not extract readable article content");
  }

  // Debug: Write extracted content to a temporary .txt file
  try {
    const debugDir = path.join(process.cwd(), "debug-output");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir);
    }

    const fileName = `extracted_${Date.now()}.txt`;
    const filePath = path.join(debugDir, fileName);

    const debugText = [
      `URL: ${url}`,
      `TITLE: ${title}`,
      "",
      "================ EXTRACTED CONTENT ================",
      "",
      content,
      "",
      "====================================================",
    ].join("\n");

    fs.writeFileSync(filePath, debugText, "utf-8");
    console.log(`📝 Extracted content saved to: debug-output/${fileName}`);
  } catch (err) {
    console.error("Failed to write debug extraction file:", err);
  }

  return { title, content };
}
