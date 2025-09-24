import { Pool } from "pg";

// 链接池，所有的连接都维护在这个连接池里面
let globalPool: Pool;

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
    // 等待正确的数据库配置
    globalPool = new MockPool();
  }

  return globalPool;
}