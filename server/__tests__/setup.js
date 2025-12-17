import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../.env.test') });

import sequelize from '../config/database.js';
import { setupTestDatabase, teardownTestDatabase } from './seed.js';

// Global test data
let testData = null;

// Global test setup and teardown
beforeAll(async () => {
    // Set test timeout
    jest.setTimeout(30000);

    console.log('\n🧪 Setting up test environment...\n');

    // Verify we're in test environment
    if (process.env.NODE_ENV !== 'test') {
        console.warn('⚠️  Warning: Running tests outside test environment');
    }

    // Setup database with seed data
    testData = await setupTestDatabase();

    // Make test data available globally
    global.testData = testData;
});

afterAll(async () => {
    console.log('\n🧹 Cleaning up test environment...\n');

    // Cleanup database
    await teardownTestDatabase();

    // Close all database connections after tests
    await sequelize.close();
});

// Export test data accessor
export const getTestData = () => global.testData;
