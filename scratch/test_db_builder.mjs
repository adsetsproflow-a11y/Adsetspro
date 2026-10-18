import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

function getDbUrl() {
  const envFiles = ['.env.local', '.env'];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  return null;
}

const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } });
await client.connect();

// Prototype of PgQueryBuilder
class PgQueryBuilder {
  constructor(table) {
    this.table = table;
    this.action = 'select'; // select, insert, update, delete
    this.selectedColumns = '*';
    this.conditions = [];
    this.params = [];
    this.orderClause = '';
    this.limitCount = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.insertData = null;
    this.updateData = null;
  }

  select(columns = '*', options = {}) {
    if (this.action === 'insert' || this.action === 'update') {
      // returning
      this.selectedColumns = columns;
      return this;
    }
    this.action = 'select';
    this.selectedColumns = columns;
    if (options.count === 'exact' && options.head) {
      this.selectedColumns = 'COUNT(*) as count';
    }
    return this;
  }

  insert(data) {
    this.action = 'insert';
    this.insertData = data;
    return this;
  }

  update(data) {
    this.action = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column, value) {
    this.params.push(value);
    this.conditions.push(`"${column}" = $${this.params.length}`);
    return this;
  }

  neq(column, value) {
    this.params.push(value);
    this.conditions.push(`"${column}" != $${this.params.length}`);
    return this;
  }

  in(column, values) {
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

  is(column, value) {
    if (value === null) {
      this.conditions.push(`"${column}" IS NULL`);
    } else {
      this.params.push(value);
      this.conditions.push(`"${column}" IS $${this.params.length}`);
    }
    return this;
  }

  not(column, operator, value) {
    if (operator === 'is' && value === null) {
      this.conditions.push(`"${column}" IS NOT NULL`);
    }
    return this;
  }

  ilike(column, pattern) {
    this.params.push(pattern);
    this.conditions.push(`"${column}" ILIKE $${this.params.length}`);
    return this;
  }

  gte(column, value) {
    this.params.push(value);
    this.conditions.push(`"${column}" >= $${this.params.length}`);
    return this;
  }

  lte(column, value) {
    this.params.push(value);
    this.conditions.push(`"${column}" <= $${this.params.length}`);
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderClause = `ORDER BY "${column}" ${ascending ? 'ASC' : 'DESC'}`;
    return this;
  }

  limit(count) {
    this.limitCount = count;
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

  async execute() {
    try {
      let query = '';
      const whereClause = this.conditions.length > 0 ? `WHERE ${this.conditions.join(' AND ')}` : '';

      if (this.action === 'select') {
        const order = this.orderClause || '';
        const lim = this.limitCount !== null ? `LIMIT ${this.limitCount}` : '';
        query = `SELECT ${this.selectedColumns} FROM public."${this.table}" ${whereClause} ${order} ${lim};`;
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
      } else if (this.action === 'update') {
        const keys = Object.keys(this.updateData);
        const setClauses = keys.map((k) => {
          this.params.push(this.updateData[k]);
          return `"${k}" = $${this.params.length}`;
        });

        query = `UPDATE public."${this.table}" SET ${setClauses.join(', ')} ${whereClause} RETURNING *;`;
      } else if (this.action === 'delete') {
        query = `DELETE FROM public."${this.table}" ${whereClause} RETURNING *;`;
      }

      const res = await client.query(query, this.params);

      if (this.selectedColumns === 'COUNT(*) as count') {
        return { data: null, count: parseInt(res.rows[0]?.count) || 0, error: null };
      }

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
    } catch (err) {
      console.error('PgQueryBuilder Error:', err.message);
      return { data: null, error: { message: err.message } };
    }
  }

  // Thenable interface so await builder works directly
  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Test the builder
async function testBuilder() {
  console.log('Testing PgQueryBuilder...\n');

  // Test 1: Fetch company by slug
  console.log('1. Fetch company by slug:');
  const comp = await new PgQueryBuilder('companies').select('id, name, slug').eq('slug', 'p8-test-org').single();
  console.log('Company:', comp);

  // Test 2: Fetch tasks
  console.log('\n2. Fetch tasks for company:');
  const tasks = await new PgQueryBuilder('tasks').select('*').eq('company_id', comp.data.id).limit(2);
  console.log(`Found ${tasks.data?.length} tasks.`);

  // Test 3: Count
  console.log('\n3. Count notifications:');
  const countRes = await new PgQueryBuilder('notifications').select('*', { count: 'exact', head: true }).is('read_at', null);
  console.log('Count:', countRes.count);

  await client.end();
}

testBuilder().catch(console.error);
