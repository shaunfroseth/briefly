import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export type ExtractedArticle = {
  title: string;
  content: string;
};

export async function extractArticleFromUrl(
  url: string
): Promise<ExtractedArticle> {
  const res = await fetch(url, {
    headers: {
      // Pretend to be a normal modern browser
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
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent) {
    throw new Error("Could not extract readable article content");
  }

  return {
    title: article.title || "Untitled article",
    content: article.textContent,
  };
}
