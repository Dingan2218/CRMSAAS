#!/usr/bin/env node
/**
 * Test Database Setup Script
 * 
 * This script creates the test database if it doesn't exist.
 * Run this before running tests for the first time.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment
dotenv.config({ path: path.join(__dirname, '../.env.test') });

const { Client } = pg;

async function createTestDatabase() {
    // Connect to default postgres database
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres' // Connect to default database
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');

        // Check if test database exists
        const dbName = process.env.DB_NAME || 'crm_test';
        const checkResult = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        );

        if (checkResult.rows.length === 0) {
            // Create test database
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Test database '${dbName}' created successfully`);
        } else {
            console.log(`ℹ️  Test database '${dbName}' already exists`);
        }

    } catch (error) {
        console.error('❌ Error creating test database:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run the setup
createTestDatabase()
    .then(() => {
        console.log('\n✅ Test database setup complete!\n');
        console.log('You can now run tests with: npm test\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });
