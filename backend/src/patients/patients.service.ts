import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { PatientNote } from './entities/patient-note.entity';
import { PatientDocument } from './entities/patient-document.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { Operation } from './entities/operation.entity';
import { CareTeamMember } from './entities/care-team-member.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(PatientNote)
    private readonly notesRepo: Repository<PatientNote>,
    @InjectRepository(PatientDocument)
    private readonly documentsRepo: Repository<PatientDocument>,
  ) {}

  async create(createPatientDto: CreatePatientDto) {
    // Convertir arrays a JSON strings para Azure SQL
    const processedData = {
      ...createPatientDto,
      allergies: Array.isArray(createPatientDto.allergies) 
        ? JSON.stringify(createPatientDto.allergies) 
        : '[]',
      currentMedications: Array.isArray(createPatientDto.currentMedications) 
        ? JSON.stringify(createPatientDto.currentMedications) 
        : '[]',
      qrCode: 'PLACEHOLDER', // Placeholder temporal para evitar NULL
    };

    // Crear y guardar el paciente primero
    const newPatient = this.patientRepo.create(processedData);
    const savedPatient = await this.patientRepo.save(newPatient);
    
    // Actualizar con el identificador del QR real
    savedPatient.qrCode = `PATIENT:${savedPatient.id}`;
    const finalPatient = await this.patientRepo.save(savedPatient);
    
    // Devolver con arrays parseados
    return this.parsePatientData(finalPatient);
  }


  async findAll() {
    const patients = await this.patientRepo
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.careTeam', 'careTeamMember', 'careTeamMember.status = :status', { status: 'active' })
      .leftJoinAndSelect('patient.emergencyContacts', 'emergencyContacts')
      .getMany();
    
    // Convertir JSON strings a arrays para el frontend
    return patients.map(patient => this.parsePatientData(patient));
  }

  async findMyCareTeamPatients(userId: string) {
    // Obtener pacientes donde el usuario está en el careTeam activo
    // Usamos dos aliases diferentes: uno para filtrar (myMembership) y otro para cargar todos (allMembers)
    const patients = await this.patientRepo
      .createQueryBuilder('patient')
      .innerJoin('patient.careTeam', 'myMembership', 'myMembership.userId = :userId AND myMembership.status = :status', { userId, status: 'active' })
      .leftJoinAndSelect('patient.careTeam', 'allMembers', 'allMembers.status = :activeStatus', { activeStatus: 'active' })
      .leftJoinAndSelect('patient.emergencyContacts', 'emergencyContacts')
      .leftJoinAndSelect('patient.operations', 'operations')
      .getMany();
    
    return patients.map(patient => this.parsePatientData(patient));
  }

  async findOne(id: string) {
    const patient = await this.patientRepo
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.careTeam', 'careTeamMember', 'careTeamMember.status = :status', { status: 'active' })
      .leftJoinAndSelect('patient.emergencyContacts', 'emergencyContacts')
      .leftJoinAndSelect('patient.operations', 'operations')
      .where('patient.id = :id', { id })
      .getOne();
      
    if (!patient) throw new NotFoundException('Patient not found');
    // Convertir JSON strings a arrays para el frontend
    return this.parsePatientData(patient);
  }

  async findByRut(rut: string) {
    // Normalizar RUT para búsqueda (quitar puntos y convertir a minúsculas)
    const normalizedRut = rut.replace(/\./g, '').toLowerCase();
    
    const patients = await this.patientRepo
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.careTeam', 'careTeamMember', 'careTeamMember.status = :status', { status: 'active' })
      .leftJoinAndSelect('patient.emergencyContacts', 'emergencyContacts')
      .leftJoinAndSelect('patient.operations', 'operations')
      .getMany();
    
    const patient = patients.find(p => {
      const patientRut = p.rut.replace(/\./g, '').toLowerCase();
      return patientRut === normalizedRut;
    });
    
    if (!patient) {
      throw new NotFoundException('No se encontró ningún paciente con ese RUT');
    }
    
    return this.parsePatientData(patient);
  }

  private parsePatientData(patient: Patient): any {
    return {
      ...patient,
      allergies: this.parseJsonString(patient.allergies),
      currentMedications: this.parseJsonString(patient.currentMedications),
      careTeam: patient.careTeam || [], // Asegurar que careTeam siempre sea un array
      emergencyContacts: patient.emergencyContacts || [], // Asegurar array
      operations: patient.operations || [], // Cargar operaciones desde la relación
    };
  }

  private parseJsonString(value: string): string[] {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async update(id: string, data: Partial<Patient>) {
    console.log('🔍 UPDATE - Received data:', JSON.stringify(data, null, 2));
    console.log('🔍 UPDATE - Patient ID:', id);
    
    try {
      // Convertir arrays a JSON strings - SOLO los que vienen en data
      const processedData = { ...data };
      
      if ('allergies' in processedData && Array.isArray(processedData.allergies)) {
        processedData.allergies = processedData.allergies.length > 0 
          ? JSON.stringify(processedData.allergies) as any
          : '[]' as any;
        console.log('🔄 Converted allergies to:', processedData.allergies);
      }
      
      if ('currentMedications' in processedData && Array.isArray(processedData.currentMedications)) {
        processedData.currentMedications = processedData.currentMedications.length > 0
          ? JSON.stringify(processedData.currentMedications) as any
          : '[]' as any;
        console.log('🔄 Converted currentMedications to:', processedData.currentMedications);
      }

      // Manejar actualización de emergencyContacts
      if ('emergencyContacts' in processedData) {
        console.log('🔄 Updating emergency contacts');
        const patient = await this.patientRepo.findOne({
          where: { id },
          relations: ['emergencyContacts'],
        });

        if (patient) {
          // Eliminar contactos existentes
          if (patient.emergencyContacts && patient.emergencyContacts.length > 0) {
            await this.patientRepo.manager.remove(patient.emergencyContacts);
            console.log('🗑️ Deleted old emergency contacts');
          }

          // Crear nuevos contactos
          if (processedData.emergencyContacts && Array.isArray(processedData.emergencyContacts)) {
            patient.emergencyContacts = processedData.emergencyContacts.map((contact: any) => {
              const newContact = this.patientRepo.manager.create(EmergencyContact, {
                name: contact.name,
                relationship: contact.relationship,
                phone: contact.phone,
                patient: patient,
              });
              return newContact;
            });
            await this.patientRepo.save(patient);
            console.log('✅ Created new emergency contacts:', patient.emergencyContacts.length);
          }
        }
      }

      // Manejar actualización de operations (intervenciones quirúrgicas)
      if ('operations' in processedData) {
        console.log('🔄 Updating operations');
        const patient = await this.patientRepo.findOne({
          where: { id },
          relations: ['operations'],
        });

        if (patient) {
          // Eliminar operaciones existentes
          if (patient.operations && patient.operations.length > 0) {
            await this.patientRepo.manager.remove(patient.operations);
            console.log('🗑️ Deleted old operations');
          }

          // Crear nuevas operaciones
          if (processedData.operations && Array.isArray(processedData.operations)) {
            patient.operations = processedData.operations.map((operation: any) => {
              const newOperation = this.patientRepo.manager.create(Operation, {
                date: operation.date,
                procedure: operation.procedure,
                hospital: operation.hospital,
                patient: patient,
              });
              return newOperation;
            });
            await this.patientRepo.save(patient);
            console.log('✅ Created new operations:', patient.operations.length);
          }
        }
      }

      // Manejar actualización de careTeam (equipo de cuidado)
      if ('careTeam' in processedData) {
        console.log('🔄 Updating care team');
        const patient = await this.patientRepo.findOne({
          where: { id },
          relations: ['careTeam'],
        });

        if (patient) {
          // Eliminar miembros del equipo existentes
          if (patient.careTeam && patient.careTeam.length > 0) {
            await this.patientRepo.manager.remove(patient.careTeam);
            console.log('🗑️ Deleted old care team members');
          }

          // Crear nuevos miembros del equipo
          if (processedData.careTeam && Array.isArray(processedData.careTeam)) {
            patient.careTeam = processedData.careTeam.map((member: any) => {
              const newMember = this.patientRepo.manager.create(CareTeamMember, {
                userId: member.userId,
                name: member.name,
                role: member.role,
                assignedAt: member.assignedAt || new Date(),
                status: member.status || 'active',
                patient: patient,
              });
              return newMember;
            });
            await this.patientRepo.save(patient);
            console.log('✅ Created new care team members:', patient.careTeam.length);
          }
        }
      }
      
      // Filtrar campos que no deben actualizarse directamente
      const fieldsToUpdate = Object.keys(processedData).filter(
        key => key !== 'id' && key !== 'emergencyContacts' && key !== 'operations' && key !== 'careTeam'
      );
      
      if (fieldsToUpdate.length > 0) {
        // Usar TypeORM QueryBuilder para PostgreSQL
        const updateQuery = this.patientRepo
          .createQueryBuilder()
          .update(Patient)
          .set(processedData)
          .where('id = :id', { id });
        
        console.log('🔧 Executing update with TypeORM QueryBuilder');
        await updateQuery.execute();
        console.log('✅ Update successful');
      }
      
      // Cargar el paciente actualizado para retornarlo
      const result = await this.findOne(id);
      console.log('✅ Patient reloaded');
      
      return result;
    } catch (error) {
      console.error('❌ Error in update:', error);
      throw error;
    }
  }

  async remove(id: string) {
    const patient = await this.findOne(id);
    return await this.patientRepo.remove(patient);
  }

  async generateQRCode(id: string): Promise<string> {
    const patient = await this.findOne(id);
    
    // URL del frontend para los QR codes
    const frontendUrl = process.env.FRONTEND_URL || 'https://lacito.cl';
    
    const emergencyUrl = `${frontendUrl}/emergency/${patient.qrCode}`;
    
    // Generar QR Code con la URL de emergencia
    const qrCodeDataURL = await QRCode.toDataURL(emergencyUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrCodeDataURL;
  }

  async saveScanHistory(patientId: string, patientRut: string) {
    const patient = await this.findOne(patientId);
    return {
      patientId,
      patientRut: patientRut.toUpperCase(),
      patientName: patient.name,
      searchedAt: new Date(),
    };
  }

  async findPatientNotes(patientId: string) {
    // Normalizar patientId a mayúsculas para búsqueda
    const normalizedId = patientId.toUpperCase();
    console.log('🔍 findPatientNotes - Buscando notas para patientId:', normalizedId);
    
    // Buscar todas las notas del paciente ordenadas por fecha
    const notes = await this.notesRepo.find({
      where: { patientId: normalizedId },
      order: { createdAt: 'DESC' },
    });
    
    console.log('✅ findPatientNotes - Notas encontradas:', notes.length);
    return notes;
  }

  async findPatientDocuments(patientId: string) {
    // Normalizar patientId a mayúsculas para búsqueda
    const normalizedId = patientId.toUpperCase();
    console.log('🔍 findPatientDocuments - Buscando documentos para patientId:', normalizedId);
    
    // Buscar todos los documentos del paciente ordenados por fecha
    const documents = await this.documentsRepo.find({
      where: { patientId: normalizedId },
      order: { uploadDate: 'DESC' },
    });
    
    console.log('✅ findPatientDocuments - Documentos encontrados:', documents.length);
    return documents;
  }

  async getPatientName(patientId: string): Promise<string> {
    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
      select: ['name'],
    });
    
    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }
    
    return patient.name;
  }
}
