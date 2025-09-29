import { pool } from "@/db/pool";

export async function getById(id: number) {
  const res = await pool.query(`SELECT * FROM subscription_plans WHERE id = $1`, [id]);
  return res.rows[0];
}

export async function getByStripePriceId(id: number) {
  const res = await pool.query(`SELECT * FROM subscription_plans WHERE id = $1`, [id]);
  return res.rows[0];
}
  