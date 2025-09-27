import { Pool } from "pg";

// Vercel环境优化的数据库连接池
let globalPool: Pool;

// 配置Node.js全局SSL设置以解决Vercel环境问题
if (process.env.VERCEL || process.env.VERCEL_ENV) {
  // 在Vercel环境中，配置全局SSL选项
  const https = require('https');
  const tls = require('tls');
  
  // 放宽全局SSL验证
  if (tls.globalOptions) {
    tls.globalOptions.rejectUnauthorized = false;
  }
  
  // 配置HTTPS agent
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
  });
  
  // 设置全局HTTPS agent
  https.globalAgent = httpsAgent;
}

// 获取Supabase SSL证书的解决方案
const getSupabaseSSLOptions = () => {
  // 检查是否在Vercel环境中
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  
  if (isVercel) {
    // Vercel环境的强化SSL配置
    return {
      // 完全跳过证书验证（Vercel环境的临时解决方案）
      rejectUnauthorized: false,
      // 禁用服务器身份验证
      checkServerIdentity: () => undefined,
    };
  }
  
  // 本地开发环境
  return {
    rejectUnauthorized: false,
  };
};

export function getDb() {
  if (!globalPool) {
    // 优先使用连接字符串（最可靠的方式）
    const connectionString = process.env.POSTGRES_URL;
    
    if (connectionString) {
      console.log('=== DATABASE CONNECTION ===');
      console.log('Environment:', process.env.VERCEL_ENV || 'local');
      console.log('Using connection string');
      console.log('========================');
      
      globalPool = new Pool({
        connectionString,
        ssl: getSupabaseSSLOptions(),
        // Vercel serverless优化配置
        max: 1, // 限制连接数以避免连接泄漏
        idleTimeoutMillis: 10000, // 10秒空闲超时
        connectionTimeoutMillis: 5000, // 5秒连接超时
      });
    } else {
      // 备用：使用单独的环境变量
      const sslMode = process.env.POSTGRES_SSLMODE || 'require';
      const password = process.env.POSTGRES_PASSWORD;
      const host = process.env.POSTGRES_HOST;
      const port = process.env.POSTGRES_PORT || '6543';
      const user = process.env.POSTGRES_USER;
      const database = process.env.POSTGRES_DATABASE || 'postgres';
      
      // 验证必需的环境变量
      if (!password || !host || !user) {
        throw new Error(`Missing required database environment variables. Please check:
          - POSTGRES_PASSWORD: ${password ? '✓' : '✗'}
          - POSTGRES_HOST: ${host ? '✓' : '✗'}
          - POSTGRES_USER: ${user ? '✓' : '✗'}`);
      }
      
      // 修复Vercel环境变量截断问题
      const fixedHost = host === 'aws-1-us-east-2.pooler.supab' 
        ? 'aws-1-us-east-2.pooler.supabase.com' 
        : host;
      
      // 构建连接字符串
      const fullConnectionString = `postgresql://${user}:${password}@${fixedHost}:${port}/${database}?sslmode=${sslMode}`;
      
      console.log('=== DATABASE CONNECTION ===');
      console.log('Environment:', process.env.VERCEL_ENV || 'local');
      console.log('Host:', fixedHost);
      console.log('SSL Mode:', sslMode);
      console.log('========================');
      
      globalPool = new Pool({
        connectionString: fullConnectionString,
        ssl: getSupabaseSSLOptions(),
        // Vercel serverless优化配置
        max: 1,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
      });
    }
    
    // 添加错误处理和连接测试
    globalPool.on('error', (err) => {
      console.error('Database pool error:', err);
      // 在Vercel环境中，销毁连接池以便下次重新创建
      if (process.env.VERCEL) {
        globalPool.end().then(() => {
          globalPool = undefined as any;
        }).catch(() => {
          globalPool = undefined as any;
        });
      }
    });
  }

  return globalPool;
}

// 用于测试连接的辅助函数
export async function testConnection() {
  try {
    const db = getDb();
    const result = await db.query('SELECT NOW()');
    console.log('Database connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}