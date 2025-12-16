import { Test, TestingModule } from '@nestjs/testing';
import { CareTeamService } from './care-team.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CareTeamMember } from '../entities/care-team-member.entity';
import { CareTeamRole } from '../../shared/enums/care-team-role.enum';

describe('CareTeamService', () => {
  let service: CareTeamService;
  let mockCareTeamRepo: any;

  // Mock care team member data
  const mockCareTeamMember: Partial<CareTeamMember> = {
    id: 'member-uuid-123',
    userId: 'user-uuid-456',
    name: 'Dr. Carlos Rodríguez',
    role: CareTeamRole.ONCOLOGO_PRINCIPAL,
    assignedAt: new Date(),
    status: 'active',
    patient: { id: 'patient-uuid-789' } as any,
  };

  // Separate mock for update scenarios
  const mockUpdatedMember: Partial<CareTeamMember> = {
    id: 'member-uuid-123',
    userId: 'user-uuid-456',
    name: 'Dr. Carlos Rodríguez García',
    role: CareTeamRole.ONCOLOGO_PRINCIPAL,
    assignedAt: new Date(),
    status: 'active',
    patient: { id: 'patient-uuid-789' } as any,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockCareTeamRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CareTeamService,
        {
          provide: getRepositoryToken(CareTeamMember),
          useValue: mockCareTeamRepo,
        },
      ],
    }).compile();

    service = module.get<CareTeamService>(CareTeamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =====================================================
  // ADD MEMBER TESTS
  // =====================================================

  describe('addMember', () => {
    it('should successfully add a new care team member', async () => {
      const memberData = {
        userId: 'user-uuid-456',
        name: 'Dr. Carlos Rodríguez',
        role: CareTeamRole.ONCOLOGO_PRINCIPAL,
      };

      mockCareTeamRepo.create.mockReturnValue(mockCareTeamMember);
      mockCareTeamRepo.save.mockResolvedValue(mockCareTeamMember);

      const result = await service.addMember(memberData);

      expect(mockCareTeamRepo.create).toHaveBeenCalledWith(memberData);
      expect(mockCareTeamRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Dr. Carlos Rodríguez');
    });
  });

  // =====================================================
  // FIND ALL MEMBERS TESTS
  // =====================================================

  describe('findAll', () => {
    it('should return all care team members with patient relations', async () => {
      mockCareTeamRepo.find.mockResolvedValue([mockCareTeamMember]);

      const result = await service.findAll();

      expect(mockCareTeamRepo.find).toHaveBeenCalledWith({
        relations: ['patient'],
      });
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
    });
  });

  // =====================================================
  // FIND BY PATIENT TESTS
  // =====================================================

  describe('findByPatient', () => {
    it('should return care team members for a specific patient', async () => {
      mockCareTeamRepo.find.mockResolvedValue([mockCareTeamMember]);

      const result = await service.findByPatient('patient-uuid-789');

      expect(mockCareTeamRepo.find).toHaveBeenCalledWith({
        where: { patient: { id: 'patient-uuid-789' } },
        relations: ['patient'],
      });
      expect(result[0].userId).toBe('user-uuid-456');
    });

    it('should return empty array when no members found', async () => {
      mockCareTeamRepo.find.mockResolvedValue([]);

      const result = await service.findByPatient('non-existent-patient');

      expect(result).toEqual([]);
    });
  });

  // =====================================================
  // UPDATE MEMBER TESTS
  // =====================================================

  describe('update', () => {
    it('should update care team member successfully', async () => {
      const updateData = { name: 'Dr. Carlos Rodríguez García' };
      const updatedMember = { ...mockCareTeamMember, ...updateData };

      mockCareTeamRepo.findOne.mockResolvedValue(mockCareTeamMember);
      mockCareTeamRepo.save.mockResolvedValue(updatedMember);

      const result = await service.update('member-uuid-123', updateData);

      expect((result as CareTeamMember).name).toBe('Dr. Carlos Rodríguez García');
    });

    it('should return message when member not found', async () => {
      mockCareTeamRepo.findOne.mockResolvedValue(null);

      const result = await service.update('non-existent-id', { name: 'Test' });

      expect(result).toEqual({ message: 'Miembro no encontrado' });
    });
  });

  // =====================================================
  // REMOVE MEMBER TESTS
  // =====================================================

  describe('remove', () => {
    it('should remove care team member successfully', async () => {
      mockCareTeamRepo.findOne.mockResolvedValue(mockCareTeamMember);
      mockCareTeamRepo.remove.mockResolvedValue(mockCareTeamMember);

      const result = await service.remove('member-uuid-123');

      expect(mockCareTeamRepo.remove).toHaveBeenCalledWith(mockCareTeamMember);
      expect(result).toEqual({ message: 'Miembro eliminado correctamente' });
    });

    it('should return message when member not found', async () => {
      mockCareTeamRepo.findOne.mockResolvedValue(null);

      const result = await service.remove('non-existent-id');

      expect(result).toEqual({ message: 'Miembro no encontrado' });
    });
  });

  // =====================================================
  // ADD MEMBER TO PATIENT TESTS
  // =====================================================

  describe('addMemberToPatient', () => {
    it('should add new member to patient care team', async () => {
      const newMember = {
        id: 'new-member-uuid',
        userId: 'user-uuid-456',
        name: 'Dr. Carlos Rodríguez',
        role: CareTeamRole.ONCOLOGO_PRINCIPAL,
        status: 'active',
        patient: { id: 'patient-uuid-789' },
      };

      mockCareTeamRepo.findOne.mockResolvedValue(null); // No existing member
      mockCareTeamRepo.create.mockReturnValue(newMember);
      mockCareTeamRepo.save.mockResolvedValue(newMember);

      const result = await service.addMemberToPatient(
        'patient-uuid-789',
        'user-uuid-456',
        'Dr. Carlos Rodríguez',
        CareTeamRole.ONCOLOGO_PRINCIPAL,
      );

      expect(mockCareTeamRepo.create).toHaveBeenCalledWith({
        userId: 'user-uuid-456',
        name: 'Dr. Carlos Rodríguez',
        role: CareTeamRole.ONCOLOGO_PRINCIPAL,
        status: 'active',
        patient: { id: 'patient-uuid-789' },
      });
      expect((result as CareTeamMember).name).toBe('Dr. Carlos Rodríguez');
    });

    it('should return message when member already exists', async () => {
      mockCareTeamRepo.findOne.mockResolvedValue(mockCareTeamMember);

      const result = await service.addMemberToPatient(
        'patient-uuid-789',
        'user-uuid-456',
        'Dr. Carlos Rodríguez',
        CareTeamRole.ONCOLOGO_PRINCIPAL,
      );

      expect(result).toEqual({ message: 'El usuario ya es miembro del equipo' });
    });
  });

  // =====================================================
  // REMOVE MEMBER FROM PATIENT TESTS
  // =====================================================

  describe('removeMemberFromPatient', () => {
    it('should remove member from care team', async () => {
      const activeMember = { ...mockCareTeamMember, status: 'active' };
      mockCareTeamRepo.findOne.mockResolvedValue(activeMember);
      mockCareTeamRepo.remove.mockResolvedValue(activeMember);

      const result = await service.removeMemberFromPatient(
        'patient-uuid-789',
        'user-uuid-456',
      );

      expect(mockCareTeamRepo.remove).toHaveBeenCalledWith(activeMember);
      expect(result).toEqual({ message: 'Miembro removido del equipo' });
    });

    it('should return message when member not found', async () => {
      mockCareTeamRepo.findOne.mockResolvedValue(null);

      const result = await service.removeMemberFromPatient(
        'patient-uuid-789',
        'non-existent-user',
      );

      expect(result).toEqual({ message: 'Miembro no encontrado' });
    });
  });
});
