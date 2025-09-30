import { pool } from '@/db/pool';
import { NextResponse } from 'next/server';

export async function GET() {
  const timestamp = new Date().toISOString();
  const results = {
    timestamp,
    environment: {
      hasPostgresUrl: false,
      postgresUrlLength: 0,
      postgresUrlPrefix: '',
      hasCACert: false,
      caCertLength: 0,
      vercelEnv: '',
      nodeEnv: '',
      vercelRegion: ''
    },
    poolInfo: {
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0,
      options: {
        max: 0,
        connectionTimeoutMillis: 0,
        idleTimeoutMillis: 0,
        ssl: {
          hasCA: false,
          caCount: 0,
          rejectUnauthorized: false,
          servername: ''
        }
      }
    },
    sslTest: {} as any,
    connectionTest: {
      success: false,
      duration: 0,
      serverTime: '',
      postgresVersion: '',
      database: '',
      user: '',
      serverIp: '',
      serverPort: 0,
      rowCount: 0,
      sslUsed: false,
      sslVersion: '',
      sslCheckError: '',
      error: '',
      code: '',
      severity: '',
      detail: '',
      hint: ''
    },
    errors: [] as string[]
  };

  try {
    // === 环境变量检查 ===
    results.environment = {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      postgresUrlLength: process.env.POSTGRES_URL?.length || 0,
      postgresUrlPrefix: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.substring(0, 50) + '...' : 'N/A',
      hasCACert: !!process.env.SUPABASE_SSL_CERT,
      caCertLength: process.env.SUPABASE_SSL_CERT?.length || 0,
      vercelEnv: process.env.VERCEL || process.env.VERCEL_ENV || 'local',
      nodeEnv: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION || 'unknown'
    };

    // === Pool信息检查 ===
    results.poolInfo = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
      options: {
        max: (pool as any).options?.max,
        connectionTimeoutMillis: (pool as any).options?.connectionTimeoutMillis,
        idleTimeoutMillis: (pool as any).options?.idleTimeoutMillis,
        ssl: {
          hasCA: !!(pool as any).options?.ssl?.ca,
          caCount: Array.isArray((pool as any).options?.ssl?.ca) ? (pool as any).options.ssl.ca.length : 0,
          rejectUnauthorized: (pool as any).options?.ssl?.rejectUnauthorized,
          servername: (pool as any).options?.ssl?.servername
        }
      }
    };

    // === SSL配置详细检查 ===
    const sslOptions = (pool as any).options?.ssl;
    if (sslOptions && sslOptions.ca && Array.isArray(sslOptions.ca)) {
      results.sslTest = {
        caCertificates: sslOptions.ca.map((cert: string, index: number) => ({
          index: index + 1,
          length: cert.length,
          prefix: cert.substring(0, 50) + '...',
          suffix: cert.substring(cert.length - 50),
          hasBeginEnd: cert.includes('-----BEGIN CERTIFICATE-----') && cert.includes('-----END CERTIFICATE-----')
        }))
      };
    } else {
      results.sslTest = {
        error: 'No SSL CA certificates found in pool configuration'
      };
      results.errors.push('SSL CA certificates missing from pool config');
    }

    // === 实际连接测试 ===
    console.log('[SSL-TEST] 开始连接测试...');
    const startTime = Date.now();
    
    try {
      const queryResult = await pool.query(`
        SELECT 
          NOW() as server_time,
          version() as postgres_version,
          current_database() as database,
          current_user as user,
          inet_server_addr() as server_ip,
          inet_server_port() as server_port
      `);
      
      const duration = Date.now() - startTime;
      
      results.connectionTest = {
        success: true,
        duration,
        serverTime: queryResult.rows[0].server_time || '',
        postgresVersion: queryResult.rows[0].postgres_version || '',
        database: queryResult.rows[0].database || '',
        user: queryResult.rows[0].user || '',
        serverIp: queryResult.rows[0].server_ip || '',
        serverPort: queryResult.rows[0].server_port || 0,
        rowCount: queryResult.rowCount || 0,
        sslUsed: false,
        sslVersion: '',
        sslCheckError: '',
        error: '',
        code: '',
        severity: '',
        detail: '',
        hint: ''
      };

      // 尝试检查SSL使用情况（PostgreSQL特定查询）
      try {
        const sslResult = await pool.query('SELECT ssl_is_used() as ssl_used, ssl_version() as ssl_version');
        results.connectionTest = {
          ...results.connectionTest,
          sslUsed: sslResult.rows[0]?.ssl_used,
          sslVersion: sslResult.rows[0]?.ssl_version
        };
        console.log('[SSL-TEST] SSL状态:', sslResult.rows[0]);
      } catch (sslCheckError: any) {
        console.log('[SSL-TEST] SSL检查查询失败:', sslCheckError?.message || 'Unknown error');
        results.connectionTest = {
          ...results.connectionTest,
          sslCheckError: sslCheckError?.message || 'Unknown error'
        };
      }

    } catch (connectionError: any) {
      const duration = Date.now() - startTime;
      results.connectionTest = {
        success: false,
        duration,
        serverTime: '',
        postgresVersion: '',
        database: '',
        user: '',
        serverIp: '',
        serverPort: 0,
        rowCount: 0,
        sslUsed: false,
        sslVersion: '',
        sslCheckError: '',
        error: connectionError.message || 'Unknown error',
        code: connectionError.code || '',
        severity: connectionError.severity || '',
        detail: connectionError.detail || '',
        hint: connectionError.hint || ''
      };
      
      results.errors.push(`Connection failed: ${connectionError.message}`);
      console.error('[SSL-TEST] 连接测试失败:', connectionError);
    }

    // === 综合诊断结论 ===
    const diagnosis = {
      environmentHealthy: results.environment.hasPostgresUrl && results.environment.hasCACert,
      poolHealthy: results.poolInfo.totalCount >= 0,
      sslConfigured: results.poolInfo.options.ssl.caCount > 0,
      connectionWorking: results.connectionTest.success
    };

    (results as any).diagnosis = diagnosis;
    (results as any).overall = Object.values(diagnosis).every(Boolean) ? 'HEALTHY' : 'NEEDS_ATTENTION';

  } catch (error: any) {
    results.errors.push(`Diagnostic error: ${error.message}`);
    console.error('[SSL-TEST] 诊断过程出错:', error);
  }

  console.log('[SSL-TEST] 诊断完成:', {
    environment: results.environment.vercelEnv,
    hasCA: results.environment.hasCACert,
    caLength: results.environment.caCertLength,
    connection: results.connectionTest.success ? '✅' : '❌',
    overall: (results as any).overall
  });

  return NextResponse.json(results, {
    status: results.errors.length > 0 ? 500 : 200
  });
}