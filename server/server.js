import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import sequelize, { connectDB } from './config/database.js';
import { User } from './models/index.js';
import bcrypt from 'bcryptjs';

// Load env vars
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import popupRoutes from './routes/popupRoutes.js';

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());
// Handle CORS preflight requests for all routes
app.options('*', cors());

// Connect to database
connectDB();

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminRole = (process.env.ADMIN_ROLE === 'super_admin') ? 'super_admin' : 'admin';

    if (!adminEmail || !adminPassword) {
      console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file');
      return;
    }

    let admin = await User.findOne({ where: { email: adminEmail } });

    if (!admin) {
      const legacyAdmin = await User.findOne({ where: { email: 'admin@crm.com' } });

      if (legacyAdmin) {
        legacyAdmin.email = adminEmail;
        const passwordMatches = await bcrypt.compare(adminPassword, legacyAdmin.password);
        if (!passwordMatches) {
          legacyAdmin.password = adminPassword;
        }
        await legacyAdmin.save();
        console.log('🔄 Updated legacy admin credentials to values from .env');
        return;
      }

      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: adminRole,
        phone: '1234567890'
      });
      console.log('✅ Default admin user created from .env credentials');
    } else {
      const passwordMatches = await bcrypt.compare(adminPassword, admin.password);
      if (!passwordMatches) {
        admin.password = adminPassword;
        await admin.save();
        console.log('🔐 Updated default admin password to value from .env');
      }
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Initialize default admin after DB connection (Only in persistent environments)
if (process.env.VERCEL !== '1') {
  setTimeout(createDefaultAdmin, 2000);
}

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api', popupRoutes);

// Health check route (includes DB status and dialect)
app.get('/api/health', async (req, res) => {
  const startedAt = Date.now();
  let db = { connected: false, dialect: null, error: null };
  try {
    await sequelize.authenticate();
    db.connected = true;
    db.dialect = sequelize.getDialect();
  } catch (err) {
    db.connected = false;
    db.error = err?.message || 'unknown';
    db.dialect = sequelize?.getDialect?.() || null;
  }
  res.status(db.connected ? 200 : 500).json({
    success: db.connected,
    message: 'CRM API is running',
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - startedAt,
    database: db
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Only listen if not running in Vercel (Vercel exports the app handler)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;

// Server refreshed for updates - 3
