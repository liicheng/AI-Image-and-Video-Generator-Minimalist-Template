import { Pool } from "pg";

// 链接池，所有的连接都维护在这个连接池里面
let globalPool: Pool;

export function getDb() {
  if (!globalPool) {
    // 使用单独的环境变量，避免URL编码问题
    const sslMode = process.env.POSTGRES_SSLMODE || 'require';
    const password = process.env.POSTGRES_PASSWORD || 'zhang960222..';
    
    globalPool = new Pool({
      host: process.env.POSTGRES_HOST || 'aws-1-us-east-2.pooler.supabase.com',
      port: parseInt(process.env.POSTGRES_PORT || '6543'),
      user: process.env.POSTGRES_USER || 'postgres.thowwlnwywlujiajhxpv',
      password: password,
      database: process.env.POSTGRES_DATABASE || 'postgres',
      ssl: sslMode === 'require' ? { rejectUnauthorized: false } : false,
    });
  }

  return globalPool;
}