# CRM SaaS - Test Database Setup

## 🗄️ Test Database Overview

The test suite uses a **dedicated PostgreSQL test database** (`crm_test`) to:
- ✅ Avoid affecting development/production data
- ✅ Provide consistent, isolated test environment
- ✅ Enable repeatable test runs with fresh data

## 📦 Seed Data

The test database is automatically seeded with:

### **Test Company**
- Name: "Test Company"
- Subscription: Active
- Max Users: 10
- Primary Color: #22c55e

### **Test Users**
1. **Super Admin**
   - Email: `admin@test.com`
   - Password: `testAdmin123`
   - Phone: `9999999999`
   - Role: super_admin

2. **Admin User**
   - Email: `testadmin@example.com`
   - Password: `testpass123`
   - Phone: `8888888888`
   - Role: admin

3. **Salesperson** (Primary test user)
   - Email: `test@example.com`
   - Password: `testpass123`
   - Phone: `1234567890`
   - Role: salesperson

4. **Inactive User**
   - Email: `inactive@example.com`
   - Password: `testpass123`
   - Phone: `5555555555`
   - Status: Inactive

### **Test Leads**
- 4 test leads with various statuses:
  - Fresh
  - Follow-up
  - Closed
  - Dead

## 🚀 Quick Start

### **1. Initial Setup (First Time Only)**
```bash
cd server
npm run test:setup
```

This creates the `crm_test` database if it doesn't exist.

### **2. Run Tests**
```bash
npm test
```

### **3. Run Tests in Watch Mode**
```bash
npm run test:watch
```

## ⚙️ Configuration

### Test Environment Variables (`.env.test`)
```env
NODE_ENV=test
DB_NAME=crm_test
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
```

## 🔄 How It Works

1. **Before Tests**: 
   - Loads`.env.test` environment
   - Drops and recreates all tables
   - Seeds database with test data
   - Makes test data available to all tests

2. **During Tests**:
   - Tests use seeded data
   - Can create/modify test data
   - Each test suite is isolated

3. **After Tests**:
   - Drops all tables
   - Closes database connections
   - Cleans up resources

## 📝 Using Test Data in Tests

```javascript
import { getTestData } from './setup.js';

describe('My Tests', () => {
  let testData;

  beforeAll(() => {
    testData = getTestData();
  });

  it('should use test user', () => {
    const user = testData.users.salesperson;
    expect(user.email).toBe('test@example.com');
  });
});
```

## 🧹 Manual Cleanup

If you need to manually reset the test database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Drop test database
DROP DATABASE crm_test;

# Recreate
npm run test:setup
```

## ⚠️ Important Notes

1. **Separate Database**: Test database is completely separate from development
2. **Fresh Data**: Database is reset before each test run
3. **No Side Effects**: Tests don't affect your development data
4. **Automatic Cleanup**: Resources are cleaned up after tests

## 🔒 Security

- Test credentials are stored in `.env.test`
- `.env.test` is git-ignored
- Never use production credentials in tests

## 📊 Test Data Structure

```
crm_test (database)
├── Companies (1)
│   └── Test Company
├── Users (4)
│   ├── Super Admin
│   ├── Admin
│   ├── Salesperson (Active)
│   └── Inactive User
└── Leads (4)
    ├── Fresh Lead
    ├── Follow-up Lead
    ├── Closed Lead
    └── Dead Lead
```

## 🎯 Next Steps

- [ ] Add more test fixtures as needed
- [ ] Create factory functions for dynamic test data
- [ ] Add test data for edge cases
- [ ] Implement test data snapshots
