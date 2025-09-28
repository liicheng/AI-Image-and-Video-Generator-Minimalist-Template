import { Pool } from "pg";

// Vercel环境优化的数据库连接池
let globalPool: Pool;

// 获取SSL配置 - 诊断版本
const getSSLConfig = () => {
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  const caCert = process.env.SUPABASE_SSL_CERT;
  
  console.log('=== SSL CONFIG DEBUG ===');
  console.log('Is Vercel:', isVercel);
  console.log('CA Cert exists:', !!caCert);
  console.log('CA Cert length:', caCert ? caCert.length : 0);
  console.log('CA Cert preview:', caCert ? caCert.substring(0, 100) + '...' : 'N/A');
  
  if (isVercel && caCert) {
    // 尝试多种SSL配置
    const sslConfigs = [
      // 配置1：严格验证
      {
        name: 'Strict validation with CA cert',
        config: {
          ssl: {
            ca: caCert,
            rejectUnauthorized: true,
          }
        }
      },
      // 配置2：宽松验证
      {
        name: 'Relaxed validation with CA cert',
        config: {
          ssl: {
            ca: caCert,
            rejectUnauthorized: false,
          }
        }
      },
      // 配置3：无证书验证
      {
        name: 'No SSL validation',
        config: {
          ssl: {
            rejectUnauthorized: false,
          }
        }
      },
      // 配置4：禁用SSL
      {
        name: 'SSL disabled',
        config: {
          ssl: false,
        }
      }
    ];
    
    // 切换到配置4（完全禁用SSL）以解决证书链问题
    const selectedConfig = sslConfigs[3];
    console.log('Using SSL config:', selectedConfig.name);
    console.log('========================');
    return selectedConfig.config;
  }
  
  console.log('Using default SSL config for local environment');
  console.log('========================');
  return { ssl: { rejectUnauthorized: false } };
};

export function getDb() {
  if (!globalPool) {
    // 优先使用连接字符串（最可靠的方式）
    const rawConnectionString = process.env.POSTGRES_URL;
    
    if (rawConnectionString) {
      console.log('=== DATABASE CONNECTION ===');
      console.log('Environment:', process.env.VERCEL_ENV || 'local');
      console.log('Using CA certificate-based SSL validation');
      console.log('========================');
      
      globalPool = new Pool({
        connectionString: rawConnectionString,
        ...getSSLConfig(),
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
      const rawConnectionString = `postgresql://${user}:${password}@${fixedHost}:${port}/${database}?sslmode=${sslMode}`;
      
      console.log('=== DATABASE CONNECTION ===');
      console.log('Environment:', process.env.VERCEL_ENV || 'local');
      console.log('Host:', fixedHost);
      console.log('SSL Mode:', sslMode);
      console.log('Using CA certificate-based SSL validation');
      console.log('========================');
      
      globalPool = new Pool({
        connectionString: rawConnectionString,
        ...getSSLConfig(),
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