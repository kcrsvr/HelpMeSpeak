// Adapts a real in-memory SQLite engine (better-sqlite3) to the subset of the
// expo-sqlite async API that the repositories use. Using a real SQL engine
// means integration tests exercise genuine behavior: ON DELETE CASCADE,
// ORDER BY, COUNT(*), ON CONFLICT upserts, and PRAGMA table_info.
import Database from "better-sqlite3";

export interface ExpoSqliteLike {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
  withTransactionAsync(cb: () => Promise<void>): Promise<void>;
  __raw: Database.Database;
}

function isSelectish(sql: string): boolean {
  const s = sql.trim().toLowerCase();
  return s.startsWith("select") || s.startsWith("pragma");
}

export function createFakeDb(): ExpoSqliteLike {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");

  return {
    __raw: db,

    async execAsync(sql: string) {
      // execAsync runs one or more statements with no params.
      db.exec(sql);
    },

    async runAsync(sql: string, params: any[] = []) {
      const info = db.prepare(sql).run(...params);
      return {
        changes: info.changes,
        lastInsertRowId: Number(info.lastInsertRowid),
      };
    },

    async getAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
      return db.prepare(sql).all(...params) as T[];
    },

    async getFirstAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
      const row = db.prepare(sql).get(...params);
      return (row ?? null) as T | null;
    },

    async withTransactionAsync(cb: () => Promise<void>) {
      // better-sqlite3's own transaction() is sync-only, so emulate manually to
      // support the async callback the repositories pass.
      db.exec("BEGIN");
      try {
        await cb();
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
}
