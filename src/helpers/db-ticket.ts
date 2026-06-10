import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface BugTicket {
  component: string;
  file_path: string;
  assertion: string;
  reasoning: string;
  screenshot_path: string;
}

export async function insertBugTicket(ticket: BugTicket): Promise<number> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO ui_bug_tickets (component, file_path, assertion, reasoning, screenshot_path, status, created_at)
     VALUES ($1, $2, $3, $4, $5, 'open', now())
     RETURNING id`,
    [ticket.component, ticket.file_path, ticket.assertion, ticket.reasoning, ticket.screenshot_path]
  );
  return result.rows[0].id;
}

export async function getOpenTickets(): Promise<Array<BugTicket & { id: number }>> {
  const result = await pool.query<BugTicket & { id: number }>(
    `SELECT id, component, file_path, assertion, reasoning, screenshot_path
     FROM ui_bug_tickets WHERE status = 'open' ORDER BY created_at ASC`
  );
  return result.rows;
}

export async function resolveTicket(id: number): Promise<void> {
  await pool.query(
    `UPDATE ui_bug_tickets SET status = 'resolved', resolved_at = now() WHERE id = $1`,
    [id]
  );
}

export async function closePool() {
  await pool.end();
}
