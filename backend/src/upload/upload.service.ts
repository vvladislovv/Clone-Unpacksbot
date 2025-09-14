import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly uploadPath = 'uploads';

  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file provided');
    }

    const fileInfo = {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date(),
    };

    return fileInfo;
  }

  async uploadFiles(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date(),
    }));

    return {
      files: uploadedFiles,
      count: uploadedFiles.length,
    };
  }

  async uploadAvatar(file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Проверяем, что это изображение
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Only image files are allowed for avatars');
    }

    const fileInfo = {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      url: `/uploads/avatars/${file.filename}`,
      uploadedAt: new Date(),
    };

    return fileInfo;
  }

  async deleteFile(filename: string) {
    try {
      const filePath = join(this.uploadPath, filename);
      await fs.unlink(filePath);
      
      return {
        message: 'File deleted successfully',
        filename: filename,
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('File not found');
      }
      throw error;
    }
  }

  async getFileInfo(filename: string) {
    try {
      const filePath = join(this.uploadPath, filename);
      const stats = await fs.stat(filePath);
      
      return {
        filename: filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/uploads/${filename}`,
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException('File not found');
      }
      throw error;
    }
  }
}
