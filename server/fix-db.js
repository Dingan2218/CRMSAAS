import sequelize from './config/database.js';

const fix = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected');

        // Using raw queries to force column addition
        await sequelize.query('ALTER TABLE "Companies" ADD COLUMN IF NOT EXISTS "logoUrl" VARCHAR(255);');
        await sequelize.query('ALTER TABLE "Companies" ADD COLUMN IF NOT EXISTS "primaryColor" VARCHAR(255) DEFAULT \'#DC2626\';');

        console.log('✅ Columns added successfully');
    } catch (error) {
        console.error('❌ Error adding columns:', error);
    } finally {
        process.exit();
    }
};

fix();
