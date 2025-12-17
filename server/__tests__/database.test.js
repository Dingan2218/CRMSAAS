import { connectDB } from '../config/database.js';
import sequelize from '../config/database.js';

describe('Database Connection Tests', () => {
    it('should connect to test database successfully', async () => {
        await expect(connectDB()).resolves.not.toThrow();
    });

    it('should authenticate with database', async () => {
        await expect(sequelize.authenticate()).resolves.not.toThrow();
    });

    it('should have correct test database configuration', () => {
        const config = sequelize.config;

        expect(config).toHaveProperty('host');
        expect(config).toHaveProperty('database');
        expect(config.dialect).toBe('postgres');
        expect(config.database).toBe('crm_test');
    });

    it('should reuse connection on subsequent calls', async () => {
        // First connection (already done in setup)
        const startTime = Date.now();
        await connectDB();
        const duration = Date.now() - startTime;

        // Should be very fast (< 50ms) if reusing connection
        expect(duration).toBeLessThan(50);
    });

    it('should have test environment variables loaded', () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.DB_NAME).toBe('crm_test');
        expect(process.env.JWT_SECRET).toBeDefined();
    });
});
