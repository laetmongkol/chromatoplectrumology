// Promotes an existing account to admin.  Usage: npm run make-admin -- someone@example.com
// Sign up through the site first, then run this once.

import { neon } from "@neondatabase/serverless";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const sql = neon(url);

const rows = await sql`update "user" set role = 'admin', updated_at = now() where lower(email) = lower(${email}) returning email, role`;
if (rows.length === 0) {
  console.error("No account with that email. Sign up on the site first.");
  process.exit(1);
}
console.log(`${rows[0].email} is now ${rows[0].role}`);
