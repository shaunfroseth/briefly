# 🍳 Briefly Recipes

**Briefly Recipes** is a full-stack web application that extracts the _actual_ useful parts of online cooking recipes — ingredients with measurements and step-by-step instructions — and strips away ads, popups, and long-winded blog content.

Paste a recipe URL, and Briefly gives you a clean, readable recipe you can actually cook from.

---

## ✨ Features

- 🧾 Extracts **ingredients with measurements**
- 🪜 Generates **step-by-step cooking instructions**
- 🔗 Accepts recipe URLs from popular cooking sites
- ✂️ Removes ads, SEO fluff, and personal blog content
- 📜 Stores recent extracted recipes
- 🧠 Uses AI to normalize messy recipe formats
- 🌙 Clean, dark-mode friendly UI

---

## 🏗️ Architecture

| Layer       | Technology                     | Hosting |
| ----------- | ------------------------------ | ------- |
| Frontend    | React + TypeScript + Vite      | Vercel  |
| Backend API | Node.js + Express + TypeScript | Render  |
| Database    | PostgreSQL                     | Neon    |
| ORM         | Prisma                         | —       |
| AI          | OpenAI API                     | —       |

---

## 🌐 Live Deployment

- **Frontend:** https://briefly-ruby.vercel.app/
- **API:** https://briefly-api-786m.onrender.com

> ⚠️ The API may take a few seconds to respond on first request due to Render free-tier cold starts.

---

## 🧠 How It Works

1. User submits a recipe URL
2. Backend fetches and scrapes the page HTML
3. Relevant recipe content is extracted (ingredients + instructions)
4. AI processes the content into a structured format
5. Recipe is saved to the database
6. Clean recipe is returned to the frontend

If a site blocks scraping, users can manually paste recipe text instead.

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Axios
- Custom CSS

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- OpenAI API
- JSDOM

### Database

- PostgreSQL (Neon)

---

## 🚀 Running Locally

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/briefly-recipes.git
cd briefly-recipes
```

### 2️⃣ Backend setup

```bash
cd server
npm install
```

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
OPENAI_API_KEY=your_openai_api_key
```

```bash
npx prisma migrate dev
npm run dev
```

Backend runs at `http://localhost:4000`

### 3️⃣ Frontend setup

```bash
cd client
npm install
```

`VITE_API_BASE_URL=http://localhost:4000`

```bash
npm run dev
```

`Frontend runs at http://localhost:5173`

---

## 🧪 API Endpoints

### POST /summarize

```json
{
  "url": "https://example.com/recipe"
}
```

### POST /summarize-text

```json
{
  "text": "Ingredients...\nInstructions..."
}
```

### GET /history

Returns the most recent extracted recipes

---

## ⚠️ Known Limitations

- Some sites block automated scraping
- Very long or heavily scripted pages may fail extraction
- Free-tier hosting may cause slow first requests
- No user accounts yet

---

## 🧭 Future Improvements

- User accounts & saved recipes
- Ingredient scaling
- Unit conversion (metric ↔ imperial)
- Shopping list generation
- Chrome extension
- Mobile optimization
