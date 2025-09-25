import { Pool } from "pg";

// 链接池，所有的连接都维护在这个连接池里面
let globalPool: Pool;

export function getDb() {
  if (!globalPool) {
    // 调试：输出环境变量
    console.log('=== Database Connection Debug ===');
    console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);
    console.log('POSTGRES_PORT:', process.env.POSTGRES_PORT);
    console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
    console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? '***' : 'NOT SET');
    console.log('POSTGRES_DATABASE:', process.env.POSTGRES_DATABASE);
    console.log('POSTGRES_SSLMODE:', process.env.POSTGRES_SSLMODE);
    
    // 使用单独的环境变量，避免URL编码问题
    const sslMode = process.env.POSTGRES_SSLMODE || 'require';
    const password = process.env.POSTGRES_PASSWORD || 'zhang960222..';
    
    globalPool = new Pool({
      host: process.env.POSTGRES_HOST || 'thowwlnwywlujiajhxpv.pooler.supabase.com',
      port: parseInt(process.env.POSTGRES_PORT || '6543'),
      user: process.env.POSTGRES_USER || 'postgres',
      password: password,
      database: process.env.POSTGRES_DATABASE || 'postgres',
      ssl: sslMode === 'require' ? { rejectUnauthorized: false } : false,
    });
  }

  return globalPool;
}