import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Patient } from './patient.entity';
import { User } from '../../auth/entities/user.entity';
import { DocumentType } from '../../shared/enums/document-type.enum';

@Entity('patient_documents')
export class PatientDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  type: DocumentType;

  @Column()
  url: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isComiteOncologico: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadDate: string;

  @Column()
  patientId: string;

  @Column()
  uploaderId: string;

  // Relaciones (opcional)
  @ManyToOne(() => Patient, (patient) => patient.documents, { onDelete: 'CASCADE' })
  patient: Patient;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  uploader: User;
}