# 📘 Briefly – AI-Powered Article Summarizer

**Briefly** is a full-stack web application that extracts article content from any URL, analyzes it using OpenAI, and produces a clean summary with tone detection, keyword extraction, and political-context classification.

It includes robust error handling for sites that block scraping and provides a **“paste text instead”** fallback, making it reliable across a wide range of content.

This project demonstrates:

- Full-stack development (React + TypeScript + Express)
- AI integration (OpenAI API)
- Web scraping & content extraction
- Database persistence (PostgreSQL + Prisma)
- Error handling & real-world scraping edge cases
- Modern responsive UI
- Clean code structure suitable for production-scale expansion

---

## 🚀 Features

### 🔗 URL Summarization

- Fetches article HTML using server-side scraping
- Extracts readable content using Mozilla Readability + custom fallbacks
- Sends text to OpenAI for structured analysis:
  - 📝 Summary
  - 🎯 Keywords
  - 🎭 Tone
  - 🏛️ Political classification (leaning + topics)

### 🧠 AI-Generated Insight

Uses OpenAI function-calling to guarantee structured output.

### 📜 Summary History

- Stores every summary in PostgreSQL
- Displays all previous summaries, newest first

### ⚠️ Advanced Error Handling

Sites often block bots or load articles via JavaScript. Briefly handles this by:

- Detecting extraction failures
- Detecting 403 forbidden scrapes
- Showing helpful messages
- Automatically offering a **“paste text instead”** option

### ⌨️ Manual Text Summarization

If extraction fails, users can paste article text directly.

---

## 📁 Tech Stack

### Frontend

- React + TypeScript
- Vite
- Modern responsive UI
- CSS custom styles

### Backend

- Node.js + Express
- TypeScript
- OpenAI integration
- Content extraction via Readability + HTML fallbacks
- Prisma ORM (Prisma 7 with `@prisma/adapter-pg`)

### Database

- PostgreSQL (Docker or external)

---

## 📦 Installation

### 1️⃣ Clone the repo

```bash
git clone https://github.com/yourusername/briefly.git
cd briefly
```

### 2️⃣ Install and start the backend

```bash
cd server
npm install
```

Create `.env`:

```env
OPENAI_API_KEY=your-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

Generate Prisma client & migrate DB:

```bash
npx prisma migrate dev
```

Start server:

```bash
npm run dev
```

### 3️⃣ Install and start the frontend

```bash
cd ../client
npm install
npm run dev
```

---

## 🧠 API Routes

### `POST /summarize`

Input:

```json
{ "url": "https://example.com/article" }
```

### `POST /summarize-text`

Input:

```json
{
  "text": "Full article text",
  "url": "optional-url",
  "title": "optional title"
}
```

### `GET /history`

Returns last 20 summaries.

---

## 🛡️ Error Handling Strategy

Real-world scraping is messy. Briefly accounts for:

| Issue               | Example                  | Response            |
| ------------------- | ------------------------ | ------------------- |
| Bot-blocked (403)   | News sites               | Paste-text fallback |
| No readable content | JS-only pages            | Fallback selectors  |
| Fragmented content  | Academic journal layouts | Combined extraction |
| Unreachable URL     | Network                  | Friendly error      |

---

## 📐 System Architecture

```
Client (React)
    ↓
Express API (/summarize, /summarize-text, /history)
    ↓
Scraper (Readability + fallbacks)
    ↓
OpenAI (summary + tone + politics)
    ↓
PostgreSQL (Prisma)
```

---
