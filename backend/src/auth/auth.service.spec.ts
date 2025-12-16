import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserRole } from '../shared/enums/user-role.enum';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;
  let mockJwtService: any;
  let mockMailService: any;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    // Mock for MailService
    mockMailService = {
      sendPasswordResetEmail: jest.fn(),
    };

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
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =====================================================
  // REGISTER METHOD TESTS
  // =====================================================

  describe('register', () => {
    const registerDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      rut: '12.345.678-9',
      role: UserRole.PATIENT,
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      const savedUser = {
        id: 'uuid-123',
        ...registerDto,
        password: hashedPassword,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await service.register(
        registerDto.name,
        registerDto.email,
        registerDto.password,
        registerDto.rut,
        registerDto.role,
      );

      expect(result).toEqual({
        message: 'Usuario registrado con éxito',
        email: registerDto.email,
        role: registerDto.role,
        id: savedUser.id,
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ email: registerDto.email });

      await expect(
        service.register(
          registerDto.name,
          registerDto.email,
          registerDto.password,
          registerDto.rut,
          registerDto.role,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when RUT already exists', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(null) // Email check passes
        .mockResolvedValueOnce({ rut: registerDto.rut }); // RUT check fails

      await expect(
        service.register(
          registerDto.name,
          registerDto.email,
          registerDto.password,
          registerDto.rut,
          registerDto.role,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should use PATIENT as default role when not provided', async () => {
      const hashedPassword = 'hashedPassword123';
      const savedUser = {
        id: 'uuid-123',
        name: registerDto.name,
        email: registerDto.email,
        rut: registerDto.rut,
        password: hashedPassword,
        role: UserRole.PATIENT,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await service.register(
        registerDto.name,
        registerDto.email,
        registerDto.password,
        registerDto.rut,
      );

      expect(result.role).toBe(UserRole.PATIENT);
    });
  });

  // =====================================================
  // LOGIN METHOD TESTS
  // =====================================================

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    const mockUser = {
      id: 'uuid-123',
      email: loginDto.email,
      password: 'hashedPassword',
      role: UserRole.PATIENT,
    };

    it('should successfully login and return access token', async () => {
      const mockToken = 'jwt-token-123';

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto.email, loginDto.password);

      expect(result).toEqual({
        access_token: mockToken,
        role: mockUser.role,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login(loginDto.email, loginDto.password),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login(loginDto.email, loginDto.password),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // =====================================================
  // GET PROFILE METHOD TESTS
  // =====================================================

  describe('getProfile', () => {
    const userId = 'uuid-123';

    it('should return user profile without password', async () => {
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.PATIENT,
        scanHistory: null,
        assignedPatients: null,
        patientIds: null,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result.password).toBeUndefined();
      expect(result.id).toBe(userId);
      expect(result.name).toBe(mockUser.name);
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(BadRequestException);
    });

    it('should parse JSON fields correctly', async () => {
      const mockUser = {
        id: userId,
        name: 'Doctor Test',
        email: 'doctor@example.com',
        password: 'hashedPassword',
        role: UserRole.DOCTOR,
        scanHistory: JSON.stringify([{ patientId: 'p1', date: '2025-01-01' }]),
        assignedPatients: JSON.stringify(['patient-1', 'patient-2']),
        patientIds: null,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result.searchHistory).toEqual([{ patientId: 'p1', date: '2025-01-01' }]);
      expect(result.assignedPatients).toEqual(['patient-1', 'patient-2']);
    });

    it('should handle invalid JSON in scanHistory gracefully', async () => {
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.DOCTOR,
        scanHistory: 'invalid-json',
        assignedPatients: null,
        patientIds: null,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result.searchHistory).toEqual([]);
    });

    it('should parse patientIds for guardians', async () => {
      const mockUser = {
        id: userId,
        name: 'Guardian Test',
        email: 'guardian@example.com',
        password: 'hashedPassword',
        role: UserRole.GUARDIAN,
        scanHistory: null,
        assignedPatients: null,
        patientIds: JSON.stringify(['patient-1', 'patient-2']),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(result.patientIds).toEqual(['patient-1', 'patient-2']);
    });
  });
});
