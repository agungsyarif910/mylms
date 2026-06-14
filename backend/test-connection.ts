import 'dotenv/config';
import { Pool } from 'pg';

async function testConnection() {
  console.log('Testing Supabase connection with explicit params...\n');

  // Test with explicit parameters (no URL encoding needed)
  try {
    console.log('--- Test 1: Explicit params (port 6543) ---');
    const pool = new Pool({
      host: 'aws-1-ap-southeast-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.eiilqwgkwdegrbdfrlwf',
      password: 'W4d1d4w@1234',
      ssl: { rejectUnauthorized: false },
    });
    const result = await pool.query('SELECT NOW() as time, current_database() as db, current_user as usr');
    console.log('✅ Connected!', result.rows[0]);
    await pool.end();
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
  }

  // Test with connection string using %40
  try {
    console.log('\n--- Test 2: Connection string with %40 ---');
    const pool2 = new Pool({
      connectionString: 'postgresql://postgres.eiilqwgkwdegrbdfrlwf:W4d1d4w%401234@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
      ssl: { rejectUnauthorized: false },
    });
    const result2 = await pool2.query('SELECT NOW() as time');
    console.log('✅ Connected!', result2.rows[0]);
    await pool2.end();
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
  }
}

testConnection();
