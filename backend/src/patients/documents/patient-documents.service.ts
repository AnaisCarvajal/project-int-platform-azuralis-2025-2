import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientDocument } from '../entities/patient-document.entity';
import { R2StorageService } from '../../shared/r2-storage.service';

@Injectable()
export class PatientDocumentsService {
  constructor(
    @InjectRepository(PatientDocument)
    private docsRepo: Repository<PatientDocument>,
    private r2StorageService: R2StorageService,
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
      console.log('📤 Intentando subir archivo a R2:', uniqueFileName);
      const r2Url = await this.r2StorageService.uploadFile(
        containerName,
        `${docData.patientId}/${uniqueFileName}`,
        file.buffer,
        file.mimetype,
      );
      console.log('✅ Archivo subido a R2:', r2Url);
      
      // Guardar la URL de R2 en la base de datos
      docData.url = r2Url;
      
      console.log('📄 Creating document with patientId:', docData.patientId);
      const doc = this.docsRepo.create(docData);
      const saved = await this.docsRepo.save(doc);
      console.log('✅ Document created:', saved.id);
      return saved;
    } catch (error) {
      console.error('❌ Error al crear documento:', error);
      console.error('❌ Detalles del error:', error.message);
      console.error('❌ Stack:', error.stack);
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
    console.log('🗑️ Iniciando eliminación de documento:', id);
    
    const doc = await this.docsRepo.findOne({ where: { id } });
    if (!doc) {
      console.log('⚠️ Documento no encontrado en Supabase:', id);
      return { message: 'Documento no encontrado' };
    }
    
    console.log('📄 Documento encontrado en Supabase:', { id: doc.id, url: doc.url });
    
    // PRIMERO: Eliminar archivo de R2 Storage
    if (doc.url) {
      try {
        const containerName = 'patient-documents';
        const url = doc.url;
        console.log('🔍 URL original:', url);
        
        // La URL tiene formato: https://accountId.r2.cloudflarestorage.com/bucket/patient-documents/PATIENT_ID/filename.ext
        // Necesitamos extraer: PATIENT_ID/filename.ext (lo que viene después de patient-documents/)
        
        // Usar split para obtener la parte después de "patient-documents/"
        const parts = url.split('patient-documents/');
        if (parts.length > 1) {
          // Tomar la última parte (en caso de que haya múltiples ocurrencias)
          const filePath = parts[parts.length - 1];
          
          console.log('🔍 Path extraído para R2:', filePath);
          console.log('🔍 Key final será:', `${containerName}/${filePath}`);
          
          await this.r2StorageService.deleteFile(containerName, filePath);
          console.log('✅ Archivo eliminado de R2 exitosamente');
        } else {
          console.error('⚠️ No se pudo extraer el path de la URL:', url);
        }
      } catch (error) {
        console.error('❌ Error al eliminar archivo de R2:', error.message);
        console.error('❌ Stack:', error.stack);
      }
    }
    
    // SEGUNDO: Eliminar registro de Supabase
    await this.docsRepo.remove(doc);
    console.log('✅ Registro eliminado de Supabase exitosamente');
    
    return { message: 'Documento eliminado correctamente de R2 y Supabase' };
  }

  /**
   * Genera una URL temporal firmada para descargar/ver un documento
   * @param id - ID del documento en la base de datos
   * @returns Objeto con la URL temporal (válida por 1 hora)
   */
  async generateDownloadUrl(id: string) {
    console.log('🔍 Generando URL de descarga para documento:', id);
    
    const doc = await this.docsRepo.findOne({ where: { id } });
    if (!doc) {
      throw new Error('Documento no encontrado');
    }

    console.log('📄 Documento encontrado:', { id: doc.id, title: doc.title, url: doc.url });

    if (!doc.url) {
      throw new Error('El documento no tiene una URL asociada');
    }

    try {
      // Generar URL firmada (válida por 60 minutos)
      const signedUrl = await this.r2StorageService.generateSignedUrl(doc.url, 60);
      
      console.log('✅ URL firmada generada exitosamente');
      
      return {
        id: doc.id,
        fileName: doc.title || 'documento',
        url: signedUrl,
        expiresIn: 60, // minutos
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('❌ Error al generar URL de descarga:', error);
      console.error('❌ Stack:', error.stack);
      throw new Error(`Error al generar URL de descarga: ${error.message}`);
    }
  }
}
