/**
 * Create Initial Admin User
 * 
 * This script creates the first admin user in your production database
 */

import dotenv from 'dotenv';
dotenv.config();

import { User, Company } from './models/index.js';
import sequelize from './config/database.js';

async function createInitialAdmin() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Create a company first
        const company = await Company.create({
            name: 'SYSDEVCODE',
            adminEmail: 'admin@sysdevcode.com',
            adminPassword: 'changeme123',
            logoUrl: 'https://www.sysdevcode.com/images/SYSDEVCODELOGObackgroundremove.png',
            primaryColor: '#22c55e',
            subscriptionStatus: 'active',
            maxUsers: 50
        });
        console.log('✅ Company created:', company.name);

        // Create super admin
        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@sysdevcode.com',
            password: 'changeme123', // IMPORTANT: Change this after first login!
            role: 'super_admin',
            phone: '7510991147',
            companyId: company.id,
            isActive: true
        });
        console.log('✅ Super Admin created');

        console.log('\n🎉 Initial setup complete!');
        console.log('\n📧 Login credentials:');
        console.log('   Email: admin@sysdevcode.com');
        console.log('   Password: changeme123');
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.log('\nℹ️  Admin user already exists. You can log in now.');
        } else {
            console.error('\n❌ Error:', error.message);
        }
    } finally {
        await sequelize.close();
    }
}

createInitialAdmin();
