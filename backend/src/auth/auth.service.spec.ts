import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
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
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
        role: 'patient',
      };

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const createdUser = {
        id: '1',
        ...registerDto,
        password: hashedPassword,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(registerDto.email);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should throw error when user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
        role: 'patient',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.register(registerDto)).rejects.toThrow(
        'User already exists',
      );
    });

    it('should throw error when email is invalid', async () => {
      const registerDto: RegisterDto = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        name: 'Test User',
        role: 'patient',
      };

      await expect(service.register(registerDto)).rejects.toThrow();
    });

    it('should throw error when password is too weak', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
        role: 'patient',
      };

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should return JWT token on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const user = {
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        role: 'patient',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt.token.here');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('jwt.token.here');
    });

    it('should throw error when user does not exist', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'SecurePassword123!',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw error when password is incorrect', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
      const user = {
        id: '1',
        email: loginDto.email,
        password: hashedPassword,
        role: 'patient',
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'SecurePassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = {
        id: '1',
        email,
        password: hashedPassword,
        role: 'patient',
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.validateUser(email, password);

      expect(result).toBeDefined();
      expect(result.email).toBe(email);
    });

    it('should return null when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(result).toBeNull();
    });
  });
});
