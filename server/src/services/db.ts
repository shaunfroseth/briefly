import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Create a pg connection pool using the DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Wrap the pool in Prisma's Postgres adapter
const adapter = new PrismaPg(pool);

// Instantiate PrismaClient with the adapter (required in Prisma 7)
export const prisma = new PrismaClient({
  adapter,
});

// Convenience helpers
export async function saveArticle(data: {
  url: string;
  title: string;
  summary: string;
  keywords: string[];
  tone: string;
  isPolitical: boolean;
  politicalTopics: string[];
}) {
  return prisma.article.create({ data });
}

export async function getRecentArticles(limit: number = 20) {
  return prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
