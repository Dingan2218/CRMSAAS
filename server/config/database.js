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

console.log('🔍 DB Config:', {
  host: DB_HOST,
  port: DB_PORT,
  name: DB_NAME,
  user: DB_USER,
  ssl: DB_SSL,
  node_env: process.env.NODE_ENV
});

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  dialectModule: pg, // Required for Vercel/Serverless
  logging: false,
  // Only use SSL if explicitly requested. Some production setups might use private networking without SSL.
  dialectOptions: (DB_SSL === 'true') ? { ssl: { require: true, rejectUnauthorized: false } } : {}
});

let isConnected = false;

export const connectDB = async () => {
  // Skip if already connected (reuse connection in warm containers)
  if (isConnected) {
    console.log('♻️ Reusing existing DB connection');
    return;
  }

  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');

    // Skip sync in Vercel/serverless - tables should already exist
    if (process.env.VERCEL !== '1') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database synchronized');
    } else {
      console.log('⚡ Skipping sync in serverless environment');
    }

    isConnected = true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error; // Throw to make the error visible in Vercel logs
  }
};

export default sequelize;
