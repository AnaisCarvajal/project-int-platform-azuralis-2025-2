import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // No devolver la contraseña
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // No permitir actualizar password directamente (debería haber un endpoint específico)
    delete updateData.password;
    delete updateData.email; // El email tampoco debería cambiarse así
    delete updateData.rut; // El RUT tampoco

    Object.assign(user, updateData);
    const updated = await this.userRepo.save(user);
    
    // No devolver la contraseña
    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword as User;
  }

  async addSearchHistory(userId: string, patientId: string, patientRut: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Parse existing search history
    let searchHistory: any[] = [];
    try {
      searchHistory = user.scanHistory ? JSON.parse(user.scanHistory) : [];
    } catch {
      searchHistory = [];
    }

    // Buscar si el paciente ya existe en el historial
    const existingIndex = searchHistory.findIndex(record => record.patientId === patientId);

    if (existingIndex !== -1) {
      // Si ya existe, SOLO actualizar la fecha y moverlo al principio
      searchHistory[existingIndex].searchedAt = new Date().toISOString();
      // Mover al principio (registro más reciente)
      const updatedRecord = searchHistory.splice(existingIndex, 1)[0];
      searchHistory.unshift(updatedRecord);
    } else {
      // Si NO existe, agregar nuevo registro al principio
      const newRecord = {
        patientId,
        patientRut,
        searchedAt: new Date().toISOString(),
      };
      searchHistory.unshift(newRecord);
    }

    // Limitar a últimos 50 registros ÚNICOS
    searchHistory = searchHistory.slice(0, 50);

    // Guardar de vuelta
    user.scanHistory = JSON.stringify(searchHistory);
    const updated = await this.userRepo.save(user);

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword as User;
  }

  //VEAMOS SI SIRVE
  async search(query: string) {
    if (!query || !query.trim()) {
      return [];
    }

    const cleaned = query.trim().toLowerCase();
    const rutNormalized = cleaned.replace(/[.\-]/g, '');

    return this.userRepo
      .createQueryBuilder("user")
      .where(
        `
        replace(replace(user.rut, '.', ''), '-', '') ILIKE :rut
        OR user.email ILIKE :email
        OR user.name ILIKE :name
        `,
        {
          rut: `%${rutNormalized}%`,
          email: `%${cleaned}%`,
          name: `%${cleaned}%`,
        }
      )
      .select(["user.id", "user.name", "user.rut", "user.email", "user.role"])
      .limit(10)
      .getMany();
  }

}
