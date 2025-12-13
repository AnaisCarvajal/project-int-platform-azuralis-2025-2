import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './auth/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  describe('AuthController', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have register method', () => {
      expect(controller.register).toBeDefined();
    });

    it('should have login method', () => {
      expect(controller.login).toBeDefined();
    });
  });
});
