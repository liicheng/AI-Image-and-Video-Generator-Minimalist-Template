import { Pool } from "pg";

// 暂时禁用数据库连接，让网站先运行起来
class MockPool {
  async query(text: string, params?: any[]) {
    console.log("Database query disabled:", text);
    // 返回空结果
    return { rows: [], rowCount: 0 };
  }
}

let globalPool: any;

export function getDb() {
  if (!globalPool) {
    globalPool = new MockPool();
  }
  return globalPool;
}