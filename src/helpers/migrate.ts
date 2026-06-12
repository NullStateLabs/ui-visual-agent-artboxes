import { Pool } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "ERROR: DATABASE_URL is not set.\n" +
      "  → Locally: add it to .env\n" +
      "  → GitHub Actions: Settings → Secrets and variables → Actions → Repository secrets → New repository secret"
    );
    process.exit(1);
  }

  const isLocalhost = process.env.DATABASE_URL.includes("localhost");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocalhost ? false : { rejectUnauthorized: true },
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ui_bug_tickets (
      id              SERIAL PRIMARY KEY,
      component       TEXT        NOT NULL,
      file_path       TEXT        NOT NULL,
      assertion       TEXT        NOT NULL,
      reasoning       TEXT        NOT NULL,
      screenshot_path TEXT        NOT NULL,
      status          TEXT        NOT NULL DEFAULT 'open',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      resolved_at     TIMESTAMPTZ
    )
  `);

  console.log("ui_bug_tickets table ready.");
  await pool.end();
}

main();
