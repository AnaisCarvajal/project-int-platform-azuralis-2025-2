# Azuralis Healthcare Platform - Testing Quick Start

## Overview

This guide provides instructions for executing the comprehensive testing suite implemented for the Azuralis Healthcare Platform.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 15 (for local testing)
- Git

## Installation

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with test configuration
cp .env.example .env

# Update .env for testing
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=1234
DB_NAME=famed_ucn
```

### Database Setup

```bash
# Start PostgreSQL container
docker-compose up -d

# Wait for database to be ready
sleep 5

# Run migrations (if any)
npm run typeorm migration:run
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with watch mode
npm test:watch

# Run specific test file
npm test -- auth.service.spec.ts

# Run with coverage report
npm run test:cov
```

### Integration Tests

```bash
# Run all tests including integration
npm test

# Integration tests are identified by .spec.ts suffix in feature folders
```

### E2E Tests

```bash
# Run end-to-end tests
npm run test:e2e

# Run specific E2E suite
npm run test:e2e -- quality.e2e-spec.ts
```

## Test Coverage Analysis

### Generating Coverage Report

```bash
npm run test:cov

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Targets

| Metric | Target | Current |
|--------|--------|---------|
| Line Coverage | 80% | [To be updated after first run] |
| Branch Coverage | 75% | [To be updated after first run] |
| Function Coverage | 80% | [To be updated after first run] |
| Statement Coverage | 80% | [To be updated after first run] |

## Continuous Integration

### GitHub Actions Workflow

Tests are automatically executed on:
- Push to `main`, `deployment`, or `frontend-web` branches
- Pull requests to these branches

View workflow at: `.github/workflows/quality-assurance.yml`

### Local Simulation of CI Pipeline

```bash
# Build Docker image
docker build -t azuralis-backend:test .

# Run tests in Docker
docker run --rm \
  --env NODE_ENV=test \
  --env DB_HOST=localhost \
  azuralis-backend:test \
  npm run test:cov
```

## Test Structure

### Test Files Location

```
backend/
├── src/
│   ├── auth/
│   │   └── auth.service.spec.ts
│   ├── patients/
│   │   └── patients.service.spec.ts
│   └── ...
└── test/
    └── quality.e2e-spec.ts
```

### Test Naming Convention

- Unit tests: `{module}.service.spec.ts`
- Integration tests: `{module}.controller.spec.ts`
- E2E tests: `{feature}.e2e-spec.ts`

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5432
lsof -i :5432

# Kill process
kill -9 <PID>
```

### Database Connection Errors

```bash
# Check Docker status
docker ps

# Check PostgreSQL logs
docker logs <postgres-container-id>

# Restart database
docker-compose restart postgres
```

### Jest Configuration Issues

```bash
# Clear Jest cache
npm test -- --clearCache

# Verbose output
npm test -- --verbose
```

### Test Timeout

```typescript
// In test file
jest.setTimeout(30000); // 30 seconds
```

## Performance Tips

### Run Tests in Parallel

```bash
# Jest runs tests in parallel by default
# For 4 workers:
npm test -- --maxWorkers=4
```

### Run Specific Describe Block

```bash
npm test -- -t "AuthService"
```

### Skip Slow Tests

```typescript
// In test file
describe.skip('Slow integration tests', () => {
  // Tests here will be skipped
});
```

## Debugging Tests

### Run Single Test

```bash
npm test -- auth.service.spec.ts --testNamePattern="should register"
```

### Node Inspector

```bash
npm run test:debug
```

Then visit `chrome://inspect` in Chrome DevTools.

### Console Logging

```typescript
console.log('Debug info:', variable);
// Visible when using --verbose flag
npm test -- --verbose
```

## Documentation

For comprehensive information, refer to:

- **[TESTING.md](./TESTING.md)** - Complete testing strategy and guidelines
- **[USER_MANUAL.md](./USER_MANUAL.md)** - User documentation for all roles
- **[QUALITY_ASSURANCE_CHECKLIST.md](./QUALITY_ASSURANCE_CHECKLIST.md)** - QA verification checklist

## Test Examples

### Unit Test Example

```typescript
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, UserRepository],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should register user', async () => {
    const result = await service.register({
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test',
      role: 'patient',
    });

    expect(result).toHaveProperty('id');
  });
});
```

### E2E Test Example

```typescript
describe('Auth Endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('POST /auth/login should return token', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });
});
```

## CI/CD Integration

### Pre-commit Hook (Optional)

```bash
#!/bin/bash
# .git/hooks/pre-commit

cd backend
npm run test:cov

if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

### Build Pipeline Status

Check GitHub Actions: https://github.com/AnaisRodriguez1/project-int-platform-azuralis-2025-2/actions

## Quality Metrics Dashboard

After successful test runs, metrics are available at:

- **Local**: `coverage/lcov-report/index.html`
- **CI/CD**: GitHub Actions Artifacts
- **External**: Codecov integration (if configured)

## Advanced Topics

### Mocking External Services

```typescript
const mockS3 = {
  putObject: jest.fn().mockResolvedValue({ ETag: 'mock-etag' }),
};
```

### Testing Database Transactions

```typescript
it('should rollback on error', async () => {
  try {
    await service.createWithRelation(dto);
  } catch (error) {
    const result = await repo.findOne(id);
    expect(result).toBeUndefined();
  }
});
```

### Performance Testing

```bash
# Using k6 (install separately)
k6 run load-test.js
```

## Support and Contribution

For issues or improvements to the testing suite:

1. Create issue in GitHub repository
2. Include test output and environment details
3. Propose changes via pull request

---

**Last Updated**: December 2025  
**Version**: 1.0  
**Maintainer**: Quality Assurance Team
