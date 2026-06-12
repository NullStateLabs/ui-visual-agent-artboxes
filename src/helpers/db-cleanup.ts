/**
 * One-time cleanup: mark all open tickets whose file_path is a URL route
 * (no "." → not a real source file) as 'skipped'.
 *
 * Run once after upgrading to the filePath-aware config:
 *   pnpm db:cleanup
 */
import { cleanupBadPathTickets, closePool } from "./db-ticket.js";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const count = await cleanupBadPathTickets();
console.log(`Marked ${count} ticket(s) with invalid file_path as 'skipped'.`);
await closePool();
