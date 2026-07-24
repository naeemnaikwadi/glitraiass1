# Glitrai

AI-powered product image generation. Submit a product name, description, and reference image — Glitrai generates a professional prompt via Gemini and produces a high-quality image via Pollinations AI, all tracked as async jobs in Neon PostgreSQL.

## Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 15 (App Router)             |
| Language       | TypeScript 5 (strict)               |
| Styling        | Tailwind CSS v4                     |
| ORM            | Prisma 5 + driver adapters          |
| Database       | Neon PostgreSQL (serverless)        |
| AI – Prompts   | Google Gemini 2.0 Flash             |
| AI – Images    | Pollinations AI                     |
| Deployment     | Vercel                              |

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── generate/        # POST  /api/generate
│   │   ├── jobs/            # GET   /api/jobs
│   │   │   └── [id]/        # GET   /api/jobs/:id
│   │   ├── health/          # GET   /api/health
│   │   └── example/         # GET/POST /api/example
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── components/
│   ├── generate/            # GenerateForm, GeneratePageClient
│   ├── jobs/                # JobCard, JobList, ActiveJobPoller
│   ├── layout/              # Header, Footer
│   └── ui/                  # Button, Card, Badge, Input, Textarea, Toast
├── hooks/
│   └── useJobPoller.ts      # SWR-style polling hook
├── lib/
│   ├── api-response.ts      # Typed envelope helpers + withHandler()
│   ├── env.ts               # Validated env vars (throws on missing)
│   ├── errors.ts            # AppError, NotFoundError, ValidationError
│   ├── logger.ts            # Structured logger (JSON in prod, pretty in dev)
│   ├── prisma.ts            # Prisma singleton with Neon adapter
│   ├── startup.ts           # Boot health checks
│   ├── repositories/
│   │   └── job.repository.ts
│   ├── services/
│   │   ├── imageGenerator.ts
│   │   ├── job.service.ts
│   │   ├── pipeline.service.ts
│   │   └── promptGenerator.ts
│   └── validation/
│       └── job.validation.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── types/                   # Shared TypeScript types
├── utils/                   # cn, fetch, format, pagination helpers
└── public/
```

---

## Local Development

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) account (free tier is enough)
- A [Google AI Studio](https://aistudio.google.com/app/apikey) Gemini API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable               | Where to get it                                                    |
| ---------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`         | Neon console → project → Connection string (pooled, port 5432)    |
| `API_SECRET_KEY`       | Any strong random string (`openssl rand -hex 32`)                  |
| `GEMINI_API_KEY`       | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `NEXT_PUBLIC_APP_URL`  | `http://localhost:3000` for local dev                              |

### 3. Set up the database

```bash
npm run db:migrate     # Create and apply migrations (creates tables)
npm run db:generate    # Generate Prisma client (runs automatically via postinstall)
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "chore: prepare for deployment"
git push origin main
```

### 2. Import project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo.
2. Framework preset: **Next.js** (auto-detected).
3. Do **not** change Build or Output settings — `vercel.json` handles everything.

### 3. Set environment variables

In the Vercel dashboard → project → **Settings → Environment Variables**, add:

| Name                   | Value                              | Environments          |
| ---------------------- | ---------------------------------- | --------------------- |
| `DATABASE_URL`         | Neon pooled connection string      | Production, Preview   |
| `API_SECRET_KEY`       | Strong random secret               | Production, Preview   |
| `GEMINI_API_KEY`       | Your Gemini API key                | Production, Preview   |
| `NEXT_PUBLIC_APP_URL`  | `https://your-app.vercel.app`      | Production, Preview   |
| `NEXT_PUBLIC_APP_NAME` | `Glitrai`                          | Production, Preview   |

> **Neon connection string format for production:**
> ```
> postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=10
> ```
> Use the **pooled** connection string from the Neon console. The `pgbouncer=true` parameter is required for Vercel serverless functions.

### 4. Apply database migrations

Migrations run automatically as part of the Vercel build via the `buildCommand` in `vercel.json`:

```
prisma migrate deploy && next build
```

If you need to run migrations manually:

```bash
DATABASE_URL="your-neon-url" npx prisma migrate deploy
```

### 5. Deploy

Click **Deploy** in Vercel, or push to `main` — every push triggers a deploy automatically.

---

## API Reference

All endpoints return a typed JSON envelope:

```ts
// Success
{ "success": true, "data": T, "message"?: string }

// Error
{ "success": false, "error": string, "code"?: string, "details"?: unknown }
```

### POST /api/generate

Create a new image generation job. Returns immediately — poll `/api/jobs/:id` for status.

**Body:**

```json
{
  "productName": "Wireless Headphones",
  "description": "Over-ear noise-cancelling headphones with 40h battery",
  "referenceImage": "https://example.com/headphones.jpg"
}
```

**Response `201`:**

```json
{
  "success": true,
  "data": { "id": "clx...", "status": "pending", "createdAt": "2024-01-01T00:00:00Z" },
  "message": "Job created successfully"
}
```

### GET /api/jobs

List all jobs, newest first.

### GET /api/jobs/:id

Get a single job's current state. Poll until `status` is `completed` or `failed`.

**Job statuses:** `pending` → `processing` → `completed` | `failed`

### GET /api/health

Returns `200` when the server is up.

---

## Available Scripts

| Script                  | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | Start development server (localhost:3000)       |
| `npm run build`         | Production build                                |
| `npm run start`         | Start production server                         |
| `npm run lint`          | Run ESLint                                      |
| `npm run lint:fix`      | Run ESLint with auto-fix                        |
| `npm run format`        | Format all files with Prettier                  |
| `npm run db:generate`   | Generate Prisma client                          |
| `npm run db:push`       | Push schema directly (dev only, no migration)   |
| `npm run db:migrate`    | Create + apply a new migration (dev)            |
| `npm run db:migrate:prod` | Apply pending migrations (production)         |
| `npm run db:studio`     | Open Prisma Studio (DB GUI)                     |
| `npm run db:seed`       | Run the seed script                             |
| `npm run health`        | Run startup health checks against live services |
