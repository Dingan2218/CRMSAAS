import { Sequelize } from 'sequelize';
import pg from 'pg'; // Explicitly load pg driver for Serverless/Vercel
import dotenv from 'dotenv';

dotenv.config();

// Use PostgreSQL via environment variables
const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'crm',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_SSL = 'false'
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  dialectModule: pg, // Required for Vercel/Serverless
  logging: false,
  // Only use SSL if explicitly requested. Some production setups might use private networking without SSL.
  dialectOptions: (DB_SSL === 'true') ? { ssl: { require: true, rejectUnauthorized: false } } : {}
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    // Apply model changes to DB schema automatically in dev
    // Changed to false to prevent ENUM casting errors. Use force: true (manual script) for major schema changes.
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    // process.exit(1); // Do not exit in serverless; let the request fail with a 500 but keep the container alive if possible, or usually it will just restart.
    // If we throw here, it might be unhandled. Better to just let it be logged.
  }
};

export default sequelize;
