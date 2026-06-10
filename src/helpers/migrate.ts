import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
