import { pool } from "@/db/pool";

export async function GET() {
  try {
    const r = await pool.query("select 1 as ok");
    const host = new URL(process.env.POSTGRES_URL!).hostname;
    const caLen = (process.env.SUPABASE_SSL_CERT || "").length;
    return new Response(JSON.stringify({ ok: r.rows[0].ok, host, caLoaded: caLen > 0 }), { status: 200 });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
}