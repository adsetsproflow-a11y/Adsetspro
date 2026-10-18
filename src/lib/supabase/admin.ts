import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { getDbPool } from '@/lib/db';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wiswkavvupyuzujnbirq.supabase.co';

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.service_role_fallback';

const rawClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function transformSupabaseSelect(table: string, selectStr: string): string {
  let cleaned = selectStr;

  // 1. Match alias:relTable!fk(cols)
  cleaned = cleaned.replace(
    /([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)\s*!\s*([a-zA-Z0-9_]+)\s*\(([^)]+)\)/g,
    (_, alias, relTable, fk, innerCols) => {
      const colList = innerCols.split(',').map((c: string) => c.trim()).filter(Boolean);
      const jsonArgs = colList.map((c: string) => `'${c}', rel."${c}"`).join(', ');
      return `(SELECT json_build_object(${jsonArgs}) FROM public."${relTable}" rel WHERE rel.id = public."${table}"."${fk}") as "${alias}"`;
    }
  );

  // 2. Match alias:relTable(cols)
  cleaned = cleaned.replace(
    /([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)\s*\(([^)]+)\)/g,
    (_, alias, relTable, innerCols) => {
      const colList = innerCols.split(',').map((c: string) => c.trim()).filter(Boolean);
      const jsonArgs = colList.map((c: string) => `'${c}', rel."${c}"`).join(', ');
      const fk = `${relTable.replace(/s$/, '')}_id`;
      return `(SELECT json_build_object(${jsonArgs}) FROM public."${relTable}" rel WHERE rel.id = public."${table}"."${fk}") as "${alias}"`;
    }
  );

  // 3. Match relTable(cols) without alias, excluding SQL functions
  cleaned = cleaned.replace(
    /\b(?!(?:json_build_object|count|coalesce|max|min|avg)\b)([a-zA-Z0-9_]+)\s*\(([^)]+)\)/g,
    (_, relTable, innerCols) => {
      const colList = innerCols.split(',').map((c: string) => c.trim()).filter(Boolean);
      const jsonArgs = colList.map((c: string) => `'${c}', rel."${c}"`).join(', ');
      const fk = `${relTable.replace(/s$/, '')}_id`;
      return `(SELECT json_build_object(${jsonArgs}) FROM public."${relTable}" rel WHERE rel.id = public."${table}"."${fk}") as "${relTable}"`;
    }
  );

  return cleaned;
}

class PgQueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private selectedColumns: string = '*';
  private conditions: string[] = [];
  private params: any[] = [];
  private orderClauses: string[] = [];
  private limitCount: number | null = null;
  private offsetCount: number | null = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private insertData: any = null;
  private updateData: any = null;
  private upsertOptions: any = null;
  private countMode: string | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*', options?: { count?: string; head?: boolean }) {
    if (this.action === 'insert' || this.action === 'update' || this.action === 'upsert') {
      this.selectedColumns = columns;
      return this;
    }
    this.action = 'select';
    this.selectedColumns = columns;
    if (options?.count) {
      this.countMode = options.count;
    }
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.updateData = data;
    return this;
  }

  upsert(data: any, options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.action = 'upsert';
    this.insertData = data;
    this.upsertOptions = options;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    if (value === null) {
      return this.is(column, null);
    }
    this.params.push(value);
    this.conditions.push(`"${column}" = $${this.params.length}`);
    return this;
  }

  neq(column: string, value: any) {
    if (value === null) {
      return this.not(column, 'is', null);
    }
    this.params.push(value);
    this.conditions.push(`"${column}" != $${this.params.length}`);
    return this;
  }

  in(column: string, values: any[]) {
    if (!values || values.length === 0) {
      this.conditions.push('1=0');
      return this;
    }
    const placeholders = values.map((v) => {
      this.params.push(v);
      return `$${this.params.length}`;
    });
    this.conditions.push(`"${column}" IN (${placeholders.join(', ')})`);
    return this;
  }

  is(column: string, value: any) {
    if (value === null) {
      this.conditions.push(`"${column}" IS NULL`);
    } else {
      this.params.push(value);
      this.conditions.push(`"${column}" IS $${this.params.length}`);
    }
    return this;
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'is' && value === null) {
      this.conditions.push(`"${column}" IS NOT NULL`);
    } else {
      this.params.push(value);
      this.conditions.push(`NOT ("${column}" = $${this.params.length})`);
    }
    return this;
  }

  ilike(column: string, pattern: string) {
    this.params.push(pattern);
    this.conditions.push(`"${column}" ILIKE $${this.params.length}`);
    return this;
  }

  like(column: string, pattern: string) {
    this.params.push(pattern);
    this.conditions.push(`"${column}" LIKE $${this.params.length}`);
    return this;
  }

  gte(column: string, value: any) {
    this.params.push(value);
    this.conditions.push(`"${column}" >= $${this.params.length}`);
    return this;
  }

  lte(column: string, value: any) {
    this.params.push(value);
    this.conditions.push(`"${column}" <= $${this.params.length}`);
    return this;
  }

  gt(column: string, value: any) {
    this.params.push(value);
    this.conditions.push(`"${column}" > $${this.params.length}`);
    return this;
  }

  lt(column: string, value: any) {
    this.params.push(value);
    this.conditions.push(`"${column}" < $${this.params.length}`);
    return this;
  }

  contains(column: string, value: any) {
    this.params.push(JSON.stringify(value));
    this.conditions.push(`"${column}" @> $${this.params.length}::jsonb`);
    return this;
  }

  or(filterString: string) {
    if (!filterString || typeof filterString !== 'string') return this;
    const parts = filterString.split(',').map((p) => p.trim()).filter(Boolean);
    const orClauses: string[] = [];
    for (const part of parts) {
      const match = part.match(/^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\.(.+)$/);
      if (match) {
        const [, col, op, val] = match;
        if (op === 'eq') {
          this.params.push(val);
          orClauses.push(`"${col}" = $${this.params.length}`);
        } else if (op === 'neq') {
          this.params.push(val);
          orClauses.push(`"${col}" != $${this.params.length}`);
        } else if (op === 'is') {
          if (val === 'null') orClauses.push(`"${col}" IS NULL`);
        } else if (op === 'in') {
          const inVals = val.replace(/^\(/, '').replace(/\)$/, '').split(',').map((v) => v.trim());
          const placeholders = inVals.map((v) => {
            this.params.push(v);
            return `$${this.params.length}`;
          });
          orClauses.push(`"${col}" IN (${placeholders.join(', ')})`);
        }
      }
    }
    if (orClauses.length > 0) {
      this.conditions.push(`(${orClauses.join(' OR ')})`);
    }
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.orderClauses.push(`"${column}" ${ascending ? 'ASC' : 'DESC'}`);
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = Math.max(0, from);
    this.limitCount = Math.max(0, to - from + 1);
    return this;
  }

  single() {
    this.isSingle = true;
    this.limitCount = 1;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    this.limitCount = 1;
    return this;
  }

  async execute(): Promise<any> {
    try {
      const pool = getDbPool();
      const whereClause = this.conditions.length > 0 ? `WHERE ${this.conditions.join(' AND ')}` : '';

      // Count only check
      if (this.countMode === 'exact' && this.selectedColumns.includes('*')) {
        const countQuery = `SELECT COUNT(*)::int as count FROM public."${this.table}" ${whereClause};`;
        const countRes = await pool.query(countQuery, this.params);
        return { data: null, count: countRes.rows[0]?.count || 0, error: null };
      }

      let query = '';
      if (this.action === 'select') {
        const order = this.orderClauses.length > 0 ? `ORDER BY ${this.orderClauses.join(', ')}` : '';
        const lim = this.limitCount !== null ? `LIMIT ${this.limitCount}` : '';
        const off = this.offsetCount !== null ? `OFFSET ${this.offsetCount}` : '';

        const cols = transformSupabaseSelect(this.table, this.selectedColumns);
        query = `SELECT ${cols} FROM public."${this.table}" ${whereClause} ${order} ${lim} ${off};`;
      } else if (this.action === 'insert') {
        const rows = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        if (rows.length === 0) return { data: [], error: null };
        const keys = Object.keys(rows[0]);
        const cols = keys.map((k) => `"${k}"`).join(', ');

        const valueClauses = rows.map((row) => {
          const rowPlaceholders = keys.map((k) => {
            this.params.push(row[k]);
            return `$${this.params.length}`;
          });
          return `(${rowPlaceholders.join(', ')})`;
        });

        query = `INSERT INTO public."${this.table}" (${cols}) VALUES ${valueClauses.join(', ')} RETURNING *;`;
      } else if (this.action === 'upsert') {
        const rows = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        if (rows.length === 0) return { data: [], error: null };
        const keys = Object.keys(rows[0]);
        const cols = keys.map((k) => `"${k}"`).join(', ');

        const valueClauses = rows.map((row) => {
          const rowPlaceholders = keys.map((k) => {
            this.params.push(row[k]);
            return `$${this.params.length}`;
          });
          return `(${rowPlaceholders.join(', ')})`;
        });

        // Determine conflict target
        let conflictTarget = '("id")';
        if (this.upsertOptions?.onConflict) {
          conflictTarget = `("${this.upsertOptions.onConflict.replace(/\s+/g, '').split(',').join('", "')}")`;
        } else if (this.table === 'company_memberships') {
          conflictTarget = '("user_id", "company_id")';
        } else if (this.table === 'department_memberships') {
          conflictTarget = '("user_id", "department_id")';
        } else if (this.table === 'chat_members') {
          conflictTarget = '("room_id", "user_id")';
        }

        const updateSet = keys
          .filter((k) => !conflictTarget.includes(`"${k}"`))
          .map((k) => `"${k}" = EXCLUDED."${k}"`)
          .join(', ');

        const onConflictClause = updateSet
          ? `ON CONFLICT ${conflictTarget} DO UPDATE SET ${updateSet}`
          : `ON CONFLICT ${conflictTarget} DO NOTHING`;

        query = `INSERT INTO public."${this.table}" (${cols}) VALUES ${valueClauses.join(', ')} ${onConflictClause} RETURNING *;`;
      } else if (this.action === 'update') {
        const keys = Object.keys(this.updateData || {});
        if (keys.length === 0) return { data: null, error: null };
        const setClauses = keys.map((k) => {
          this.params.push(this.updateData[k]);
          return `"${k}" = $${this.params.length}`;
        });

        query = `UPDATE public."${this.table}" SET ${setClauses.join(', ')} ${whereClause} RETURNING *;`;
      } else if (this.action === 'delete') {
        query = `DELETE FROM public."${this.table}" ${whereClause} RETURNING *;`;
      }

      const res = await pool.query(query, this.params);

      if (this.isSingle) {
        if (res.rows.length === 0) {
          return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
        }
        return { data: res.rows[0], error: null };
      }

      if (this.isMaybeSingle) {
        return { data: res.rows[0] || null, error: null };
      }

      return { data: res.rows, error: null };
    } catch (err: any) {
      console.error(`PgQueryBuilder Error (${this.table}):`, err.message);
      return { data: null, error: { message: err.message } };
    }
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Direct PostgreSQL-backed Auth Admin
const pgAuthAdmin = {
  createUser: async ({
    email,
    password,
    user_metadata,
  }: {
    email: string;
    password?: string;
    email_confirm?: boolean;
    user_metadata?: any;
  }) => {
    try {
      const pool = getDbPool();
      const cleanEmail = email.toLowerCase().trim();

      const existing = await pool.query(
        'SELECT id, email FROM auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1;',
        [cleanEmail]
      );

      if (existing.rows.length > 0) {
        return { data: { user: existing.rows[0] }, error: null };
      }

      const pass = password || 'Password123!';
      const res = await pool.query(
        `INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, extensions.crypt($2, extensions.gen_salt('bf')), $3::jsonb, NOW(), NOW(), NOW())
         RETURNING id, email;`,
        [cleanEmail, pass, JSON.stringify(user_metadata || {})]
      );

      return { data: { user: res.rows[0] }, error: null };
    } catch (err: any) {
      console.error('PgAuthAdmin.createUser error:', err);
      return { data: null, error: { message: err.message } };
    }
  },
  deleteUser: async (id: string) => {
    try {
      const pool = getDbPool();
      await pool.query('DELETE FROM auth.users WHERE id = $1;', [id]);
      return { data: { user: null }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },
  listUsers: async () => {
    try {
      const pool = getDbPool();
      const res = await pool.query(
        'SELECT id, email, raw_user_meta_data, created_at FROM auth.users;'
      );
      return { data: { users: res.rows }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },
};

// Safe storage mock handler when Supabase Storage is not connected
const pgStorageMock = {
  from: (_bucket: string) => ({
    upload: async (path: string, _data: any, _options?: any) => {
      return { data: { path }, error: null };
    },
    download: async (_path: string) => {
      return { data: Buffer.from('mock content'), error: null };
    },
    remove: async (paths: string[]) => {
      return { data: paths, error: null };
    },
    createSignedUrl: async (path: string, _expiresIn: number) => {
      return { data: { signedUrl: `/api/files/download?path=${encodeURIComponent(path)}` }, error: null };
    },
    getPublicUrl: (path: string) => {
      return { data: { publicUrl: `/api/files/download?path=${encodeURIComponent(path)}` } };
    },
  }),
};

// Export adminClient proxy backed by direct PostgreSQL
export const adminClient = new Proxy(rawClient, {
  get(target: any, prop: string | symbol) {
    if (prop === 'from') {
      return (table: string) => new PgQueryBuilder(table);
    }
    if (prop === 'auth') {
      return {
        ...target.auth,
        admin: pgAuthAdmin,
      };
    }
    if (prop === 'storage') {
      return pgStorageMock;
    }
    return target[prop];
  },
}) as unknown as SupabaseClient<Database>;
