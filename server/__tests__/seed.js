import { User, Company, Lead } from '../models/index.js';
import sequelize from '../config/database.js';

export async function setupTestDatabase() {
    try {
        // Force sync to create fresh tables
        await sequelize.sync({ force: true });
        console.log('✅ Test database tables created');

        // Create test company
        const testCompany = await Company.create({
            name: 'Test Company',
            adminEmail: 'admin@testcompany.com',
            adminPassword: 'admin123',
            logoUrl: 'https://example.com/logo.png',
            primaryColor: '#22c55e',
            subscriptionStatus: 'active',
            maxUsers: 10
        });
        console.log('✅ Test company created');

        // Create super admin user
        const superAdmin = await User.create({
            name: 'Super Admin',
            email: 'admin@test.com',
            password: 'testAdmin123',
            role: 'super_admin',
            phone: '9999999999',
            isActive: true
        });
        console.log('✅ Super admin created');

        // Create test admin user
        const adminUser = await User.create({
            name: 'Test Admin',
            email: 'testadmin@example.com',
            password: 'testpass123',
            role: 'admin',
            phone: '8888888888',
            companyId: testCompany.id,
            isActive: true
        });
        console.log('✅ Admin user created');

        // Create test salesperson
        const testSalesperson = await User.create({
            name: 'Test Salesperson',
            email: 'test@example.com',
            password: 'testpass123',
            role: 'salesperson',
            phone: '1234567890',
            companyId: testCompany.id,
            monthlyTarget: 50,
            weeklyTarget: 12,
            isActive: true
        });
        console.log('✅ Test salesperson created');

        // Create inactive user (for testing deactivation)
        const inactiveUser = await User.create({
            name: 'Inactive User',
            email: 'inactive@example.com',
            password: 'testpass123',
            role: 'salesperson',
            phone: '5555555555',
            companyId: testCompany.id,
            isActive: false
        });
        console.log('✅ Inactive user created');

        // Create test leads
        const leads = await Lead.bulkCreate([
            {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '1111111111',
                company: 'ACME Corp',
                country: 'USA',
                product: 'Software',
                status: 'fresh',
                assignedTo: testSalesperson.id
            },
            {
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '2222222222',
                company: 'Tech Inc',
                country: 'UK',
                product: 'Hardware',
                status: 'follow-up',
                assignedTo: testSalesperson.id
            },
            {
                name: 'Bob Johnson',
                email: 'bob@example.com',
                phone: '3333333333',
                company: 'StartupXYZ',
                country: 'Canada',
                product: 'Service',
                status: 'closed',
                value: 50000,
                assignedTo: testSalesperson.id
            },
            {
                name: 'Alice Williams',
                email: 'alice@example.com',
                phone: '4444444444',
                company: 'Enterprise Co',
                country: 'Australia',
                product: 'Software',
                status: 'dead',
                assignedTo: testSalesperson.id
            }
        ]);
        console.log(`✅ ${leads.length} test leads created`);

        return {
            company: testCompany,
            users: {
                superAdmin,
                admin: adminUser,
                salesperson: testSalesperson,
                inactive: inactiveUser
            },
            leads
        };
    } catch (error) {
        console.error('❌ Error setting up test database:', error);
        throw error;
    }
}

export async function teardownTestDatabase() {
    try {
        // Drop all tables
        await sequelize.drop();
        console.log('✅ Test database cleaned up');
    } catch (error) {
        console.error('❌ Error tearing down test database:', error);
        throw error;
    }
}
