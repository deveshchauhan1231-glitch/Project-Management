# Project Manager API

The server uses Prisma with PostgreSQL.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string.
2. Install dependencies:

```bash
npm install
```

3. Generate Prisma Client:

```bash
npm run db:generate
```

4. Create or update the PostgreSQL tables from `prisma/schema.prisma`:

```bash
npm run db:push
```

5. Start the API:

```bash
npm run dev
```

Do not run the old `schema.sql`; Prisma is now the source of truth for the database schema.