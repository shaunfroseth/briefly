import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type SummaryResult = {
  summary: string;
  keywords: string[];
  tone: string;
  is_political: boolean;
  political_topics: string[];
};

export async function summarizeArticle(
  content: string
): Promise<SummaryResult> {
  const prompt = `
You are an assistant that analyzes online articles.

Given the article text below, you must return a JSON object with:
- "summary": a concise summary (3-5 sentences)
- "keywords": 5-7 key nouns or noun phrases as an array of strings
- "tone": one of:
  - "neutral"      -> factual, balanced, no strong feelings
  - "optimistic"   -> hopeful, positive outlook, opportunity-focused
  - "pessimistic"  -> worried, negative outlook, risk-focused
  - "critical"     -> skeptical, pointing out flaws or problems
  - "enthusiastic" -> excited, promotional, highly positive
  - "urgent"       -> warning, time-sensitive, alarmed

- "is_political": a boolean indicating whether the article is primarily about politics, public policy, government, elections, or ideological disputes.

- "political_topics": an array (0-5 items) describing political or policy-related topics if present
  (e.g. "climate policy", "healthcare reform", "immigration", "tax policy", "free speech").
  If the article is not political, return an empty array for "political_topics" and false for "is_political".

Rules:
- Only set "is_political" to true if politics, government, or public policy are central to the article.
- The JSON must be valid and strictly parseable.

Article text:
"""
${content}
"""
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a precise assistant that returns strict JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content;

  if (!raw) {
    throw new Error("No content returned from OpenAI");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse OpenAI JSON:", raw);
    throw new Error("Failed to parse AI response");
  }

  return {
    summary: parsed.summary,
    keywords: parsed.keywords,
    tone: parsed.tone,
    is_political: parsed.is_political,
    political_topics: parsed.political_topics,
  };
}
