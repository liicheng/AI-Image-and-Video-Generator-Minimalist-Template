import { Pool } from "pg";

// 链接池，所有的连接都维护在这个连接池里面
let globalPool: Pool;

export function getDb() {
  if (!globalPool) {
    // 使用单独的环境变量，避免URL编码问题
    const password = process.env.POSTGRES_PASSWORD || '#H4?-!AgD8rnz+w';
    
    globalPool = new Pool({
      host: process.env.POSTGRES_HOST || 'aws-1-us-east-2.pooler.supabase.com',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      user: process.env.POSTGRES_USER || 'postgres',
      password: password,
      database: process.env.POSTGRES_DATABASE || 'postgres',
      ssl: {
        rejectUnauthorized: false, // 允许自签名证书
      },
    });
  }

  return globalPool;
}