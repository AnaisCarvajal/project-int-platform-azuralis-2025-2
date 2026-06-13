import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { R2StorageService } from '../../shared/r2-storage.service';
import { User } from '../../auth/entities/user.entity';

@Injectable()
export class PresignedUrlService {
  private readonly logger = new Logger(PresignedUrlService.name);
  private readonly ALLOWED_CONTENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/dicom',
  ];
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_STORAGE_PER_USER = 500 * 1024 * 1024; // 500MB

  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private r2StorageService: R2StorageService,
  ) {}

  /**
   * Genera una presigned URL para subir archivos a R2
   * @param userId - ID del usuario autenticado
   * @param filename - Nombre original del archivo
   * @param fileSize - Tamaño del archivo en bytes
   * @param contentType - Tipo de contenido (MIME type)
   * @returns Presigned URL válida por 5 minutos
   */
  async generatePresignedUrl(
    userId: string,
    filename: string,
    fileSize: number,
    contentType: string,
  ): Promise<{ presignedUrl: string; key: string; expiresIn: number }> {
    // Validar contenido type
    if (!this.ALLOWED_CONTENT_TYPES.includes(contentType)) {
      throw new BadRequestException(
        `Content type no permitido. Permitidos: ${this.ALLOWED_CONTENT_TYPES.join(', ')}`,
      );
    }

    // Validar tamaño de archivo
    if (fileSize > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Archivo demasiado grande. Máximo: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Verificar que el usuario exista y esté verificado
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (!user.emailVerified) {
      throw new ConflictException(
        'Debes verificar tu email antes de subir archivos',
      );
    }

    // Verificar cuota del usuario
    await this.verifyUserQuota(userId, fileSize);

    // Sanitizar filename
    const sanitizedFilename = this.sanitizeFilename(filename);
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${this.getFileExtension(sanitizedFilename)}`;
    const containerName = 'patient-documents';
    const key = `${containerName}/${userId}/${uniqueFileName}`;

    try {
      // Generar presigned URL usando el método de R2StorageService
      const presignedUrl = await this.r2StorageService.generatePresignedUploadUrl(
        key,
        contentType,
        5, // 5 minutos de expiración
      );

      this.logger.log(`Presigned URL generada para usuario ${userId}`);

      return {
        presignedUrl,
        key,
        expiresIn: 300, // 5 minutos en segundos
      };
    } catch (error) {
      this.logger.error(
        `Error generando presigned URL: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Error generando presigned URL');
    }
  }

  /**
   * Verifica la cuota de almacenamiento del usuario
   * @param userId - ID del usuario
   * @param requestedSize - Tamaño que se solicita subir
   */
  private async verifyUserQuota(
    userId: string,
    requestedSize: number,
  ): Promise<void> {
    try {
      // Esta consulta asume que existe tabla user_storage_quota en Supabase
      // Se ejecutará como raw query a través del DataSource
      const user = await this.usersRepo.manager
        .query(
          `SELECT COALESCE(used_storage, 0) as used_storage 
         FROM user_storage_quota 
         WHERE user_id = $1`,
          [userId],
        )
        .then((result) => (result.length > 0 ? result[0] : null));

      const usedStorage = user?.used_storage || 0;
      const remainingStorage = this.MAX_STORAGE_PER_USER - usedStorage;

      if (requestedSize > remainingStorage) {
        const remainingMB = remainingStorage / (1024 * 1024);
        throw new ConflictException(
          `Cuota de almacenamiento insuficiente. Disponible: ${remainingMB.toFixed(2)}MB`,
        );
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Error verificando cuota: ${error.message}`,
        error.stack,
      );
      // Si falla la verificación de cuota, rechazar por seguridad
      throw new BadRequestException('Error verificando cuota de usuario');
    }
  }

  /**
   * Sanitiza el nombre de archivo removiendo caracteres especiales
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  /**
   * Extrae la extensión de archivo
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'bin';
  }
}
