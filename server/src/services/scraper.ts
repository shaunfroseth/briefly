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

  // ---- 1) Try Readability first
  const reader = new Readability(doc);
  const article = reader.parse();

  let title =
    article?.title ||
    doc.querySelector("title")?.textContent ||
    "Untitled article";
  let content = (article?.textContent || "").trim();

  // ---- 2) Fallback: manually grab paragraph text if Readability fails or is very short
  if (!content || content.length < 800) {
    console.log("Fallback: manual paragraph extraction for", url);
    const paragraphNodes = Array.from(
      doc.querySelectorAll(
        "article p, main p, [role='main'] p, .content p, .article-body p, body p"
      )
    );

    console.log(`Found ${paragraphNodes.length} paragraph nodes`);

    const paragraphText = paragraphNodes
      .map((p) => p.textContent?.trim() || "")
      .filter((t) => t.length > 0);

    const joined = paragraphText.join("\n\n").trim();

    if (joined.length > content.length) {
      content = joined;
    }
  }

  // ---- 3) Final sanity check
  if (!content || content.split(/\s+/).length < 50) {
    // still basically empty
    throw new Error("Could not extract readable article content");
  }

  return { title, content };
}
