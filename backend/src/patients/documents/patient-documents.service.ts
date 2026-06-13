import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientDocument } from '../entities/patient-document.entity';
import { R2StorageService } from '../../shared/r2-storage.service';
import { PresignedUrlService } from './presigned-url.service';

@Injectable()
export class PatientDocumentsService {
  private readonly logger = new Logger(PatientDocumentsService.name);

  constructor(
    @InjectRepository(PatientDocument)
    private docsRepo: Repository<PatientDocument>,
    private r2StorageService: R2StorageService,
    private presignedUrlService: PresignedUrlService,
  ) {}

  async create(docData: Partial<PatientDocument>, file: Express.Multer.File) {
    // Normalizar patientId a mayúsculas si existe
    if (docData.patientId) {
      docData.patientId = docData.patientId.toUpperCase();
    }
    
    // Asegurar que uploadDate tenga un valor
    if (!docData.uploadDate) {
      docData.uploadDate = new Date().toISOString();
    }

    // Generar nombre único para el archivo en R2
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const containerName = 'patient-documents';

    try {
      // Subir archivo a Cloudflare R2
      this.logger.log(`Intentando subir archivo a R2: ${uniqueFileName}`);
      const r2Url = await this.r2StorageService.uploadFile(
        containerName,
        `${docData.patientId}/${uniqueFileName}`,
        file.buffer,
        file.mimetype,
      );
      this.logger.log(`Archivo subido a R2: ${r2Url}`);
      
      // Guardar la URL de R2 en la base de datos
      docData.url = r2Url;
      
      this.logger.log(`Creating document with patientId: ${docData.patientId}`);
      const doc = this.docsRepo.create(docData);
      const saved = await this.docsRepo.save(doc);
      this.logger.log(`Document created: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Error al crear documento: ${error.message}`, error.stack);
      throw new Error(`Error al subir el documento: ${error.message}`);
    }
  }

  async findAll() {
    return this.docsRepo.find();
  }

  async findOne(id: string) {
    return this.docsRepo.findOne({ where: { id } });
  }

  async update(id: string, docData: Partial<PatientDocument>) {
    const doc = await this.docsRepo.findOne({ where: { id } });
    if (!doc) {
      throw new Error('Documento no encontrado');
    }
    
    // Actualizar solo los campos proporcionados
    Object.assign(doc, docData);
    return this.docsRepo.save(doc);
  }

  async delete(id: string) {
    this.logger.log(`Iniciando eliminación de documento: ${id}`);
    
    const doc = await this.docsRepo.findOne({ where: { id } });
    if (!doc) {
      this.logger.log(`Documento no encontrado en Supabase: ${id}`);
      return { message: 'Documento no encontrado' };
    }
    
    this.logger.log(`Documento encontrado en Supabase: ${JSON.stringify({ id: doc.id, url: doc.url })}`);
    
    // PRIMERO: Eliminar archivo de R2 Storage
    if (doc.url) {
      try {
        const containerName = 'patient-documents';
        const url = doc.url;
        this.logger.log(`URL original: ${url}`);
        
        // La URL tiene formato: https://accountId.r2.cloudflarestorage.com/bucket/patient-documents/PATIENT_ID/filename.ext
        // Necesitamos extraer: PATIENT_ID/filename.ext (lo que viene después de patient-documents/)
        
        // Usar split para obtener la parte después de "patient-documents/"
        const parts = url.split('patient-documents/');
        if (parts.length > 1) {
          // Tomar la última parte (en caso de que haya múltiples ocurrencias)
          const filePath = parts[parts.length - 1];
          
          this.logger.log(`Path extraído para R2: ${filePath}`);
          this.logger.log(`Key final será: ${containerName}/${filePath}`);
          
          await this.r2StorageService.deleteFile(containerName, filePath);
          this.logger.log(`Archivo eliminado de R2 exitosamente`);
        } else {
          this.logger.error(`No se pudo extraer el path de la URL: ${url}`);
        }
      } catch (error) {
        this.logger.error(`Error al eliminar archivo de R2: ${error.message}`, error.stack);
      }
    }
    
    // SEGUNDO: Eliminar registro de Supabase
    await this.docsRepo.remove(doc);
    this.logger.log(`Registro eliminado de Supabase exitosamente`);
    
    return { message: 'Documento eliminado correctamente de R2 y Supabase' };
  }

  /**
   * Genera una URL temporal firmada para descargar/ver un documento
   * @param id - ID del documento en la base de datos
   * @returns Objeto con la URL temporal (válida por 1 hora)
   */
  async generateDownloadUrl(id: string) {
    this.logger.log(`Generando URL de descarga para documento: ${id}`);
    
    const doc = await this.docsRepo.findOne({ where: { id } });
    if (!doc) {
      throw new Error('Documento no encontrado');
    }

    this.logger.log(`Documento encontrado: ${JSON.stringify({ id: doc.id, title: doc.title, url: doc.url })}`);

    if (!doc.url) {
      throw new Error('El documento no tiene una URL asociada');
    }

    try {
      // Generar URL firmada (válida por 60 minutos)
      const signedUrl = await this.r2StorageService.generateSignedUrl(doc.url, 60);
      
      this.logger.log(`URL firmada generada exitosamente`);
      
      return {
        id: doc.id,
        fileName: doc.title || 'documento',
        url: signedUrl,
        expiresIn: 60, // minutos
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      this.logger.error(`Error al generar URL de descarga: ${error.message}`, error.stack);
      throw new Error(`Error al generar URL de descarga: ${error.message}`);
    }
  }

  /**
   * Genera una presigned URL para subir archivos a R2
   * @param userId - ID del usuario autenticado
   * @param filename - Nombre original del archivo
   * @param fileSize - Tamaño del archivo en bytes
   * @param contentType - Tipo de contenido (MIME type)
   * @returns Presigned URL y información relacionada
   */
  async generatePresignedUrl(
    userId: string,
    filename: string,
    fileSize: number,
    contentType: string,
  ) {
    return this.presignedUrlService.generatePresignedUrl(
      userId,
      filename,
      fileSize,
      contentType,
    );
  }

  /**
   * Confirma un upload completado y actualiza la cuota del usuario
   * @param userId - ID del usuario
   * @param key - Clave del objeto en R2
   * @param fileSize - Tamaño del archivo en bytes
   */
  async confirmUpload(userId: string, key: string, fileSize: number) {
    try {
      // Ejecutar función SQL increment_storage
      const result = await this.docsRepo.manager.query(
        `SELECT increment_storage($1, $2) as success`,
        [userId, fileSize],
      );

      if (!result[0].success) {
        throw new Error('No se pudo incrementar la cuota de almacenamiento');
      }

      this.logger.log(`Upload confirmado para usuario ${userId}, tamaño: ${fileSize} bytes`);

      return {
        message: 'Upload confirmado exitosamente',
        userId,
        fileSize,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error confirmando upload: ${error.message}`, error.stack);
      throw new Error(`Error confirmando upload: ${error.message}`);
    }
  }
}
