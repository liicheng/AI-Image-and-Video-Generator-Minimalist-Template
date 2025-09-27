import { Pool } from "pg";

// 链接池，所有的连接都维护在这个连接池里面
let globalPool: Pool;

export function getDb() {
  if (!globalPool) {
    // 强制使用连接字符串，避免环境变量被截断的问题
    const connectionString = process.env.POSTGRES_URL || process.env.NEXT_PUBLIC_POSTGRES_URL;
    
    if (connectionString) {
      console.log('=== DATABASE CONNECTION ===');
      console.log('Using connection string:', connectionString.replace(/:([^:@]+)@/, ':***@'));
      console.log('Source:', process.env.POSTGRES_URL ? 'POSTGRES_URL' : 'NEXT_PUBLIC_POSTGRES_URL');
      console.log('========================');
      
      globalPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });
    } else {
      // 构建连接字符串作为备用方案
      const sslMode = process.env.NEXT_PUBLIC_POSTGRES_SSLMODE || process.env.POSTGRES_SSLMODE || 'require';
      const password = process.env.NEXT_PUBLIC_POSTGRES_PASSWORD || process.env.POSTGRES_PASSWORD || 'zhang960222..';
      let host = process.env.NEXT_PUBLIC_POSTGRES_HOST || process.env.POSTGRES_HOST || 'aws-1-us-east-2.pooler.supabase.com';
      const port = process.env.NEXT_PUBLIC_POSTGRES_PORT || process.env.POSTGRES_PORT || '6543';
      const user = process.env.NEXT_PUBLIC_POSTGRES_USER || process.env.POSTGRES_USER || 'postgres.thowwlnwywlujiajhxpv';
      const database = process.env.NEXT_PUBLIC_POSTGRES_DATABASE || process.env.POSTGRES_DATABASE || 'postgres';
      
      // 修复被截断的主机名
      if (host === 'aws-1-us-east-2.pooler.supab') {
        host = 'aws-1-us-east-2.pooler.supabase.com';
        console.log('Fixed truncated hostname:', host);
      }
      
      // 构建完整的连接字符串
      const fullConnectionString = `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=${sslMode}`;
      
      console.log('=== DATABASE CONNECTION ===');
      console.log('Built connection string from env vars');
      console.log('Host:', host);
      console.log('User:', user);
      console.log('Database:', database);
      console.log('========================');
      
      globalPool = new Pool({
        connectionString: fullConnectionString,
        ssl: { rejectUnauthorized: false }
      });
    }
  }

  return globalPool;
}