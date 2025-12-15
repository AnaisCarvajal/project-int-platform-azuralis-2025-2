import { Controller, Post, Get, Param, Body, Delete, Put } from '@nestjs/common';
import { CareTeamService } from './care-team.service';
import { CareTeamMember } from '../entities/care-team-member.entity';

@Controller('care-team')
export class CareTeamController {
  constructor(private readonly careTeamService: CareTeamService) {}

  // Crear un miembro del equipo médico
  @Post()
  async addMember(@Body() data: Partial<CareTeamMember>) {
    return this.careTeamService.addMember(data);
  }

  // Obtener todos los miembros
  @Get()
  async findAll() {
    return this.careTeamService.findAll();
  }

  // Obtener miembros de un paciente específico
  @Get('by-patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    return this.careTeamService.findByPatient(patientId);
  }

  // Actualizar rol o estado de un miembro
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<CareTeamMember>) {
    return this.careTeamService.update(id, data);
  }

  // Eliminar un miembro del equipo
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.careTeamService.remove(id);
  }

  // Agregar un miembro al equipo de un paciente específico
  @Post('patient/:patientId/member')
  async addMemberToPatient(
    @Param('patientId') patientId: string,
    @Body() body: { userId: string; name: string; role: string }
  ) {
    return this.careTeamService.addMemberToPatient(
      patientId, 
      body.userId,
      body.name,
      body.role
    );
  }

  // Remover un miembro del equipo de un paciente específico
  @Delete('patient/:patientId/member/:userId')
  async removeMemberFromPatient(
    @Param('patientId') patientId: string,
    @Param('userId') userId: string
  ) {
    return this.careTeamService.removeMemberFromPatient(patientId, userId);
  }
}
