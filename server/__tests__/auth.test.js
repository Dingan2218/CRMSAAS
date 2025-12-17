import request from 'supertest';
import app from '../server.js';
import { getTestData } from './setup.js';

describe('Authentication API Tests', () => {
    let testData;

    beforeAll(() => {
        testData = getTestData();
    });

    describe('POST /api/auth/login-phone', () => {
        it('should return 400 if phone or password is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login-phone')
                .send({ phone: '1234567890' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('phone and password');
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login-phone')
                .send({
                    phone: '9999999999',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return token for valid salesperson credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login-phone')
                .send({
                    phone: '1234567890', // Test salesperson phone
                    password: 'testpass123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user).toHaveProperty('name');
            expect(response.body.data.user.role).toBe('salesperson');
        });

        it('should return 401 for inactive user', async () => {
            const response = await request(app)
                .post('/api/auth/login-phone')
                .send({
                    phone: '5555555555', // Inactive user
                    password: 'testpass123'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('deactivated');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return 400 if email or password is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 for invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return token for valid admin credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'testadmin@example.com',
                    password: 'testpass123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user.role).toBe('admin');
        });

        it('should return token for super admin credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'testAdmin123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.role).toBe('super_admin');
        });
    });

    describe('GET /api/auth/me', () => {
        let authToken;

        beforeAll(async () => {
            // Get auth token
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'testpass123'
                });
            authToken = response.body.data.token;
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
        });

        it('should return user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('email');
            expect(response.body.data.email).toBe('test@example.com');
        });
    });
});

describe('Health Check', () => {
    it('should return 200 for health check endpoint', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('CRM API is running');
        expect(response.body.database).toBeDefined();
        expect(response.body.database.connected).toBe(true);
    });
});
