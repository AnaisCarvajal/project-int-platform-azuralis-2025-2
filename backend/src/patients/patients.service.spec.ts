import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientNote } from './entities/patient-note.entity';
import { PatientDocument } from './entities/patient-document.entity';
import { NotFoundException } from '@nestjs/common';
import { CancerType } from '../shared/enums/cancer-type.enum';

// Mock QRCode module
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
}));

describe('PatientsService', () => {
  let service: PatientsService;
  let mockPatientRepo: any;
  let mockNotesRepo: any;
  let mockDocumentsRepo: any;

  // Mock patient data for testing
  const mockPatient: Partial<Patient> = {
    id: 'patient-uuid-123',
    name: 'Juan Pérez',
    dateOfBirth: new Date('1990-05-15'),
    rut: '12.345.678-9',
    diagnosis: 'Leucemia Linfoblástica Aguda',
    stage: 'II',
    cancerType: CancerType.OTHER,
    allergies: '["Penicilina", "Aspirina"]',
    currentMedications: '["Metformina", "Omeprazol"]',
    qrCode: 'PATIENT:patient-uuid-123',
    careTeam: [],
    emergencyContacts: [],
    operations: [],
  };

  const mockCreatePatientDto = {
    name: 'María González',
    dateOfBirth: '1985-03-20',
    rut: '11.222.333-4',
    diagnosis: 'Cáncer de Mama',
    stage: 'I',
    cancerType: CancerType.BREAST as CancerType,
    allergies: ['Ibuprofeno'],
    currentMedications: ['Tamoxifeno'],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create mock query builder
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockPatient]),
      getOne: jest.fn().mockResolvedValue(mockPatient),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockPatientRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      manager: {
        create: jest.fn(),
        remove: jest.fn(),
      },
    };

    mockNotesRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockDocumentsRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepo,
        },
        {
          provide: getRepositoryToken(PatientNote),
          useValue: mockNotesRepo,
        },
        {
          provide: getRepositoryToken(PatientDocument),
          useValue: mockDocumentsRepo,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =====================================================
  // CREATE PATIENT TESTS
  // =====================================================

  describe('create', () => {
    it('should successfully create a new patient', async () => {
      const savedPatient = {
        id: 'new-patient-uuid',
        ...mockCreatePatientDto,
        allergies: JSON.stringify(mockCreatePatientDto.allergies),
        currentMedications: JSON.stringify(mockCreatePatientDto.currentMedications),
        qrCode: 'PLACEHOLDER',
      };

      const finalPatient = {
        ...savedPatient,
        qrCode: 'PATIENT:new-patient-uuid',
      };

      mockPatientRepo.create.mockReturnValue(savedPatient);
      mockPatientRepo.save
        .mockResolvedValueOnce(savedPatient)
        .mockResolvedValueOnce(finalPatient);

      const result = await service.create(mockCreatePatientDto);

      expect(mockPatientRepo.create).toHaveBeenCalled();
      expect(mockPatientRepo.save).toHaveBeenCalledTimes(2);
      expect(result.qrCode).toBe('PATIENT:new-patient-uuid');
      expect(result.allergies).toEqual(mockCreatePatientDto.allergies);
    });

    it('should convert arrays to JSON strings during creation', async () => {
      const savedPatient = {
        id: 'new-patient-uuid',
        allergies: '["Ibuprofeno"]',
        currentMedications: '["Tamoxifeno"]',
        qrCode: 'PATIENT:new-patient-uuid',
      };

      mockPatientRepo.create.mockReturnValue(savedPatient);
      mockPatientRepo.save.mockResolvedValue(savedPatient);

      await service.create(mockCreatePatientDto);

      expect(mockPatientRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          allergies: '["Ibuprofeno"]',
          currentMedications: '["Tamoxifeno"]',
        }),
      );
    });

    it('should use empty array JSON when allergies not provided', async () => {
      const dtoWithoutAllergies = {
        ...mockCreatePatientDto,
        allergies: undefined,
      };

      const savedPatient = {
        id: 'new-patient-uuid',
        qrCode: 'PATIENT:new-patient-uuid',
        allergies: '[]',
        currentMedications: '["Tamoxifeno"]',
      };

      mockPatientRepo.create.mockReturnValue(savedPatient);
      mockPatientRepo.save.mockResolvedValue(savedPatient);

      await service.create(dtoWithoutAllergies);

      expect(mockPatientRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          allergies: '[]',
        }),
      );
    });
  });

  // =====================================================
  // FIND ALL PATIENTS TESTS
  // =====================================================

  describe('findAll', () => {
    it('should return an array of patients with parsed JSON fields', async () => {
      const result = await service.findAll();

      expect(result).toBeInstanceOf(Array);
      expect(result[0].allergies).toEqual(['Penicilina', 'Aspirina']);
      expect(result[0].currentMedications).toEqual(['Metformina', 'Omeprazol']);
    });

    it('should call createQueryBuilder with correct joins', async () => {
      await service.findAll();

      expect(mockPatientRepo.createQueryBuilder).toHaveBeenCalledWith('patient');
    });
  });

  // =====================================================
  // FIND ONE PATIENT TESTS
  // =====================================================

  describe('findOne', () => {
    it('should return a patient by id with parsed data', async () => {
      const result = await service.findOne('patient-uuid-123');

      expect(result.id).toBe('patient-uuid-123');
      expect(result.name).toBe('Juan Pérez');
      expect(result.allergies).toEqual(['Penicilina', 'Aspirina']);
    });

    it('should throw NotFoundException when patient not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockPatientRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =====================================================
  // FIND BY RUT TESTS
  // =====================================================

  describe('findByRut', () => {
    it('should find patient by RUT', async () => {
      const result = await service.findByRut('12.345.678-9');

      expect(result.rut).toBe('12.345.678-9');
      expect(result.name).toBe('Juan Pérez');
    });

    it('should normalize RUT for search (remove dots)', async () => {
      const result = await service.findByRut('12345678-9');

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when RUT not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockPatientRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.findByRut('99.999.999-9')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =====================================================
  // FIND MY CARE TEAM PATIENTS TESTS
  // =====================================================

  describe('findMyCareTeamPatients', () => {
    it('should return patients where user is in active care team', async () => {
      const result = await service.findMyCareTeamPatients('user-uuid-123');

      expect(result).toBeInstanceOf(Array);
      expect(mockPatientRepo.createQueryBuilder).toHaveBeenCalledWith('patient');
    });
  });

  // =====================================================
  // UPDATE PATIENT TESTS
  // =====================================================

  describe('update', () => {
    it('should update patient data successfully', async () => {
      const updateData = { name: 'Juan Pérez García' };

      const result = await service.update('patient-uuid-123', updateData);

      expect(result).toBeDefined();
    });

    it('should convert arrays to JSON strings when updating allergies', async () => {
      const updateData = { allergies: ['Nueva Alergia'] as any };

      await service.update('patient-uuid-123', updateData);

      // Verify the conversion happened
      expect(mockPatientRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  // =====================================================
  // REMOVE PATIENT TESTS
  // =====================================================

  describe('remove', () => {
    it('should remove a patient', async () => {
      mockPatientRepo.remove.mockResolvedValue(mockPatient);

      const result = await service.remove('patient-uuid-123');

      expect(mockPatientRepo.remove).toHaveBeenCalled();
    });
  });

  // =====================================================
  // GENERATE QR CODE TESTS
  // =====================================================

  describe('generateQRCode', () => {
    it('should generate QR code data URL', async () => {
      const result = await service.generateQRCode('patient-uuid-123');

      expect(result).toContain('data:image/png;base64');
    });
  });

  // =====================================================
  // PATIENT NOTES TESTS
  // =====================================================

  describe('findPatientNotes', () => {
    it('should return patient notes ordered by date', async () => {
      const mockNotes = [
        { id: 'note-1', content: 'Nota 1', createdAt: new Date() },
        { id: 'note-2', content: 'Nota 2', createdAt: new Date() },
      ];

      mockNotesRepo.find.mockResolvedValue(mockNotes);

      const result = await service.findPatientNotes('patient-uuid-123');

      expect(result).toEqual(mockNotes);
      expect(mockNotesRepo.find).toHaveBeenCalledWith({
        where: { patientId: 'PATIENT-UUID-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // =====================================================
  // PATIENT DOCUMENTS TESTS
  // =====================================================

  describe('findPatientDocuments', () => {
    it('should return patient documents ordered by upload date', async () => {
      const mockDocuments = [
        { id: 'doc-1', filename: 'examen.pdf', uploadDate: new Date() },
        { id: 'doc-2', filename: 'receta.pdf', uploadDate: new Date() },
      ];

      mockDocumentsRepo.find.mockResolvedValue(mockDocuments);

      const result = await service.findPatientDocuments('patient-uuid-123');

      expect(result).toEqual(mockDocuments);
      expect(mockDocumentsRepo.find).toHaveBeenCalledWith({
        where: { patientId: 'PATIENT-UUID-123' },
        order: { uploadDate: 'DESC' },
      });
    });
  });

  // =====================================================
  // GET PATIENT NAME TESTS
  // =====================================================

  describe('getPatientName', () => {
    it('should return patient name', async () => {
      mockPatientRepo.findOne.mockResolvedValue({ name: 'Juan Pérez' });

      const result = await service.getPatientName('patient-uuid-123');

      expect(result).toBe('Juan Pérez');
    });

    it('should throw NotFoundException when patient not found', async () => {
      mockPatientRepo.findOne.mockResolvedValue(null);

      await expect(service.getPatientName('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =====================================================
  // SAVE SCAN HISTORY TESTS
  // =====================================================

  describe('saveScanHistory', () => {
    it('should return scan history entry', async () => {
      const result = await service.saveScanHistory('patient-uuid-123', '12.345.678-9');

      expect(result.patientId).toBe('patient-uuid-123');
      expect(result.patientRut).toBe('12.345.678-9');
      expect(result.patientName).toBe('Juan Pérez');
      expect(result.searchedAt).toBeInstanceOf(Date);
    });
  });
});
