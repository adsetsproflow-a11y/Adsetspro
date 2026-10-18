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

function transformSupabaseSelect(table, selectStr) {
  // Replace profile:profiles!user_id(...)
  let sql = selectStr.replace(/([a-zA-Z0-9_]+):([a-zA-Z0-9_]+)!([a-zA-Z0-9_]+)\(([^)]+)\)/g, (match, alias, relTable, fk, innerCols) => {
    const colList = innerCols.split(',').map(c => c.trim()).filter(Boolean);
    const jsonArgs = colList.map(c => `'${c}', rel.${c}`).join(', ');
    return `(SELECT json_build_object(${jsonArgs}) FROM public."${relTable}" rel WHERE rel.id = public."${table}"."${fk}") as "${alias}"`;
  });

  // Replace simple table:relTable(cols) or relTable(cols)
  sql = sql.replace(/([a-zA-Z0-9_]+)\(([^)]+)\)/g, (match, relTable, innerCols) => {
    const colList = innerCols.split(',').map(c => c.trim()).filter(Boolean);
    const jsonArgs = colList.map(c => `'${c}', rel.${c}`).join(', ');
    const fk = `${relTable.replace(/s$/, '')}_id`;
    return `(SELECT json_build_object(${jsonArgs}) FROM public."${relTable}" rel WHERE rel.id = public."${table}"."${fk}") as "${relTable}"`;
  });

  return sql;
}

async function testTransform() {
  const selectStr = `
    id,
    user_id,
    role,
    status,
    created_at,
    profile:profiles!user_id(
      id,
      full_name,
      email,
      avatar_url,
      phone,
      account_status
    )
  `;

  const transformed = transformSupabaseSelect('company_memberships', selectStr);
  console.log('Transformed SQL:\n', transformed);

  const query = `SELECT ${transformed} FROM public."company_memberships" LIMIT 2;`;
  const res = await client.query(query);
  console.log('Query result:', JSON.stringify(res.rows, null, 2));

  await client.end();
}

testTransform().catch(console.error);
