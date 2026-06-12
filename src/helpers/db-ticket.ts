import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface BugTicket {
  component: string;
  file_path: string;
  assertion: string;
  reasoning: string;
  screenshot_path: string;
}

export interface UpsertResult {
  id: number;
  /** true = new ticket inserted; false = existing open ticket updated (screenshot refreshed) */
  isNew: boolean;
}

/**
 * Insert a new bug ticket, or — if an open ticket for the same
 * (component, assertion) already exists — refresh its screenshot and return
 * the existing id. This prevents duplicate tickets across nightly runs.
 *
 * A new ticket IS created after a regression (the old ticket was resolved,
 * then the same issue reappears).
 */
export async function upsertBugTicket(ticket: BugTicket): Promise<UpsertResult> {
  const existing = await pool.query<{ id: number }>(
    `SELECT id FROM ui_bug_tickets
     WHERE component = $1 AND assertion = $2 AND status = 'open'
     LIMIT 1`,
    [ticket.component, ticket.assertion],
  );

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await pool.query(
      `UPDATE ui_bug_tickets SET screenshot_path = $1 WHERE id = $2`,
      [ticket.screenshot_path, id],
    );
    return { id, isNew: false };
  }

  const result = await pool.query<{ id: number }>(
    `INSERT INTO ui_bug_tickets (component, file_path, assertion, reasoning, screenshot_path, status, created_at)
     VALUES ($1, $2, $3, $4, $5, 'open', now())
     RETURNING id`,
    [ticket.component, ticket.file_path, ticket.assertion, ticket.reasoning, ticket.screenshot_path],
  );
  return { id: result.rows[0].id, isNew: true };
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
