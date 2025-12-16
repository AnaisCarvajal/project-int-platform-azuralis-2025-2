import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../shared/enums/user-role.enum';

/**
 * Unit tests for AuthController
 * Tests HTTP layer without database connections
 * Uses mocks to isolate controller logic
 */
describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  // =====================================================
  // SETUP - Runs before each test
  // =====================================================
  beforeEach(async () => {
    // Create mock service with all methods
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
    };

    // Create testing module with mock provider
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
  });

  // =====================================================
  // BASIC TESTS
  // =====================================================
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =====================================================
  // REGISTER ENDPOINT TESTS
  // =====================================================
  describe('register', () => {
    const registerDto = {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'Password123',
      rut: '12.345.678-9',
      role: UserRole.PATIENT,
    };

    it('should call authService.register with correct parameters', async () => {
      // Arrange: Setup expected response
      const expectedResponse = {
        message: 'Usuario registrado con éxito',
        email: registerDto.email,
        role: registerDto.role,
        id: 'uuid-123',
      };
      mockAuthService.register.mockResolvedValue(expectedResponse);

      // Act: Call the controller method
      const result = await controller.register(registerDto);

      // Assert: Verify service was called correctly
      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.name,
        registerDto.email,
        registerDto.password,
        registerDto.rut,
        registerDto.role,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should return success response on valid registration', async () => {
      // Arrange
      mockAuthService.register.mockResolvedValue({
        message: 'Usuario registrado con éxito',
        email: 'test@test.com',
        role: UserRole.PATIENT,
        id: 'new-user-id',
      });

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(result.message).toBe('Usuario registrado con éxito');
      expect(result.id).toBeDefined();
    });
  });

  // =====================================================
  // LOGIN ENDPOINT TESTS
  // =====================================================
  describe('login', () => {
    const loginDto = {
      email: 'juan@example.com',
      password: 'Password123',
    };

    it('should call authService.login with correct parameters', async () => {
      // Arrange
      const expectedResponse = {
        access_token: 'jwt-token-xyz',
        role: UserRole.PATIENT,
      };
      mockAuthService.login.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should return access_token on successful login', async () => {
      // Arrange
      mockAuthService.login.mockResolvedValue({
        access_token: 'valid-jwt-token',
        role: UserRole.DOCTOR,
      });

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result.access_token).toBeDefined();
      expect(result.role).toBe(UserRole.DOCTOR);
    });
  });

  // =====================================================
  // GET PROFILE ENDPOINT TESTS
  // =====================================================
  describe('getMe', () => {
    it('should return user profile from JWT token', async () => {
      // Arrange: Mock request object with user from JWT
      const mockRequest = {
        user: { sub: 'user-uuid-123' },
      };
      const expectedProfile = {
        id: 'user-uuid-123',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        role: UserRole.PATIENT,
      };
      mockAuthService.getProfile.mockResolvedValue(expectedProfile);

      // Act
      const result = await controller.getMe(mockRequest);

      // Assert
      expect(mockAuthService.getProfile).toHaveBeenCalledWith('user-uuid-123');
      expect(result).toEqual(expectedProfile);
    });
  });

  // =====================================================
  // FORGOT PASSWORD ENDPOINT TESTS
  // =====================================================
  describe('forgotPassword', () => {
    it('should call requestPasswordReset and return success message', async () => {
      // Arrange
      const email = 'juan@example.com';
      mockAuthService.requestPasswordReset.mockResolvedValue(undefined);

      // Act
      const result = await controller.forgotPassword(email);

      // Assert
      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(email);
      expect(result.message).toBe(
        'Si el correo existe, se enviará un enlace de recuperación',
      );
    });
  });

  // =====================================================
  // RESET PASSWORD ENDPOINT TESTS
  // =====================================================
  describe('resetPassword', () => {
    it('should call resetPassword service method', async () => {
      // Arrange
      const token = 'reset-token-123';
      const newPassword = 'NewPassword456';
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      // Act
      const result = await controller.resetPassword(token, newPassword);

      // Assert
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        token,
        newPassword,
      );
      expect(result.message).toBe('Contraseña actualizada correctamente');
    });
  });
});
