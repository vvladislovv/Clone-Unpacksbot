import { PrismaClient } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { v4 as uuid } from 'uuid';

interface UploadRequest extends FastifyRequest {
  prisma: PrismaClient;
  user: { userId: string; role: string };
}

export async function uploadRoutes(fastify: FastifyInstance) {
  
  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), 'uploads');
  await mkdir(uploadDir, { recursive: true });

  // Upload single file
  fastify.post('/file', {
    schema: {
      description: 'Upload file',
      tags: ['Upload'],
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            filename: { type: 'string' },
            size: { type: 'number' },
            mimetype: { type: 'string' },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: UploadRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({
          error: 'No file uploaded',
          message: 'Please select a file to upload',
        });
      }

      // Validate file type
      const allowedTypes = (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp').split(',');
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          error: 'Invalid file type',
          message: `Allowed types: ${allowedTypes.join(', ')}`,
        });
      }

      // Validate file size
      const maxSize = parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'); // 10MB
      if (data.file.readableLength && data.file.readableLength > maxSize) {
        return reply.code(400).send({
          error: 'File too large',
          message: `Maximum file size is ${maxSize / 1024 / 1024}MB`,
        });
      }

      // Generate unique filename
      const ext = path.extname(data.filename);
      const filename = `${uuid()}${ext}`;
      const filepath = path.join(uploadDir, filename);

      // Save file
      await pipeline(data.file, createWriteStream(filepath));

      // Get file stats
      const stats = await import('fs/promises').then(fs => fs.stat(filepath));

      const fileUrl = `/uploads/${filename}`;

      reply.send({
        url: fileUrl,
        filename: data.filename,
        size: stats.size,
        mimetype: data.mimetype,
      });

    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Upload failed',
        message: 'An error occurred while uploading file',
      });
    }
  });

  // Upload multiple files
  fastify.post('/files', {
    schema: {
      description: 'Upload multiple files',
      tags: ['Upload'],
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data'],
    },
    preHandler: [fastify.authenticate],
  }, async (request: UploadRequest, reply: FastifyReply) => {
    try {
      const parts = request.files();
      const uploadedFiles = [];

      for await (const part of parts) {
        if (!part.file) continue;

        // Validate file type
        const allowedTypes = (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp').split(',');
        if (!allowedTypes.includes(part.mimetype)) {
          continue; // Skip invalid files
        }

        // Generate unique filename
        const ext = path.extname(part.filename);
        const filename = `${uuid()}${ext}`;
        const filepath = path.join(uploadDir, filename);

        // Save file
        await pipeline(part.file, createWriteStream(filepath));

        // Get file stats
        const stats = await import('fs/promises').then(fs => fs.stat(filepath));

        uploadedFiles.push({
          url: `/uploads/${filename}`,
          filename: part.filename,
          size: stats.size,
          mimetype: part.mimetype,
        });
      }

      reply.send({
        files: uploadedFiles,
        count: uploadedFiles.length,
      });

    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Upload failed',
        message: 'An error occurred while uploading files',
      });
    }
  });

  // Upload avatar
  fastify.post('/avatar', {
    schema: {
      description: 'Upload user avatar',
      tags: ['Upload'],
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data'],
    },
    preHandler: [fastify.authenticate],
  }, async (request: UploadRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({
          error: 'No file uploaded',
          message: 'Please select an avatar image',
        });
      }

      // Validate file type (only images)
      if (!data.mimetype.startsWith('image/')) {
        return reply.code(400).send({
          error: 'Invalid file type',
          message: 'Avatar must be an image file',
        });
      }

      // Validate file size (smaller limit for avatars)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (data.file.readableLength && data.file.readableLength > maxSize) {
        return reply.code(400).send({
          error: 'File too large',
          message: 'Avatar size must be less than 2MB',
        });
      }

      // Generate unique filename
      const ext = path.extname(data.filename);
      const filename = `avatar_${request.user.userId}_${uuid()}${ext}`;
      const filepath = path.join(uploadDir, filename);

      // Save file
      await pipeline(data.file, createWriteStream(filepath));

      const avatarUrl = `/uploads/${filename}`;

      // Update user avatar in database
      await request.prisma.user.update({
        where: { id: request.user.userId },
        data: { avatar: avatarUrl },
      });

      reply.send({
        url: avatarUrl,
        message: 'Avatar updated successfully',
      });

    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Avatar upload failed',
        message: 'An error occurred while uploading avatar',
      });
    }
  });

  // Delete uploaded file
  fastify.delete('/file/:filename', {
    schema: {
      description: 'Delete uploaded file',
      tags: ['Upload'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
        },
        required: ['filename'],
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: UploadRequest, reply: FastifyReply) => {
    const { filename } = request.params as { filename: string };

    try {
      // Security check: only allow deletion of files uploaded by current user or admin
      if (!filename.includes(request.user.userId) && request.user.role !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only delete your own files',
        });
      }

      const filepath = path.join(uploadDir, filename);

      // Check if file exists
      try {
        await import('fs/promises').then(fs => fs.access(filepath));
      } catch {
        return reply.code(404).send({
          error: 'File not found',
          message: 'File does not exist',
        });
      }

      // Delete file
      await import('fs/promises').then(fs => fs.unlink(filepath));

      reply.send({
        success: true,
        message: 'File deleted successfully',
      });

    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Delete failed',
        message: 'An error occurred while deleting file',
      });
    }
  });

  // Get file info
  fastify.get('/file/:filename/info', {
    schema: {
      description: 'Get file information',
      tags: ['Upload'],
      params: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
        },
        required: ['filename'],
      },
    },
  }, async (request: UploadRequest, reply: FastifyReply) => {
    const { filename } = request.params as { filename: string };

    try {
      const filepath = path.join(uploadDir, filename);

      // Check if file exists and get stats
      const stats = await import('fs/promises').then(fs => fs.stat(filepath));

      // Get file extension and mime type
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      reply.send({
        filename,
        size: stats.size,
        mimetype: mimeTypes[ext] || 'application/octet-stream',
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/uploads/${filename}`,
      });

    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        reply.code(404).send({
          error: 'File not found',
          message: 'File does not exist',
        });
      } else {
        request.log.error(error);
        reply.code(500).send({
          error: 'Failed to get file info',
          message: 'An error occurred while getting file information',
        });
      }
    }
  });
}
