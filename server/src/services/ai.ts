import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type RecipeExtractionResult = {
  title: string;
  servings?: string;
  totalTime?: string;
  ingredients: string[]; // each string is one ingredient line, copied from the recipe
  steps: string[]; // each string is one instruction step
  isRecipe: boolean;
};

/**
 * Given the main text of a webpage (ideally a recipe page),
 * extract a structured recipe: ingredients and steps.
 *
 * Very important: ingredients must match the site's recipe list as closely as possible.
 */
export async function extractRecipe(
  content: string
): Promise<RecipeExtractionResult> {
  const systemPrompt = `
You are a highly reliable recipe extractor.

You are given the main text content of a web page that may or may not contain a cooking recipe.

Typical structure of these pages:
- At the top: vague descriptions, stories, personal notes, SEO text.
- Further down: the actual recipe card or sections titled "Ingredients" and "Instructions"/"Directions"/"Method".

Your job:

1. Focus on the actual recipe section:
   - Prefer any clearly marked "Ingredients" and "Instructions"/"Directions"/"Method" sections that appear near the bottom of the content.
   - Ignore introductory paragraphs, anecdotes, blog content, SEO fluff, and any general ingredient descriptions that appear before the real ingredient list.
   - Ignore comments, unrelated notes, and footer content that appears after the instructions.

2. Extract a clean, concise recipe title.
   - Prefer the title from the recipe section or recipe card, not the blog post title if they differ.

3. Extract servings and total time (if present).
   - Servings: "Serves 4", "Yield: 8 slices", etc.
   - Total time: "45 minutes", "1 hr 10 min", etc.

4. Extract the ingredients as an array of STRINGS:
   - Each string should correspond to a single ingredient line from the recipe's ingredient list (the list with measurements).
   - Copy each ingredient line as literally as possible from that list.
   - Do NOT change numeric amounts, ranges, or fractions.
   - Do NOT convert between units (no cups ↔ tablespoons, grams ↔ ounces, etc.).
   - Do NOT "normalize" or "improve" the ingredient list.
   - Do NOT invent ingredients or amounts.
   - If the recipe has multiple ingredient groups (like "For the sauce", "For the pastry"), you may keep the group labels as separate lines or inline.

5. Extract the steps as an ordered list of STRINGS:
   - Use the actual step-by-step instructions from the recipe section.
   - Preserve the logical step boundaries.
   - IMPORTANT LENGTH RULES:
       - No step string should be longer than about 2 sentences or 300 characters.
       - If the source text has a very long paragraph with multiple actions, you MUST split it into multiple sequential steps.
   - If the original had numbered steps or bullet points, treat each one as its own step (one array element per step).
   - Do NOT merge multiple numbered or clearly separate actions into one giant step.
   - Do NOT invent extra steps or remove important ones.


RECIPE vs NON-RECIPE DECISION:

- You should assume the content IS a recipe if you see:
  - A compact ingredient list (multiple lines with quantities and food items), AND
  - A clear set of cooking steps / method / instructions.
- In that case, you MUST set isRecipe to true and fill ingredients and steps.
- Only set isRecipe to false when there is clearly NO ingredient list and NO cooking steps (for example, a pure article with no recipe).

You MUST respond with **only valid JSON**, matching exactly this TypeScript type:

type RecipeExtractionResult = {
  title: string;
  servings?: string;
  totalTime?: string;
  ingredients: string[];
  steps: string[];
  isRecipe: boolean;
};

IMPORTANT JSON RULES:
- Do NOT use undefined, NaN, Infinity, or comments.
- If a field is unknown or missing, either omit it or use null or an empty string/array as appropriate.
- Do NOT include trailing commas before } or ].
- Do NOT wrap the JSON in backticks or markdown.

Do not include any explanation, markdown, or extra text outside the JSON.
`.trim();

  const userPrompt = `
Here is the main text content of a webpage.

Extract the recipe IF it is clearly a cooking recipe.

Content:
---------
${content}
---------
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content;

  if (!raw) {
    throw new Error("OpenAI returned no content for recipe extraction");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse recipe JSON:", raw);
    throw new Error("Failed to parse recipe extraction result from OpenAI");
  }

  console.log("Extracted recipe: ", parsed.ingredients);

  const result: RecipeExtractionResult = {
    title: parsed.title || "Untitled recipe",
    servings: parsed.servings || "",
    totalTime: parsed.totalTime || "",
    ingredients: Array.isArray(parsed.ingredients)
      ? parsed.ingredients.filter((x: any) => typeof x === "string")
      : [],
    steps: Array.isArray(parsed.steps)
      ? parsed.steps.filter((x: any) => typeof x === "string")
      : [],
    isRecipe: parsed.isRecipe ?? false,
  };

  return result;
}
