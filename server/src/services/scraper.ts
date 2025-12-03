import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export type ExtractedArticle = {
  title: string;
  content: string;
};

export async function extractArticleFromUrl(
  url: string
): Promise<ExtractedArticle> {
  const res = await fetch(url);

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
