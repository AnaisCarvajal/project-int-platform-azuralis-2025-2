import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../shared/enums/user-role.enum';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { MoreThan } from 'typeorm';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(
    name: string,
    email: string,
    password: string,
    rut: string,
    role: UserRole = UserRole.PATIENT,
  ) {
    // Verificar si el email ya existe
    const existingEmail = await this.usersRepo.findOne({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('Este correo ya está registrado. ¿Quieres iniciar sesión?');
    }

    // Verificar si el RUT ya existe
    const existingRut = await this.usersRepo.findOne({ where: { rut } });
    if (existingRut) {
      throw new ConflictException('Este RUT ya está registrado en el sistema.');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepo.create({ name, email, rut, password: hashed, role });
    
    try {
      await this.usersRepo.save(user);
    } catch (error) {
      // Manejo de errores de base de datos como fallback
      if (error.number === 2627 || error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('email')) {
          throw new ConflictException('Este correo ya está registrado.');
        } else if (error.message.includes('rut') || error.message.includes('RUT')) {
          throw new ConflictException('Este RUT ya está registrado.');
        }
        throw new ConflictException('Este usuario ya existe en el sistema.');
      }
      throw error;
    }

    return {
      message: 'Usuario registrado con éxito',
      email: user.email,
      role: user.role,
      id: user.id,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    return { access_token: token, role: user.role };
  }

  async getProfile(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) return null;

    // Parsear campos JSON para enviar al frontend
    const userData: any = { ...user };
    
    // Parsear scanHistory si existe (para doctores/enfermeras) y renombrarlo a searchHistory para el frontend
    if (user.scanHistory) {
      try {
        userData.searchHistory = JSON.parse(user.scanHistory);
      } catch (e) {
        console.error('Error parseando scanHistory:', e);
        userData.searchHistory = [];
      }
    }
    
    delete userData.scanHistory;

    // Parsear assignedPatients si existe
    if (user.assignedPatients) {
      try {
        userData.assignedPatients = JSON.parse(user.assignedPatients);
      } catch (e) {
        console.error('Error parseando assignedPatients:', e);
        userData.assignedPatients = [];
      }
    }

    // Parsear patientIds si existe (para guardianes)
    if (user.patientIds) {
      try {
        userData.patientIds = JSON.parse(user.patientIds);
      } catch (e) {
        console.error('Error parseando patientIds:', e);
        userData.patientIds = [];
      }
    }

    // No devolver el password al frontend
    delete userData.password;

    return userData;
  }


  async requestPasswordReset(email: string) {
  console.log('🔔 Forgot password solicitado para:', email);

  const user = await this.usersRepo.findOne({ where: { email } });

  if (!user) {
    console.log('⚠️ Usuario NO existe, no se envía correo');
    return;
  }

  console.log('✅ Usuario encontrado, enviando correo…');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(
      Date.now() + Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES) * 60_000,
    );

    await this.usersRepo.save(user);

    const link = `${process.env.APP_URL}/reset-password?token=${rawToken}`;
    console.log('📧 Reset link:', link);

    await this.mailService.sendPasswordReset(user.email, link);
  }

  async resetPassword(token: string, newPassword: string) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await this.usersRepo.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: MoreThan(new Date()),
    },
  });

  if (!user) {
    throw new UnauthorizedException('Token inválido o expirado');
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await this.usersRepo.save(user);
}


}
