import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

/* ================= CONFIG ================= */

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SRC_DIR = path.resolve("src");
const MIGRATIONS_DIR = path.resolve("supabase/migrations");

/* ================= SUPABASE ================= */

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/* ================= HELPERS ================= */

function walk(dir: string, files: string[] = []): string[] {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full, files);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

function extractTablesAndColumns(content: string) {
  const tables = new Set<string>();
  const columns: Record<string, Set<string>> = {};

  const fromRegex = /\.from\(["'`](.*?)["'`]\)/g;
  let match;

  while ((match = fromRegex.exec(content))) {
    const table = match[1];
    tables.add(table);
    columns[table] ??= new Set();
  }

  const insertRegex = /\.insert\(\s*\{([\s\S]*?)\}\s*\)/g;

  while ((match = insertRegex.exec(content))) {
    const body = match[1];
    body
      .split(",")
      .map(c => c.split(":")[0].trim())
      .filter(Boolean)
      .forEach(col => {
        for (const table of tables) {
          columns[table]?.add(col);
        }
      });
  }

  return { tables, columns };
}

/* ================= TYPE INFERENCE ================= */

function inferSqlType(column: string): string {
  if (column.endsWith("_id")) return "uuid";
  if (column.includes("at") || column.includes("date")) return "timestamptz";
  if (column.includes("count") || column.includes("total")) return "integer";
  if (column.includes("answers")) return "integer";
  if (column.includes("categorias")) return "text[]";
  return "text";
}

/* ================= MAIN ================= */

async function run() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  const files = walk(SRC_DIR);

  const usedTables = new Set<string>();
  const usedColumns: Record<string, Set<string>> = {};

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const { tables, columns } = extractTablesAndColumns(content);

    tables.forEach(t => {
      usedTables.add(t);
      usedColumns[t] ??= new Set();
    });

    for (const table in columns) {
      columns[table].forEach(col => usedColumns[table].add(col));
    }
  }

  const statements: string[] = [];

  for (const table of usedTables) {
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", table);

    if (error) {
      console.error(`Erro ao ler schema de ${table}:`, error.message);
      continue;
    }

    const dbColumns = new Set(data.map(c => c.column_name));
    const codeColumns = usedColumns[table] ?? new Set();

    const missing = [...codeColumns].filter(c => !dbColumns.has(c));

    for (const column of missing) {
      const sqlType = inferSqlType(column);

      statements.push(
        `alter table ${table} add column if not exists ${column} ${sqlType};`
      );
    }
  }

  if (!statements.length) {
    console.log("✅ Nenhuma migração necessária");
    return;
  }

  const filename = `${new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14)}_auto_from_code.sql`;

  const filepath = path.join(MIGRATIONS_DIR, filename);

  fs.writeFileSync(
    filepath,
    `-- AUTO-GERADO A PARTIR DO CÓDIGO\n\n${statements.join("\n")}\n`
  );

  console.log("🧱 Migração gerada:");
  console.log(filepath);
}

run().catch(console.error);
