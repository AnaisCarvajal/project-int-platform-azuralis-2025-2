import { IsEmail, IsEnum, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { UserRole } from '../../shared/enums/user-role.enum';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail({}, { message: 'Debe ingresar un email válido' })
  email: string;

  /**
   * Password must be at least 8 characters and contain:
   * - At least one uppercase letter (A-Z)
   * - At least one lowercase letter (a-z)
   * - At least one digit (0-9)
   */
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])/, { message: 'La contraseña debe contener al menos una letra minúscula' })
  @Matches(/^(?=.*[A-Z])/, { message: 'La contraseña debe contener al menos una letra mayúscula' })
  @Matches(/^(?=.*\d)/, { message: 'La contraseña debe contener al menos un número' })
  password: string;

  @IsString()
  @Matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, { message: 'El RUT debe tener el formato 12.345.678-9' })
  rut: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser uno de: patient, doctor, nurse o guardian' })
  role?: UserRole;
}
