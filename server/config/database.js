import { Sequelize } from 'sequelize';
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
  logging: false,
  dialectOptions: DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {}
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    // Apply model changes to DB schema automatically in dev
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

export default sequelize;
