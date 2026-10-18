import pg from 'pg';
import fs from 'fs';
import crypto from 'crypto';

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

async function checkToken() {
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();

  const rawTokens = [
    '592640ef5baffdcfaabc33f7877bedf2d7958b169168b817a81ed20abc72db65',
    'be88cf870d886794e374d7e63b3b0c8e88a51cd0620198f95cae966fdfb1a39b'
  ];

  for (const token of rawTokens) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const res = await client.query('SELECT * FROM public.invitations WHERE token_hash = $1', [hash]);
    console.log(`Token ${token.slice(0, 10)}... match:`, res.rows);
  }

  const allInv = await client.query('SELECT id, email, full_name, status, created_at FROM public.invitations ORDER BY created_at DESC LIMIT 10;');
  console.log('All recent invitations:', allInv.rows);

  await client.end();
}

checkToken().catch(console.error);
