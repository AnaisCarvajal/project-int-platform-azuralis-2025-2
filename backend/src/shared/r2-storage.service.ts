import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly accountId: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME || '';
    this.accountId = process.env.R2_ACCOUNT_ID || '';

    if (!this.bucketName || !this.accountId) {
      throw new Error('R2_BUCKET_NAME and R2_ACCOUNT_ID must be set in environment variables');
    }

    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set in environment variables');
    }

    // Configurar el cliente S3 para Cloudflare R2
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log('R2 Storage Service initialized');
  }

  /**
   * Sube un archivo a Cloudflare R2
   * @param containerName - Nombre del "contenedor" (prefijo en R2)
   * @param blobName - Nombre del archivo (path completo)
   * @param fileBuffer - Buffer del archivo
   * @param contentType - Tipo de contenido (ej: 'image/jpeg')
   * @returns URL del archivo subido
   */
  async uploadFile(
    containerName: string,
    blobName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      // En R2, el "container" es solo un prefijo del key
      const key = `${containerName}/${blobName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      this.logger.log(`✅ Archivo subido a R2: ${key}`);

      // Retornar la URL base (sin firma)
      return `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;
    } catch (error) {
      this.logger.error(`❌ Error subiendo archivo a R2: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Genera una URL firmada para acceder a un archivo
   * @param blobUrl - URL completa del blob o solo el key
   * @param expiresInMinutes - Tiempo de expiración en minutos (por defecto 24 horas)
   * @returns URL firmada
   */
  async generateSignedUrl(blobUrl: string, expiresInMinutes: number = 1440): Promise<string> {
    try {
      // Extraer el key desde la URL completa
      const key = this.extractKeyFromUrl(blobUrl);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      // Generar URL firmada con tiempo de expiración
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInMinutes * 60, // Convertir minutos a segundos
      });

      this.logger.log(`✅ URL firmada generada para: ${key} (expira en ${expiresInMinutes} minutos)`);
      return signedUrl;
    } catch (error) {
      this.logger.error(`❌ Error generando URL firmada: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Genera una URL firmada para uploads (PUT) a R2
   * @param key - Clave del objeto en R2
   * @param contentType - Tipo de contenido del archivo
   * @param expiresInMinutes - Tiempo de expiración en minutos (por defecto 5 minutos)
   * @returns URL firmada para upload
   */
  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInMinutes: number = 5,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      // Generar URL firmada para PUT con tiempo de expiración
      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInMinutes * 60, // Convertir minutos a segundos
      });

      this.logger.log(`✅ Presigned upload URL generada para: ${key} (expira en ${expiresInMinutes} minutos)`);
      return presignedUrl;
    } catch (error) {
      this.logger.error(`❌ Error generando presigned upload URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Elimina un archivo de Cloudflare R2
   * @param containerName - Nombre del contenedor (prefijo)
   * @param blobName - Nombre del archivo
   */
  async deleteFile(containerName: string, blobName: string): Promise<void> {
    try {
      const key = `${containerName}/${blobName}`;

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`✅ Archivo eliminado de R2: ${key}`);
    } catch (error) {
      this.logger.error(`❌ Error eliminando archivo de R2: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Extrae el key (path) desde una URL completa
   * Ejemplo: https://account.r2.cloudflarestorage.com/bucket/container/file.jpg -> container/file.jpg
   */
  private extractKeyFromUrl(url: string): string {
    try {
      // Si no es una URL completa, asumimos que ya es el key
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return url;
      }

      // Parsear la URL
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Remover el primer "/" y el nombre del bucket si está en el path
      // Formato: /bucket-name/container/file.jpg -> container/file.jpg
      const parts = pathname.split('/').filter(Boolean);
      
      // Si el primer elemento es el nombre del bucket, lo removemos
      if (parts[0] === this.bucketName) {
        parts.shift();
      }

      const key = parts.join('/');
      this.logger.debug(`Extracted key from URL: ${url} -> ${key}`);
      return key;
    } catch (error) {
      this.logger.error(`❌ Error extrayendo key de URL: ${url}`, error.stack);
      // Si falla el parseo, intentar retornar la URL original
      return url;
    }
  }

  /**
   * Verifica si un archivo existe en R2
   * @param containerName - Nombre del contenedor
   * @param blobName - Nombre del archivo
   * @returns true si existe, false si no
   */
  async fileExists(containerName: string, blobName: string): Promise<boolean> {
    try {
      const key = `${containerName}/${blobName}`;
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }
}
