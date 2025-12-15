import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareTeamMember } from '../entities/care-team-member.entity';

@Injectable()
export class CareTeamService {
  constructor(
    @InjectRepository(CareTeamMember)
    private careTeamRepo: Repository<CareTeamMember>,
  ) {}

  async addMember(data: Partial<CareTeamMember>) {
    const member = this.careTeamRepo.create(data);
    return this.careTeamRepo.save(member);
  }

  async findAll() {
    return this.careTeamRepo.find({ relations: ['patient'] });
  }

  async findByPatient(patientId: string) {
    return this.careTeamRepo.find({
      where: { patient: { id: patientId } },
      relations: ['patient'],
    });
  }

  async update(id: string, data: Partial<CareTeamMember>) {
    const member = await this.careTeamRepo.findOne({ where: { id } });
    if (!member) return { message: 'Miembro no encontrado' };

    Object.assign(member, data);
    return this.careTeamRepo.save(member);
  }

  async remove(id: string) {
    const member = await this.careTeamRepo.findOne({ where: { id } });
    if (!member) return { message: 'Miembro no encontrado' };

    await this.careTeamRepo.remove(member);
    return { message: 'Miembro eliminado correctamente' };
  }

  async addMemberToPatient(patientId: string, userId: string, name: string, role: string) {
    // Verificar si ya existe
    const existing = await this.careTeamRepo.findOne({
      where: { 
        patient: { id: patientId },
        userId,
        status: 'active'
      }
    });

    if (existing) {
      return { message: 'El usuario ya es miembro del equipo' };
    }

    const member = this.careTeamRepo.create({
      userId,
      name,
      role: role as any,
      status: 'active',
      patient: { id: patientId } as any,
    });

    return this.careTeamRepo.save(member);
  }

  async removeMemberFromPatient(patientId: string, userId: string) {
    const member = await this.careTeamRepo.findOne({
      where: { 
        patient: { id: patientId },
        userId,
      }
    });

    if (!member) {
      return { message: 'Miembro no encontrado' };
    }

    // Marcar como inactivo en lugar de eliminar (para mantener historial)
    member.status = 'inactive';
    await this.careTeamRepo.save(member);

    return { message: 'Miembro removido del equipo' };
  }
}
