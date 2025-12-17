/**
 * Production Database Migration Script
 * 
 * This script creates all necessary tables in your production database
 * Run this ONCE to initialize your Supabase database
 */

import dotenv from 'dotenv';
dotenv.config();

import sequelize from './config/database.js';
import './models/index.js'; // Import all models

async function setupProductionDatabase() {
    try {
        console.log('🔍 Checking database connection...');
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   Database: ${process.env.DB_NAME}`);

        await sequelize.authenticate();
        console.log('✅ Connected to database successfully');

        console.log('\n📝 Creating database tables...');

        // Create all tables (force: false means don't drop existing tables)
        await sequelize.sync({ force: false, alter: false });

        console.log('✅ All tables created successfully!');

        console.log('\n📊 Tables created:');
        const tables = await sequelize.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
            { type: sequelize.QueryTypes.SELECT }
        );
        tables.forEach(t => console.log(`   - ${t.table_name}`));

        console.log('\n✅ Production database is ready!');

    } catch (error) {
        console.error('\n❌ Error setting up database:');
        console.error(error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

setupProductionDatabase();
