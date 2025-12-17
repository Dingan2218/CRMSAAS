# CRM SaaS - Unit Test Suite

## 📋 Test Overview

This test suite provides comprehensive coverage for the CRM SaaS application, testing critical functionality including authentication, database connections, and data models.

## 🧪 Test Structure

### 1. **Authentication Tests** (`__tests__/auth.test.js`)
- ✅ Login validation (phone & email)
- ✅ Missing credentials handling
- ✅ Invalid credentials detection
- ✅ JWT token generation
- ✅ Health check endpoint

### 2. **Database Tests** (`__tests__/database.test.js`)
- ✅ Connection establishment
- ✅ PostgreSQL authentication
- ✅ Configuration validation
- ✅ Connection pooling/reuse

### 3. **Model Tests** (`__tests__/models.test.js`)
- ✅ User model password hashing
- ✅ Password comparison
- ✅ Required field validation
- ✅ Company model defaults
- ✅ Lead model creation

## 🚀 Running Tests

### Run All Tests
```bash
cd server
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run with Coverage Report
```bash
npm test -- --coverage
```

## 📊 Test Results Summary

**Total Test Suites:** 3
**Total Tests:** 15

### Coverage Areas:
- Authentication Controllers
- Database Configuration
- User Model
- Company Model
- Lead Model
- API Endpoints

## 🛠️ Technologies Used

- **Jest** - Testing framework
- **Supertest** - HTTP endpoint testing
- **Sequelize** - ORM for database operations

## 📝 Adding New Tests

To add new tests:
1. Create a new file in `__tests__/` directory
2. Name it `<feature>.test.js`
3. Import necessary dependencies
4. Write your test cases using `describe` and `it` blocks

Example:
\`\`\`javascript
import { yourFunction } from '../controllers/yourController.js';

describe('Your Feature', () => {
  it('should do something', async () => {
    const result = await yourFunction();
    expect(result).toBe(expected);
  });
});
\`\`\`

## 🔧 Configuration

Test configuration is located in:
- `jest.config.json` - Jest settings
- `__tests__/setup.js` - Global test setup/teardown

## ⚠️ Important Notes

1. Tests use the same database as development
2. Model tests may modify database state (use with caution)
3. Always close database connections after tests
4. Test timeout is set to 30 seconds

## 🎯 Next Steps

- [ ] Add integration tests for lead distribution
- [ ] Add tests for middleware
- [ ] Increase code coverage to 80%+
- [ ] Add E2E tests for critical user flows
- [ ] Set up CI/CD pipeline for automated testing
