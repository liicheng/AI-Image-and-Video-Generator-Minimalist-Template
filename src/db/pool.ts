import { Pool } from "pg";

declare global { var __pgPool__: Pool | undefined }

function normalizeCA(raw: string | undefined) {
  if (!raw) return [];
  const text = raw.replace(/\r\n/g, "\n");
  return text.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
}

export function getPool() {
  if (global.__pgPool__) return global.__pgPool__;

  const url  = new URL(process.env.POSTGRES_URL!); // 例：aws-1-us-east-2.pooler.supabase.com:6543
  const host = url.hostname;
  const port = url.port || "5432";

  const caList = normalizeCA(process.env.SUPABASE_SSL_CERT);
  console.log("[DB] host:", host, "port:", port, "CA blocks:", caList.length);

  global.__pgPool__ = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      ca: caList,                   // ← 多段证书全部传入
      rejectUnauthorized: true,     // 严格校验
      servername: host,             // SNI，必须与域名一致
    },
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  global.__pgPool__.on("error", (e) => console.error("[pg pool error]", e));
  return global.__pgPool__;
}

export const pool = getPool();