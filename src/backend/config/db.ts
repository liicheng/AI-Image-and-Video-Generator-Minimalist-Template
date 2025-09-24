import { Pool } from "pg";

// 链接池，所有的连接都维护在这个连接池里面
let globalPool: Pool;

export function getDb() {
  if (!globalPool) {
    const connectionString = process.env.POSTGRES_URL;

    globalPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // 允许自签名证书
      },
    });
  }

  return globalPool;
}