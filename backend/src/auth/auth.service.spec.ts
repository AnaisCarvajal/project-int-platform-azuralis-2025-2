import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { UserRole } from '../shared/enums/user-role.enum';
import { ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userRepository: any;

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
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user with valid credentials', async () => {
      const name = 'Test User';
      const email = 'test@example.com';
      const password = 'SecurePassword123';
      const rut = '12.345.678-9';
      const role = UserRole.PATIENT;

      const hashedPassword = await bcrypt.hash(password, 10);
      const createdUser = {
        id: '1',
        name,
        email,
        rut,
        role,
        password: hashedPassword,
      };

      jest.clearAllMocks();
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      const result = await service.register(name, email, password, rut, role);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(email);
      expect(result.role).toBe(role);
    });

    it('should throw ConflictException when email already exists', async () => {
      jest.clearAllMocks();
      mockUserRepository.findOne.mockResolvedValueOnce({ id: '1' }); // Email exists

      await expect(
        service.register('Test', 'existing@example.com', 'SecurePassword123', '12.345.678-9', UserRole.PATIENT),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when RUT already exists', async () => {
      jest.clearAllMocks();
      mockUserRepository.findOne.mockResolvedValueOnce(null); // Email doesn't exist
      mockUserRepository.findOne.mockResolvedValueOnce({ id: '1' }); // RUT exists

      await expect(
        service.register('Test', 'test@example.com', 'SecurePassword123', '12.345.678-9', UserRole.PATIENT),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return JWT token on successful login', async () => {
      jest.clearAllMocks();
      const email = 'test@example.com';
      const password = 'SecurePassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = {
        id: '1',
        email,
        password: hashedPassword,
        role: UserRole.PATIENT,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt.token.here');

      const result = await service.login(email, password);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('jwt.token.here');
      expect(result.role).toBe(UserRole.PATIENT);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      jest.clearAllMocks();
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login('nonexistent@example.com', 'SecurePassword123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      jest.clearAllMocks();
      const email = 'test@example.com';
      const password = 'CorrectPassword123';
      const wrongPassword = 'WrongPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = {
        id: '1',
        email,
        password: hashedPassword,
        role: UserRole.PATIENT,
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.login(email, wrongPassword)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      jest.clearAllMocks();
      const userId = '1';
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.PATIENT,
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.getProfile(userId);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw BadRequestException when user does not exist', async () => {
      jest.clearAllMocks();
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(BadRequestException);
    });
  });
});
