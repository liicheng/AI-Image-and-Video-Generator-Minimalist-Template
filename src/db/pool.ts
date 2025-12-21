import { Pool, PoolConfig } from "pg";

type SslMode = "strict" | "relaxed";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool__: Pool | undefined;
}

let currentMode: SslMode = "strict";

console.log("=== 环境变量检查 ===");
console.log("POSTGRES_URL存在:", !!process.env.POSTGRES_URL);
console.log("POSTGRES_URL长度:", process.env.POSTGRES_URL?.length);
console.log("POSTGRES_URL前100字符:", process.env.POSTGRES_URL?.substring(0, 100));
console.log("SUPABASE_SSL_CERT存在:", !!process.env.SUPABASE_SSL_CERT);
console.log("SUPABASE_SSL_CERT长度:", process.env.SUPABASE_SSL_CERT?.length);
console.log("VERCEL环境:", process.env.VERCEL || process.env.VERCEL_ENV || "local");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("========================");

function normalizeCA(raw: string | undefined) {
  console.log("[CA] 原始数据长度:", raw?.length);
  console.log("[CA] 原始数据前100字符:", raw?.substring(0, 100));
  console.log(
    "[CA] 原始数据后100字符:",
    raw ? raw.substring(Math.max(0, raw.length - 100)) : "N/A"
  );

  if (!raw) {
    console.log("[CA] ❌ 无CA证书数据");
    return [] as string[];
  }

  const text = raw.replace(/\r\n/g, "\n");
  const certs =
    text.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];

  const trimmed = certs.map((cert, index) => {
    const normalized = `${cert.trim()}\n`;
    console.log(`[CA] 证书${index + 1}长度:`, normalized.length);
    console.log(`[CA] 证书${index + 1}前50字符:`, normalized.substring(0, 50));
    console.log(
      `[CA] 证书${index + 1}换行数:`,
      normalized.split("\n").filter(Boolean).length
    );
    return normalized;
  });

  console.log("[CA] 解析出证书数量:", trimmed.length);
  return trimmed;
}

function buildPoolConfig(mode: SslMode): PoolConfig {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  const url = new URL(process.env.POSTGRES_URL);
  const host = url.hostname;
  const port = url.port || "5432";
  const user = url.username;
  const database = url.pathname.replace("/", "");

  console.log("[POOL] 连接参数解析:");
  console.log("  - host:", host);
  console.log("  - port:", port);
  console.log("  - user:", user);
  console.log("  - database:", database);

  const caList = normalizeCA(process.env.SUPABASE_SSL_CERT);

  const baseSslConfig = {
    ca: caList,
    rejectUnauthorized: mode === "strict",
    servername: host,
  } as const;

  console.log("[POOL] SSL配置验证:", {
    mode,
    hasCA: caList.length > 0,
    caCount: caList.length,
    rejectUnauthorized: baseSslConfig.rejectUnauthorized,
    servername: baseSslConfig.servername,
    caTotalLength: caList.reduce((sum, cert) => sum + cert.length, 0),
  });

  const config: PoolConfig = {
    connectionString: process.env.POSTGRES_URL,
    ssl: baseSslConfig,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  };

  console.log("[POOL] 完整Pool配置:", {
    ...config,
    connectionString: "[HIDDEN]",
    ssl: {
      ...baseSslConfig,
      ca: baseSslConfig.ca?.map((cert) => `[CERT-${cert.length}B]`),
    },
  });

  return config;
}

async function teardownPool(pool: Pool | undefined) {
  if (!pool) return;
  try {
    pool.removeAllListeners();
    await pool.end();
  } catch (error) {
    console.error("[POOL] ⚠️ 关闭旧Pool时出错", error);
  }
}

function attachListeners(pool: Pool, mode: SslMode) {
  pool.on("connect", (client: any) => {
    console.log("[POOL] 🔗 新连接建立");
    console.log("[POOL] 连接参数:", {
      host: client.connectionParameters?.host,
      port: client.connectionParameters?.port,
      database: client.connectionParameters?.database,
      user: client.connectionParameters?.user,
    });

    setTimeout(() => {
      if (client.ssl) {
        console.log("[POOL] 🔒 SSL连接已建立 (mode:", mode, ")");
        if (client.getPeerCertificate) {
          const cert = client.getPeerCertificate();
          console.log("[POOL] 📜 对端证书信息:", cert
            ? {
                subject: cert.subject,
                issuer: cert.issuer,
                valid_from: cert.valid_from,
                valid_to: cert.valid_to,
              }
            : "无证书信息");
        }
      } else {
        console.log("[POOL] ⚠️ 非SSL连接");
      }
    }, 100);
  });

  pool.on("acquire", () => {
    console.log("[POOL] 📥 从池中获取连接");
  });

  pool.on("remove", () => {
    console.log("[POOL] 📤 连接从池中移除");
  });

  pool.on("error", async (e: any) => {
    console.error("[POOL] ❌ Pool错误:", e);

    if (mode === "strict" && e?.code === "SELF_SIGNED_CERT_IN_CHAIN") {
      console.error(
        "[POOL] ⚠️ 检测到证书链不被信任，启用临时宽松SSL模式。请尽快更新 SUPABASE_SSL_CERT 以回到严格校验。"
      );
      currentMode = "relaxed";
      await teardownPool(pool);
      global.__pgPool__ = initializePool(currentMode, /*fromFallback*/ true);
      return;
    }

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
      routine: e.routine,
    });
  });
}

function wrapQuery(pool: Pool, mode: SslMode) {
  const originalQuery = pool.query.bind(pool);

  pool.query = (async (...args: Parameters<typeof originalQuery>) => {
    try {
      return await originalQuery(...args);
    } catch (error: any) {
      if (mode === "strict" && error?.code === "SELF_SIGNED_CERT_IN_CHAIN") {
        console.error(
          "[POOL] ⚠️ query() 捕获证书链错误，切换至宽松模式后重试"
        );
        currentMode = "relaxed";
        await teardownPool(pool);
        global.__pgPool__ = initializePool(currentMode, /*fromFallback*/ true);
        const nextPool = global.__pgPool__;
        if (!nextPool) {
          throw error;
        }
        return nextPool.query(...args);
      }
      throw error;
    }
  }) as Pool["query"];
}

function initializePool(mode: SslMode, fromFallback = false) {
  console.log(
    fromFallback
      ? "[POOL] 🔄 重建Pool实例 (宽松SSL模式，仅临时使用)"
      : "[POOL] 🆕 创建新的Pool实例"
  );

  const poolConfig = buildPoolConfig(mode);
  const pool = new Pool(poolConfig);
  attachListeners(pool, mode);
  wrapQuery(pool, mode);
  console.log("[POOL] ✅ Pool实例创建完成 (mode:", mode, ")");
  return pool;
}

export function getPool() {
  if (global.__pgPool__) {
    console.log("[POOL] ♻️ 重用现有Pool实例 (mode:", currentMode, ")");
    return global.__pgPool__;
  }

  const pool = initializePool(currentMode);
  global.__pgPool__ = pool;
  return pool;
}

export const pool = getPool();
