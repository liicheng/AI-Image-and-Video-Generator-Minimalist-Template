import { Pool } from "pg";

declare global { var __pgPool__: Pool | undefined }

// === 方案A: 验证CA证书是否真正生效 ===
console.log('=== 环境变量检查 ===');
console.log('POSTGRES_URL存在:', !!process.env.POSTGRES_URL);
console.log('POSTGRES_URL长度:', process.env.POSTGRES_URL?.length);
console.log('POSTGRES_URL前100字符:', process.env.POSTGRES_URL?.substring(0, 100));
console.log('SUPABASE_SSL_CERT存在:', !!process.env.SUPABASE_SSL_CERT);
console.log('SUPABASE_SSL_CERT长度:', process.env.SUPABASE_SSL_CERT?.length);
console.log('VERCEL环境:', process.env.VERCEL || process.env.VERCEL_ENV || 'local');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('========================');

function normalizeCA(raw: string | undefined) {
  console.log('[CA] 原始数据长度:', raw?.length);
  console.log('[CA] 原始数据前100字符:', raw?.substring(0, 100));
  console.log('[CA] 原始数据后100字符:', raw ? raw.substring(raw.length - 100) : 'N/A');
  
  if (!raw) {
    console.log('[CA] ❌ 无CA证书数据');
    return [];
  }
  
  const text = raw.replace(/\r\n/g, "\n");
  const certs = text.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
  
  console.log('[CA] 解析出证书数量:', certs.length);
  certs.forEach((cert, index) => {
    console.log(`[CA] 证书${index + 1}长度:`, cert.length);
    console.log(`[CA] 证书${index + 1}前50字符:`, cert.substring(0, 50));
  });
  
  return certs;
}

export function getPool() {
  if (global.__pgPool__) {
    console.log('[POOL] ♻️ 重用现有Pool实例');
    return global.__pgPool__;
  }

  console.log('[POOL] 🆕 创建新的Pool实例');
  
  // 验证POSTGRES_URL
  if (!process.env.POSTGRES_URL) {
    console.error('[POOL] ❌ POSTGRES_URL未定义');
    throw new Error('POSTGRES_URL environment variable is required');
  }

  const url  = new URL(process.env.POSTGRES_URL!); // 例：aws-1-us-east-2.pooler.supabase.com:6543
  const host = url.hostname;
  const port = url.port || "5432";
  const user = url.username;
  const database = url.pathname.replace('/', '');

  console.log('[POOL] 连接参数解析:');
  console.log('  - host:', host);
  console.log('  - port:', port);
  console.log('  - user:', user);
  console.log('  - database:', database);

  const caList = normalizeCA(process.env.SUPABASE_SSL_CERT);
  
  // 验证SSL配置
  const sslConfig = {
    ca: caList,                   // ← 多段证书全部传入
    rejectUnauthorized: true,     // 严格校验
    servername: host,             // SNI，必须与域名一致
  };
  
  console.log('[POOL] SSL配置验证:', {
    hasCA: caList.length > 0,
    caCount: caList.length,
    rejectUnauthorized: sslConfig.rejectUnauthorized,
    servername: sslConfig.servername,
    caTotalLength: caList.reduce((sum, cert) => sum + cert.length, 0)
  });

  const poolConfig = {
    connectionString: process.env.POSTGRES_URL,
    ssl: sslConfig,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  };

  console.log('[POOL] 完整Pool配置:', {
    ...poolConfig,
    connectionString: '[HIDDEN]', // 隐藏敏感信息
    ssl: {
      ...sslConfig,
      ca: sslConfig.ca.map(cert => `[CERT-${cert.length}B]`) // 隐藏完整证书内容
    }
  });

  global.__pgPool__ = new Pool(poolConfig);

  // 连接事件监听
  global.__pgPool__.on("connect", (client: any) => {
    console.log('[POOL] 🔗 新连接建立');
    console.log('[POOL] 连接参数:', {
      host: client.connectionParameters?.host,
      port: client.connectionParameters?.port,
      database: client.connectionParameters?.database,
      user: client.connectionParameters?.user
    });
    
    // 尝试获取SSL信息
    setTimeout(() => {
      if (client.ssl) {
        console.log('[POOL] 🔒 SSL连接已建立');
        if (client.getPeerCertificate) {
          const cert = client.getPeerCertificate();
          console.log('[POOL] 📜 对端证书信息:', cert ? {
            subject: cert.subject,
            issuer: cert.issuer,
            valid_from: cert.valid_from,
            valid_to: cert.valid_to
          } : '无证书信息');
        }
      } else {
        console.log('[POOL] ⚠️ 非SSL连接');
      }
    }, 100);
  });

  global.__pgPool__.on("acquire", (client) => {
    console.log('[POOL] 📥 从池中获取连接');
  });

  global.__pgPool__.on("remove", (client) => {
    console.log('[POOL] 📤 连接从池中移除');
  });

  global.__pgPool__.on("error", (e: any) => {
    console.error("[POOL] ❌ Pool错误:", e);
    console.error("[POOL] 错误详情:", {
      message: e.message,
      code: e.code,
      severity: e.severity,
      detail: e.detail,
      hint: e.hint,
      position: e.position,
      internalPosition: e.internalPosition,
      internalQuery: e.internalQuery,
      where: e.where,
      schema: e.schema,
      table: e.table,
      column: e.column,
      dataType: e.dataType,
      constraint: e.constraint,
      file: e.file,
      line: e.line,
      routine: e.routine
    });
  });
  
  console.log('[POOL] ✅ Pool实例创建完成');
  return global.__pgPool__;
}

export const pool = getPool();