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

const client = new Client({ connectionString: getDbUrl() });
await client.connect();

function transformSupabaseSelect(table, selectStr) {
  let cleaned = selectStr;
  
  // 1. Match alias:relTable!fk(cols)
  cleaned = cleaned.replace(/([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)\s*!\s*([a-zA-Z0-9_]+)\s*\(([^)]+)\)/g, (match, alias, relTable, fk, innerCols) => {
    const colList = innerCols.split(',').map(c => c.trim()).filter(Boolean);
    const jsonArgs = colList.map(c => `'${c}', rel."${c}"`).join(', ');
    return `(SELECT json_build_object(${jsonArgs}) FROM public."${relTable}" rel WHERE rel.id = public."${table}"."${fk}") as "${alias}"`;
  });

  // 2. Match alias:relTable(cols)
  cleaned = cleaned.replace(/([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)\s*\(([^)]+)\)/g, (match, alias, relTable, innerCols) => {
    const colList = innerCols.split(',').map(c => c.trim()).filter(Boolean);
    const jsonArgs = colList.map(c => `'${c}', rel."${c}"`).join(', ');
    const fk = `${relTable.replace(/s$/, '')}_id`;
    return `(SELECT json_build_object(${jsonArgs}) FROM public."${relTable}" rel WHERE rel.id = public."${table}"."${fk}") as "${alias}"`;
  });

  // 3. Match relTable(cols) without alias, excluding SQL functions like count, json_build_object, etc.
  cleaned = cleaned.replace(/\b(?!(?:json_build_object|count|coalesce|max|min|avg)\b)([a-zA-Z0-9_]+)\s*\(([^)]+)\)/g, (match, relTable, innerCols) => {
    const colList = innerCols.split(',').map(c => c.trim()).filter(Boolean);
    const jsonArgs = colList.map(c => `'${c}', rel."${c}"`).join(', ');
    const fk = `${relTable.replace(/s$/, '')}_id`;
    return `(SELECT json_build_object(${jsonArgs}) FROM public."${relTable}" rel WHERE rel.id = public."${table}"."${fk}") as "${relTable}"`;
  });

  return cleaned;
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
