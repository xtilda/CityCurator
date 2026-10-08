import { neon } from '@neondatabase/serverless';

// Fixed, application-owned SQL only. Values always remain parameterized.
export function postgresSql(query: string): string {
  let index = 0;
  const ignore = query.startsWith('INSERT OR IGNORE');
  const sql = query.replace('INSERT OR IGNORE', 'INSERT').replace(/\?/g, () => `$${++index}`);
  return ignore ? `${sql} ON CONFLICT DO NOTHING` : sql;
}
class Statement {
  constructor(readonly query: string, readonly values: unknown[] = []) {}
  bind(...values: unknown[]) { return new Statement(this.query, values); }
  private execute() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not configured');
    return neon(url).query(postgresSql(this.query), this.values, { fullResults: true });
  }
  async first<T>() { const result = await this.execute(); return (result.rows[0] as T | undefined) ?? null; }
  async all<T>() { const result = await this.execute(); return { results: result.rows as T[] }; }
  async run() { const result = await this.execute(); return { meta: { changes: result.rowCount ?? 0 } }; }
}
export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return {
    prepare: (sql: string) => new Statement(sql),
    batch: (statements: Statement[]) => {
      const sql = neon(url);
      return sql.transaction(statements.map(s => sql.query(postgresSql(s.query), s.values)));
    },
  };
}
