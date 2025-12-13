import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});

// =====================================================
// AUTH ENDPOINTS E2E TESTS
// =====================================================

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // =====================================================
  // REGISTER ENDPOINT TESTS
  // =====================================================

  describe('POST /auth/register', () => {
    it('should reject registration with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password123',
          rut: '12.345.678-9',
        })
        .expect(400);
    });

    it('should reject registration with weak password (no uppercase)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          rut: '12.345.678-9',
        })
        .expect(400);
    });

    it('should reject registration with weak password (no number)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'PasswordABC',
          rut: '12.345.678-9',
        })
        .expect(400);
    });

    it('should reject registration with invalid RUT format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
          rut: '12345678-9', // Missing dots
        })
        .expect(400);
    });

    it('should reject registration with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
        })
        .expect(400);
    });

    it('should reject registration with invalid role', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
          rut: '12.345.678-9',
          role: 'invalid_role',
        })
        .expect(400);
    });
  });

  // =====================================================
  // LOGIN ENDPOINT TESTS
  // =====================================================

  describe('POST /auth/login', () => {
    it('should reject login with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123',
        })
        .expect(400);
    });

    it('should reject login with short password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: '12345',
        })
        .expect(400);
    });

    it('should reject login with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123',
        })
        .expect(401);
    });
  });

  // =====================================================
  // PROTECTED ENDPOINT TESTS
  // =====================================================

  describe('GET /auth/me', () => {
    it('should reject request without authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject request with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });
});

// =====================================================
// PATIENTS ENDPOINTS E2E TESTS
// =====================================================

describe('Patients Endpoints (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /patients', () => {
    it('should return patients array', () => {
      return request(app.getHttpServer())
        .get('/patients')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /patients/:id', () => {
    it('should return 404 for non-existent patient', () => {
      return request(app.getHttpServer())
        .get('/patients/non-existent-uuid')
        .expect(404);
    });
  });

  describe('GET /patients/search/by-rut/:rut', () => {
    it('should return 404 for non-existent RUT', () => {
      return request(app.getHttpServer())
        .get('/patients/search/by-rut/99.999.999-9')
        .expect(404);
    });
  });

  describe('GET /patients/my-care-team/patients', () => {
    it('should reject request without authorization', () => {
      return request(app.getHttpServer())
        .get('/patients/my-care-team/patients')
        .expect(401);
    });
  });
});
