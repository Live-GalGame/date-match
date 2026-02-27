#!/usr/bin/env node
/**
 * 本地 SQLite (local.db) → Railway PostgreSQL 数据迁移
 *
 * 用法:
 *   DATABASE_URL="postgresql://..." node scripts/migrate-turso-to-pg.mjs
 *
 * 前提:
 *   1. local.db 已通过 `turso db shell date-match .dump | sqlite3 local.db` 创建
 *   2. Railway PostgreSQL 表结构已通过 `prisma db push` 初始化
 */

import Database from "better-sqlite3";
import pg from "pg";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLITE_PATH = path.resolve(__dirname, "..", "local.db");

// ─── SQLite ──────────────────────────────────────────────────────────────────

const sqlite = new Database(SQLITE_PATH, { readonly: true });

// ─── PostgreSQL ──────────────────────────────────────────────────────────────

const PG_URL = process.env.DATABASE_URL;
if (!PG_URL) {
  console.error("Missing DATABASE_URL (PostgreSQL)");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: PG_URL,
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
  connectionTimeoutMillis: 10000,
});

// ─── Config ──────────────────────────────────────────────────────────────────

/** 按外键依赖顺序 */
const TABLES = [
  "User",
  "Session",
  "Account",
  "Verification",
  "Profile",
  "Qualification",
  "SurveyResponse",
  "HelicopterPilot",
  "NeptuneResponse",
  "Match",
];

const BOOL_COLS = {
  User: new Set(["emailVerified"]),
  Qualification: new Set(["eduVerified", "diplomaVerified"]),
  SurveyResponse: new Set(["completed", "optedIn"]),
};

const NUM_COLS = {
  Profile: new Set(["age"]),
  Match: new Set(["compatibility"]),
};

function coerceBool(val) {
  if (val === 1 || val === "1" || val === "true") return true;
  if (val === 0 || val === "0" || val === "false") return false;
  return val;
}

function coerceNum(val) {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return Number.isNaN(n) ? val : n;
}

// ─── Migrate ─────────────────────────────────────────────────────────────────

const BATCH = 500;

async function migrateTable(table) {
  const boolSet = BOOL_COLS[table] || new Set();
  const numSet = NUM_COLS[table] || new Set();

  const total = sqlite.prepare(`SELECT COUNT(*) AS cnt FROM "${table}"`).get().cnt;
  console.log(`\n📦 "${table}" — ${total} rows`);
  if (total === 0) return 0;

  const sample = sqlite.prepare(`SELECT * FROM "${table}" LIMIT 1`).get();
  const cols = Object.keys(sample);
  const quotedCols = cols.map((c) => `"${c}"`).join(", ");

  let inserted = 0;
  let offset = 0;

  while (offset < total) {
    const rows = sqlite.prepare(`SELECT * FROM "${table}" LIMIT ${BATCH} OFFSET ${offset}`).all();

    const allValues = [];
    const valueClauses = [];

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const rowPlaceholders = [];
      for (let c = 0; c < cols.length; c++) {
        const val = row[cols[c]];
        const paramIdx = r * cols.length + c + 1;
        rowPlaceholders.push(`$${paramIdx}`);
        if (val === null || val === undefined) {
          allValues.push(null);
        } else if (boolSet.has(cols[c])) {
          allValues.push(coerceBool(val));
        } else if (numSet.has(cols[c])) {
          allValues.push(coerceNum(val));
        } else {
          allValues.push(val);
        }
      }
      valueClauses.push(`(${rowPlaceholders.join(", ")})`);
    }

    const batchSQL = `INSERT INTO "${table}" (${quotedCols}) VALUES ${valueClauses.join(", ")} ON CONFLICT DO NOTHING`;

    try {
      const res = await client.query(batchSQL, allValues);
      inserted += res.rowCount;
    } catch (err) {
      console.error(`   ❌ batch error at ${table} offset=${offset}: ${err.message}`);
      console.error(`   Falling back to row-by-row for this batch...`);
      for (const row of rows) {
        const values = cols.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return null;
          if (boolSet.has(col)) return coerceBool(val);
          if (numSet.has(col)) return coerceNum(val);
          return val;
        });
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
        try {
          const res = await client.query(
            `INSERT INTO "${table}" (${quotedCols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          inserted += res.rowCount;
        } catch (e) {
          console.error(`   ❌ ${table}: ${e.message}`);
        }
      }
    }

    offset += rows.length;
    console.log(`   ${offset}/${total}`);
  }

  console.log(`   ✅ ${inserted}/${total} inserted`);
  return inserted;
}

async function main() {
  console.log("🚀 SQLite → PostgreSQL migration\n");
  console.log(`   SQLite: ${SQLITE_PATH}`);
  console.log(`   PG:     ${PG_URL.replace(/\/\/.*@/, "//***@")}`);

  await client.connect();
  console.log("   ✅ PostgreSQL connected");

  let sum = 0;
  for (const t of TABLES) {
    sum += await migrateTable(t);
  }

  console.log(`\n🎉 Done! ${sum} total rows inserted.`);
  sqlite.close();
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
