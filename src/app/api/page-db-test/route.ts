import { pool } from '@/db/pool';
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[PAGE-DB-TEST] 页面级数据库连接测试开始');
  
  try {
    // 简单的连接测试
    const result = await pool.query('SELECT 1 as test, NOW() as server_time');
    
    console.log('[PAGE-DB-TEST] ✅ 连接成功:', {
      test: result.rows[0].test,
      serverTime: result.rows[0].server_time,
      poolState: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: result.rows[0],
      poolInfo: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    });

  } catch (error: any) {
    console.error('[PAGE-DB-TEST] ❌ 连接失败:', {
      message: error.message,
      code: error.code,
      severity: error.severity,
      detail: error.detail,
      poolState: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    });

    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      code: error.code,
      poolInfo: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    }, { status: 500 });
  }
}