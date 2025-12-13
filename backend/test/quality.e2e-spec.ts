import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import * as request from 'supertest';

describe('Auth Endpoints (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', () => {
      const registerDto = {
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePassword123!',
        name: 'Test User',
        role: 'patient',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(registerDto.email);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 400 for invalid email', () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        name: 'Test User',
        role: 'patient',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should return 400 for weak password', () => {
      const registerDto = {
        email: `test-${Date.now()}@example.com`,
        password: 'weak',
        name: 'Test User',
        role: 'patient',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Test User',
          role: 'patient',
        });
    });

    it('should return JWT token on successful login', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(typeof res.body.access_token).toBe('string');
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        })
        .expect(401);
    });
  });
});

describe('Patients Endpoints (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let testPatientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login to get token
    const userEmail = `doctor-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: userEmail,
        password: 'DoctorPassword123!',
        name: 'Dr. Test',
        role: 'doctor',
      });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userEmail,
        password: 'DoctorPassword123!',
      });

    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /patients', () => {
    it('should return list of patients', () => {
      return request(app.getHttpServer())
        .get('/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/patients')
        .expect(401);
    });
  });

  describe('POST /patients', () => {
    it('should create a new patient', () => {
      const createPatientDto = {
        name: 'Test Patient',
        rut: `${Math.floor(Math.random() * 10000000)}-${Math.floor(Math.random() * 10)}`,
        dateOfBirth: '1990-01-01',
        cancerType: 'breast',
        stage: 'II',
        diagnosis: 'Invasive Ductal Carcinoma',
        treatmentSummary: 'Initial consultation',
      };

      return request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPatientDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(createPatientDto.name);
          testPatientId = res.body.id;
        });
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Patient',
        })
        .expect(400);
    });
  });

  describe('GET /patients/:id', () => {
    it('should return patient details', () => {
      if (!testPatientId) {
        return;
      }

      return request(app.getHttpServer())
        .get(`/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testPatientId);
        });
    });

    it('should return 404 for non-existent patient', () => {
      return request(app.getHttpServer())
        .get('/patients/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
