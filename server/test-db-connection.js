/**
 * Test Supabase Connection
 * Run this to verify your database connection works
 */

import pg from 'pg';

const { Client } = pg;

const config = {
    host: 'aws-1-ap-northeast-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.ksdsxjqgzikvodtwljqf',
    password: '2255',
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
};

console.log('🔍 Testing Supabase connection...');
console.log('Config:', { ...config, password: '***' });

const client = new Client(config);

try {
    await client.connect();
    console.log('✅ Connected successfully!');

    const result = await client.query('SELECT NOW()');
    console.log('✅ Query successful:', result.rows[0]);

    const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
    console.log('\n📊 Tables found:');
    tables.rows.forEach(row => console.log('  -', row.table_name));

    await client.end();
    console.log('\n✅ Connection test passed! Your database is working.');

} catch (error) {
    console.error('\n❌ Connection failed:');
    console.error(error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if the password is correct');
    console.error('2. Verify the pooler hostname');
    console.error('3. Make sure port 6543 is being used');
    process.exit(1);
}
