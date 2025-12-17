import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PatientNote } from '../../patients/entities/patient-note.entity';
import { PatientDocument } from '../../patients/entities/patient-document.entity';
import { UserRole } from '../../shared/enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  rut: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: UserRole.PATIENT,
  })
  role: UserRole;

  // ---- CAMPOS ESPECÍFICOS POR ROL ----

  // 🧑‍⚕️ DOCTOR/NURSE
  @Column({ nullable: true })
  specialization?: string; // doctor

  @Column({ nullable: true })
  department?: string; // nurse

  @Column({ nullable: true })
  license?: string; // ambos

  @Column('text', { nullable: true })
  assignedPatients?: string; // JSON string de IDs de pacientes asignados

  // 🧑‍🤝‍🧑 GUARDIAN
  @Column('text', { nullable: true })
  patientIds?: string; // JSON string de IDs de pacientes a cargo

  // 👨‍⚕️ STAFF CLÍNICO (doctor/nurse)
  @Column('text', { nullable: true })
  scanHistory?: string; // JSON string de { patientId: string; patientRut: string; searchedAt: Date }[]

  // 🧑 PACIENTE
  @Column({ nullable: true })
  patientId?: string; // vínculo directo con tabla patients

  @Column({nullable: true})
  photo?: string;

    @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true })
  passwordResetExpires?: Date;



}


/*  @OneToMany(() => PatientNote, (note) => note.author)
  notesAuthored: PatientNote[];

  @OneToMany(() => PatientDocument, (doc) => doc.uploader)
  documentsUploaded: PatientDocument[];
} */
