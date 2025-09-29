import { Effect } from "@/backend/type/type";
import { pool } from "@/db/pool";

export async function listByType(type: number): Promise<Effect[]> {
  const res = await pool.query(`SELECT * FROM effect WHERE type = $1`, [type]);
  return res.rows;
}


export async function getById(id: number): Promise<Effect | null> {
  const res = await pool.query(`SELECT * FROM effect WHERE id = $1`, [id]);
  return res.rows[0] || null;
}
