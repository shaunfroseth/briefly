// server/src/services/db.ts
import "dotenv/config";
import { PrismaClient, type Recipe } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import type { RecipeExtractionResult } from "./ai";

// Create a pg connection pool using the DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Wrap the pool in Prisma's Postgres adapter (required pattern in Prisma 7)
const adapter = new PrismaPg(pool);

// Instantiate PrismaClient with the adapter
export const prisma = new PrismaClient({
  adapter,
});

/**
 * Save a recipe extracted from a URL into the database.
 * We ignore the `isRecipe` flag for storage; the route should check that before calling this.
 */
export async function saveRecipe(
  url: string,
  recipe: RecipeExtractionResult
): Promise<Recipe> {
  const { title, servings, totalTime, ingredients, steps } = recipe;

  return prisma.recipe.create({
    data: {
      url,
      title: title || "Untitled recipe",
      servings: servings || null,
      totalTime: totalTime || null,
      ingredients, // stored as Json
      steps, // stored as Json
    },
  });
}

/**
 * Get recent recipes, newest first.
 */
export async function getRecentRecipes(limit: number = 20): Promise<Recipe[]> {
  return prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
