import { Controller, Delete, Get, Logger, Param, Post, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  private readonly logger = new Logger(UploadController.name);
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload single file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @BusinessLogger('Upload File', 'File')
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    this.logger.log(`📤 Uploading file: ${file?.originalname}`);
    return this.uploadService.uploadFile(file);
  }

  @Post('files')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @BusinessLogger('Upload Multiple Files', 'File')
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    this.logger.log(`📤 Uploading ${files?.length || 0} files`);
    return this.uploadService.uploadFiles(files);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload avatar' })
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully' })
  @BusinessLogger('Upload Avatar', 'File')
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    this.logger.log(`👤 Uploading avatar: ${file?.originalname}`);
    return this.uploadService.uploadAvatar(file);
  }

  @Delete('file/:filename')
  @ApiOperation({ summary: 'Delete file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @BusinessLogger('Delete File', 'File')
  deleteFile(@Param('filename') filename: string) {
    this.logger.log(`🗑️ Deleting file: ${filename}`);
    return this.uploadService.deleteFile(filename);
  }

  @Get('file/:filename/info')
  @ApiOperation({ summary: 'Get file information' })
  @ApiResponse({ status: 200, description: 'File information retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ActionLogger('Get File Info', 'UploadController')
  getFileInfo(@Param('filename') filename: string) {
    this.logger.log(`ℹ️ Getting file info: ${filename}`);
    return this.uploadService.getFileInfo(filename);
  }
}
