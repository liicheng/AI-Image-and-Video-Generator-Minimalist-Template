import { Pool } from "pg";

// 链接池，所有的连接都维护在这个连接池里面
let globalPool: Pool;

export function getDb() {
  if (!globalPool) {
    // 使用单独的环境变量，避免URL编码问题
    const sslMode = process.env.POSTGRES_SSLMODE || 'require';
    const password = process.env.POSTGRES_PASSWORD || 'zhang960222..';
    const host = process.env.POSTGRES_HOST || 'aws-1-us-east-2.pooler.supabase.com';
    const port = parseInt(process.env.POSTGRES_PORT || '6543');
    const user = process.env.POSTGRES_USER || 'postgres.thowwlnwywlujiajhxpv';
    const database = process.env.POSTGRES_DATABASE || 'postgres';
    
    // 调试信息
    console.log('Database connection config:', {
      host,
      port,
      user,
      database,
      sslMode,
      envUser: process.env.POSTGRES_USER
    });
    
    globalPool = new Pool({
      host,
      port,
      user,
      password,
      database,
      ssl: sslMode === 'require' ? { rejectUnauthorized: false } : false,
    });
  }

  return globalPool;
}