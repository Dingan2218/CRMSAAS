import { User, Lead, Company } from '../models/index.js';
import { getTestData } from './setup.js';

describe('Model Tests', () => {
    let testData;

    beforeAll(() => {
        testData = getTestData();
    });

    describe('User Model', () => {
        it('should hash password before saving', async () => {
            const user = testData.users.salesperson;

            // Password should be hashed
            expect(user.password).not.toBe('testpass123');
            expect(user.password.length).toBeGreaterThan(20);
        });

        it('should compare passwords correctly', async () => {
            const user = testData.users.salesperson;

            const isMatch = await user.comparePassword('testpass123');
            expect(isMatch).toBe(true);

            const isNotMatch = await user.comparePassword('wrongPassword');
            expect(isNotMatch).toBe(false);
        });

        it('should exclude password from JSON serialization', () => {
            const user = testData.users.salesperson;
            const userJSON = user.toJSON();

            expect(userJSON).not.toHaveProperty('password');
            expect(userJSON).toHaveProperty('email');
            expect(userJSON).toHaveProperty('name');
        });

        it('should have correct user roles', () => {
            expect(testData.users.superAdmin.role).toBe('super_admin');
            expect(testData.users.admin.role).toBe('admin');
            expect(testData.users.salesperson.role).toBe('salesperson');
        });

        it('should have active status set correctly', () => {
            expect(testData.users.salesperson.isActive).toBe(true);
            expect(testData.users.inactive.isActive).toBe(false);
        });

        it('should create new user with hashed password', async () => {
            const newUser = await User.create({
                name: 'New Test User',
                email: 'newuser@test.com',
                password: 'newpass123',
                role: 'salesperson',
                phone: '7777777777',
                companyId: testData.company.id
            });

            expect(newUser.password).not.toBe('newpass123');
            const isMatch = await newUser.comparePassword('newpass123');
            expect(isMatch).toBe(true);

            // Cleanup
            await newUser.destroy();
        });
    });

    describe('Company Model', () => {
        it('should have default values set', () => {
            const company = testData.company;

            expect(company.subscriptionStatus).toBe('active');
            expect(company.maxUsers).toBe(10);
        });

        it('should have correct company data', () => {
            const company = testData.company;

            expect(company.name).toBe('Test Company');
            expect(company.primaryColor).toBe('#22c55e');
        });

        it('should create company with custom values', async () => {
            const newCompany = await Company.create({
                name: 'Another Test Company',
                adminEmail: 'admin@another.com',
                adminPassword: 'admin123',
                subscriptionStatus: 'trial',
                maxUsers: 3
            });

            expect(newCompany.subscriptionStatus).toBe('trial');
            expect(newCompany.maxUsers).toBe(3);

            // Cleanup
            await newCompany.destroy();
        });
    });

    describe('Lead Model', () => {
        it('should have created test leads', () => {
            expect(testData.leads).toHaveLength(4);
        });

        it('should have correct lead statuses', () => {
            const statuses = testData.leads.map(lead => lead.status);

            expect(statuses).toContain('fresh');
            expect(statuses).toContain('follow-up');
            expect(statuses).toContain('closed');
            expect(statuses).toContain('dead');
        });

        it('should be assigned to salesperson', () => {
            const lead = testData.leads[0];

            expect(lead.assignedTo).toBe(testData.users.salesperson.id);
        });

        it('should create new lead', async () => {
            const newLead = await Lead.create({
                name: 'New Lead',
                email: 'newlead@example.com',
                phone: '6666666666',
                company: 'New Company',
                country: 'USA',
                status: 'fresh',
                assignedTo: testData.users.salesperson.id
            });

            expect(newLead.status).toBe('fresh');
            expect(newLead.name).toBe('New Lead');

            // Cleanup
            await newLead.destroy();
        });

        it('should update lead status', async () => {
            const lead = testData.leads[0];

            await lead.update({ status: 'follow-up' });
            await lead.reload();

            expect(lead.status).toBe('follow-up');

            // Restore original status
            await lead.update({ status: 'fresh' });
        });
    });

    describe('Model Associations', () => {
        it('should have user-company association', async () => {
            const user = await User.findByPk(testData.users.salesperson.id, {
                include: [{ model: Company, as: 'company' }]
            });

            expect(user.company).toBeDefined();
            expect(user.company.name).toBe('Test Company');
        });

        it('should have lead-user association', async () => {
            const lead = await Lead.findByPk(testData.leads[0].id, {
                include: [{ model: User, as: 'salesperson' }]
            });

            expect(lead.salesperson).toBeDefined();
            expect(lead.salesperson.name).toBe('Test Salesperson');
        });
    });
});
