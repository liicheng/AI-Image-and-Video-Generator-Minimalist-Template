import { Pool } from "pg";

// 链接池，所有的连接都维护在这个连接池里面
let globalPool: Pool;

export function getDb() {
  if (!globalPool) {
    // 优先使用完整连接字符串
    const connectionString = process.env.POSTGRES_URL;
    
    if (connectionString) {
      console.log('Using connection string:', connectionString.replace(/:([^:@]+)@/, ':***@'));
      globalPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });
    } else {
      // 备用：使用单独的环境变量
      const sslMode = process.env.POSTGRES_SSLMODE || 'require';
      const password = process.env.POSTGRES_PASSWORD || 'zhang960222..';
      const host = process.env.POSTGRES_HOST || 'aws-1-us-east-2.pooler.supabase.com';
      const port = parseInt(process.env.POSTGRES_PORT || '6543');
      const user = process.env.POSTGRES_USER || 'postgres.thowwlnwywlujiajhxpv';
      const database = process.env.POSTGRES_DATABASE || 'postgres';
      
      console.log('Using individual env vars, config:', {
        host,
        port,
        user,
        database,
        sslMode,
        hasPassword: !!password
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
  }

  return globalPool;
}