import { Pool } from "pg";

// 链接池，所有的连接都维护在这个连接池里面
let globalPool: Pool;

export function getDb() {
  if (!globalPool) {
    // 优先使用NEXT_PUBLIC_环境变量（确保可用）
    const connectionString = process.env.NEXT_PUBLIC_POSTGRES_URL || process.env.POSTGRES_URL;
    
    if (connectionString) {
      console.log('=== DATABASE CONNECTION ===');
      console.log('Using connection string:', connectionString.replace(/:([^:@]+)@/, ':***@'));
      console.log('Source:', process.env.NEXT_PUBLIC_POSTGRES_URL ? 'NEXT_PUBLIC_POSTGRES_URL' : 'POSTGRES_URL');
      console.log('========================');
      
      globalPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });
    } else {
      // 备用：使用NEXT_PUBLIC_环境变量
      const sslMode = process.env.NEXT_PUBLIC_POSTGRES_SSLMODE || process.env.POSTGRES_SSLMODE || 'require';
      const password = process.env.NEXT_PUBLIC_POSTGRES_PASSWORD || process.env.POSTGRES_PASSWORD || 'zhang960222..';
      const host = process.env.NEXT_PUBLIC_POSTGRES_HOST || process.env.POSTGRES_HOST || 'aws-1-us-east-2.pooler.supabase.com';
      const port = parseInt(process.env.NEXT_PUBLIC_POSTGRES_PORT || process.env.POSTGRES_PORT || '6543');
      const user = process.env.NEXT_PUBLIC_POSTGRES_USER || process.env.POSTGRES_USER || 'postgres.thowwlnwywlujiajhxpv';
      const database = process.env.NEXT_PUBLIC_POSTGRES_DATABASE || process.env.POSTGRES_DATABASE || 'postgres';
      
      console.log('=== DATABASE CONNECTION ===');
      console.log('Using individual env vars, config:', {
        host,
        port,
        user,
        database,
        sslMode,
        hasPassword: !!password,
        userSource: process.env.NEXT_PUBLIC_POSTGRES_USER ? 'NEXT_PUBLIC_POSTGRES_USER' : (process.env.POSTGRES_USER ? 'POSTGRES_USER' : 'default')
      });
      console.log('========================');
      
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