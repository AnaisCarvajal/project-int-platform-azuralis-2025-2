import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Delete, 
  Put, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientDocumentsService } from './patient-documents.service';
import { PatientDocument } from '../entities/patient-document.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('patient-documents')
export class PatientDocumentsController {
  constructor(private readonly docsService: PatientDocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() docData: Partial<PatientDocument>,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado un archivo');
    }
    return this.docsService.create(docData, file);
  }

  @Get()
  async findAll() {
    return this.docsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.docsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() docData: Partial<PatientDocument>) {
    return this.docsService.update(id, docData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.docsService.delete(id);
  }

  @Get(':id/download-url')
  async getDownloadUrl(@Param('id') id: string) {
    return this.docsService.generateDownloadUrl(id);
  }

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  @Throttle('uploads', { limit: 20, ttl: 3600 })
  async generatePresignedUrl(
    @Request() req: any,
    @Body() body: { filename: string; fileSize: number; contentType: string },
  ) {
    const userId = req.user.id;
    const { filename, fileSize, contentType } = body;

    if (!filename || !fileSize || !contentType) {
      throw new BadRequestException('filename, fileSize y contentType son requeridos');
    }

    return this.docsService.generatePresignedUrl(
      userId,
      filename,
      fileSize,
      contentType,
    );
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmUpload(
    @Request() req: any,
    @Body() body: { key: string; fileSize: number },
  ) {
    const userId = req.user.id;
    const { key, fileSize } = body;

    if (!key || !fileSize) {
      throw new BadRequestException('key y fileSize son requeridos');
    }

    return this.docsService.confirmUpload(userId, key, fileSize);
  }
}
