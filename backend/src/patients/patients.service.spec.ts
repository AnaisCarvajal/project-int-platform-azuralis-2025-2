import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { PatientNote } from './entities/patient-note.entity';
import { PatientDocument } from './entities/patient-document.entity';

describe('PatientsService', () => {
  let service: PatientsService;
  let mockPatientRepository: any;
  let mockNotesRepository: any;
  let mockDocumentsRepository: any;

  const mockPatient = {
    id: 'patient-1',
    userId: 'user-1',
    name: 'John Doe',
    rut: '12.345.678-9',
    dateOfBirth: '1980-01-01',
    medicalHistory: 'No significant history',
    allergies: '["peanuts", "shellfish"]',
    currentMedications: '["aspirin", "lisinopril"]',
    bloodType: 'O+',
    emergencyContacts: [],
    careTeam: [],
    operations: [],
    qrCode: 'PATIENT:patient-1',
  };

  const mockPatientParsed = {
    id: 'patient-1',
    userId: 'user-1',
    name: 'John Doe',
    rut: '12.345.678-9',
    dateOfBirth: '1980-01-01',
    medicalHistory: 'No significant history',
    allergies: ['peanuts', 'shellfish'],
    currentMedications: ['aspirin', 'lisinopril'],
    bloodType: 'O+',
    emergencyContacts: [],
    careTeam: [],
    operations: [],
    qrCode: 'PATIENT:patient-1',
  };

  beforeEach(async () => {
    mockPatientRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        create: jest.fn(),
        remove: jest.fn(),
      },
    };

    mockNotesRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockDocumentsRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
        {
          provide: getRepositoryToken(PatientNote),
          useValue: mockNotesRepository,
        },
        {
          provide: getRepositoryToken(PatientDocument),
          useValue: mockDocumentsRepository,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all patients with parsed data', async () => {
      jest.clearAllMocks();
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPatient]),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPatientParsed);
      expect(result[0].allergies).toEqual(['peanuts', 'shellfish']);
    });

    it('should return empty array when no patients exist', async () => {
      jest.clearAllMocks();
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a patient with parsed data by ID', async () => {
      jest.clearAllMocks();
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPatient),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findOne('patient-1');

      expect(result).toEqual(mockPatientParsed);
      expect(result.allergies).toEqual(['peanuts', 'shellfish']);
      expect(result.currentMedications).toEqual(['aspirin', 'lisinopril']);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      jest.clearAllMocks();
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findPatientNotes', () => {
    it('should return notes for a patient', async () => {
      jest.clearAllMocks();
      const mockNotes = [
        {
          id: 'note-1',
          patientId: 'PATIENT-1',
          content: 'Test note',
          createdAt: new Date(),
        },
      ];

      mockNotesRepository.find.mockResolvedValue(mockNotes);

      const result = await service.findPatientNotes('patient-1');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Test note');
    });

    it('should return empty array when patient has no notes', async () => {
      jest.clearAllMocks();
      mockNotesRepository.find.mockResolvedValue([]);

      const result = await service.findPatientNotes('patient-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('findPatientDocuments', () => {
    it('should return documents for a patient', async () => {
      jest.clearAllMocks();
      const mockDocuments = [
        {
          id: 'doc-1',
          patientId: 'PATIENT-1',
          title: 'prescription.pdf',
          uploadDate: new Date(),
        },
      ];

      mockDocumentsRepository.find.mockResolvedValue(mockDocuments);

      const result = await service.findPatientDocuments('patient-1');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('prescription.pdf');
    });

    it('should return empty array when patient has no documents', async () => {
      jest.clearAllMocks();
      mockDocumentsRepository.find.mockResolvedValue([]);

      const result = await service.findPatientDocuments('patient-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getPatientName', () => {
    it('should return patient name', async () => {
      jest.clearAllMocks();
      mockPatientRepository.findOne.mockResolvedValue({
        name: 'John Doe',
      });

      const result = await service.getPatientName('patient-1');

      expect(result).toBe('John Doe');
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      jest.clearAllMocks();
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(service.getPatientName('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a patient', async () => {
      jest.clearAllMocks();
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPatient),
      };

      mockPatientRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockPatientRepository.remove.mockResolvedValue(mockPatient);

      const result = await service.remove('patient-1');

      expect(mockPatientRepository.remove).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
