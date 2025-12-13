import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { PatientDocument } from './entities/patient-document.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PatientsService', () => {
  let service: PatientsService;
  let patientRepository: any;
  let documentRepository: any;

  const mockPatientRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockDocumentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
        {
          provide: getRepositoryToken(PatientDocument),
          useValue: mockDocumentRepository,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    patientRepository = module.get(getRepositoryToken(Patient));
    documentRepository = module.get(getRepositoryToken(PatientDocument));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all patients', async () => {
      const mockPatients = [
        {
          id: '1',
          name: 'Patient 1',
          rut: '12345678-9',
          cancerType: 'breast',
        },
        {
          id: '2',
          name: 'Patient 2',
          rut: '87654321-0',
          cancerType: 'lung',
        },
      ];

      mockPatientRepository.find.mockResolvedValue(mockPatients);

      const result = await service.getAll();

      expect(result).toEqual(mockPatients);
      expect(mockPatientRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no patients exist', async () => {
      mockPatientRepository.find.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return patient by id', async () => {
      const mockPatient = {
        id: '1',
        name: 'Test Patient',
        rut: '12345678-9',
        cancerType: 'breast',
      };

      mockPatientRepository.findOne.mockResolvedValue(mockPatient);

      const result = await service.getById('1');

      expect(result).toEqual(mockPatient);
      expect(mockPatientRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new patient', async () => {
      const createPatientDto = {
        name: 'New Patient',
        rut: '11111111-1',
        dateOfBirth: '1990-01-01',
        cancerType: 'breast',
        stage: 'II',
        diagnosis: 'Invasive Ductal Carcinoma',
        treatmentSummary: 'Under chemotherapy',
      };

      const createdPatient = { id: '1', ...createPatientDto };

      mockPatientRepository.create.mockReturnValue(createdPatient);
      mockPatientRepository.save.mockResolvedValue(createdPatient);

      const result = await service.create(createPatientDto);

      expect(result).toEqual(createdPatient);
      expect(mockPatientRepository.create).toHaveBeenCalledWith(
        createPatientDto,
      );
      expect(mockPatientRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException with invalid RUT format', async () => {
      const createPatientDto = {
        name: 'New Patient',
        rut: 'invalid-rut',
        dateOfBirth: '1990-01-01',
        cancerType: 'breast',
        stage: 'II',
        diagnosis: 'Invasive Ductal Carcinoma',
        treatmentSummary: 'Under chemotherapy',
      };

      await expect(service.create(createPatientDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing patient', async () => {
      const patientId = '1';
      const updateDto = { treatmentSummary: 'Updated treatment' };
      const updatedPatient = {
        id: patientId,
        name: 'Test Patient',
        treatmentSummary: 'Updated treatment',
      };

      mockPatientRepository.findOne.mockResolvedValue({ id: patientId });
      mockPatientRepository.update.mockResolvedValue({ affected: 1 });
      mockPatientRepository.findOne.mockResolvedValue(updatedPatient);

      const result = await service.update(patientId, updateDto);

      expect(result).toEqual(updatedPatient);
    });

    it('should throw NotFoundException when updating non-existent patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { treatmentSummary: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDocuments', () => {
    it('should return documents for a patient', async () => {
      const patientId = '1';
      const mockDocuments = [
        {
          id: 'doc1',
          title: 'Biopsy Report',
          type: 'examen',
          patientId,
        },
        {
          id: 'doc2',
          title: 'Surgery Report',
          type: 'cirugia',
          patientId,
        },
      ];

      mockDocumentRepository.find.mockResolvedValue(mockDocuments);

      const result = await service.getDocuments(patientId);

      expect(result).toEqual(mockDocuments);
      expect(mockDocumentRepository.find).toHaveBeenCalledWith({
        where: { patientId },
      });
    });

    it('should return empty array when patient has no documents', async () => {
      mockDocumentRepository.find.mockResolvedValue([]);

      const result = await service.getDocuments('1');

      expect(result).toEqual([]);
    });
  });
});
