// One-off: point the guitar at a photo showing the whole instrument, and swap an extra landing photo.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);
await sql`update instruments set image = '/images/instruments/guitar-white.jpg', image_credit = 'Shan Lu' where id = 'guitar'`;
await sql`delete from media where key = 'gold-guitar'`;
await sql`insert into media (key, path, credit, sort) values ('teal-guitar', '/images/landing/teal-guitar.jpg', 'Simon Weisser', 10) on conflict (key) do update set path = excluded.path, credit = excluded.credit`;
console.log("photos updated");
