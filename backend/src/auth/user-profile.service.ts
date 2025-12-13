import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfilePicture } from './entities/user-profile-picture.entity';
import { R2StorageService } from '../shared/r2-storage.service';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(UserProfilePicture)
    private userProfilePictureRepository: Repository<UserProfilePicture>,
    private r2StorageService: R2StorageService,
  ) {}

  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    console.log('📸 uploadProfilePicture called for userId:', userId);
    console.log('📸 File details:', { name: file.originalname, size: file.size, type: file.mimetype });
    
    // Generar nombre único para el archivo
    const fileName = `${Date.now()}-${file.originalname}`;
    const containerName = 'user-profiles';
    const filePath = `profiles/${userId}/${fileName}`;
    
    // Subir archivo a R2
    const url = await this.r2StorageService.uploadFile(
      containerName,
      filePath,
      file.buffer,
      file.mimetype,
    );
    console.log('✅ File uploaded to R2, URL:', url);

    // Eliminar foto anterior si existe
    const existing = await this.userProfilePictureRepository.findOne({ where: { userId } });
    if (existing) {
      console.log('🔍 Found existing profile picture:', existing.url);
      try {
        // Extraer el path del archivo antiguo desde la URL
        const oldUrl = existing.url;
        // La URL es: https://accountId.r2.cloudflarestorage.com/bucket/user-profiles/profiles/userId/file.jpg
        // Necesitamos extraer: profiles/userId/file.jpg
        const urlParts = oldUrl.split('/');
        const containerIndex = urlParts.indexOf('user-profiles');
        if (containerIndex !== -1 && containerIndex < urlParts.length - 1) {
          const oldFilePath = urlParts.slice(containerIndex + 1).join('/');
          await this.r2StorageService.deleteFile(containerName, oldFilePath);
          console.log('🗑️ Deleted old profile picture:', oldFilePath);
        }
      } catch (error) {
        console.error('⚠️ Error deleting old profile picture (continuing):', error);
      }
      
      // Eliminar registro de BD
      await this.userProfilePictureRepository.remove(existing);
      console.log('🗑️ Removed old database record');
    }

    // Crear nueva entrada
    const profile = this.userProfilePictureRepository.create({ 
      userId, 
      url, 
      uploadDate: new Date() 
    });
    const savedProfile = await this.userProfilePictureRepository.save(profile);
    console.log('💾 Saved new profile to database:', savedProfile);

    // Generar URL firmada para devolver al frontend (válida por 24 horas)
    const signedUrl = await this.r2StorageService.generateSignedUrl(url, 60 * 24);
    console.log('🔗 Generated signed URL for response');
    
    const result = { ...savedProfile, url: signedUrl };
    console.log('📤 Returning result:', result);
    return result;
  }

  async getProfilePicture(userId: string) {
    try {
      console.log('🔍 getProfilePicture called for userId:', userId);
      const profile = await this.userProfilePictureRepository.findOne({ where: { userId } });
      
      if (!profile) {
        console.log('⚠️ No profile picture found for user:', userId);
        return null;
      }

      console.log('✅ Found profile in database:', profile);

      // Generar URL firmada válida por 24 horas
      const signedUrl = await this.r2StorageService.generateSignedUrl(profile.url, 60 * 24);
      const result = { ...profile, url: signedUrl };
      console.log('📤 Returning profile with signed URL');
      return result;
    } catch (error) {
      console.error('❌ Error in getProfilePicture service:', error);
      throw error;
    }
  }

  async deleteProfilePicture(userId: string) {
    const profile = await this.userProfilePictureRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile picture not found');

    try {
      // Extraer el path del archivo desde la URL
      const containerName = 'user-profiles';
      const url = profile.url;
      const urlParts = url.split('/');
      const containerIndex = urlParts.indexOf('user-profiles');
      
      if (containerIndex !== -1 && containerIndex < urlParts.length - 1) {
        const filePath = urlParts.slice(containerIndex + 1).join('/');
        await this.r2StorageService.deleteFile(containerName, filePath);
        console.log('🗑️ Deleted profile picture from R2:', filePath);
      }
    } catch (error) {
      console.error('⚠️ Error deleting file from R2:', error);
      // Continuar para eliminar el registro de BD aunque falle la eliminación del archivo
    }

    await this.userProfilePictureRepository.remove(profile);
    return { message: 'Profile picture deleted' };
  }
}