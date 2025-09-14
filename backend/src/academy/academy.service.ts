import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademyService {
  constructor(private prisma: PrismaService) {}

  async getCourses() {
    return this.prisma.course.findMany({
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async getCourseLessons(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.lesson.findMany({
      where: {
        courseId: courseId,
      },
      orderBy: { order: 'asc' },
    });
  }

  async getLesson(courseId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId: courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async getProgress(userId: string) {
    // Получаем общее количество курсов и уроков
    const totalCourses = await this.prisma.course.count({
      where: { status: 'PUBLISHED' },
    });

    const totalLessons = await this.prisma.lesson.count({
      where: {
        course: {
          status: 'PUBLISHED',
        },
      },
    });

    // Получаем завершенные уроки пользователя
    const completedLessons = await this.prisma.courseCompletion.count({
      where: {
        userId: userId,
        completed: true,
      },
    });

    // Получаем курсы в процессе изучения
    const coursesInProgress = await this.prisma.courseCompletion.findMany({
      where: {
        userId: userId,
        completed: true,
      },
      select: {
        courseId: true,
      },
      distinct: ['courseId'],
    });

    const inProgress = coursesInProgress.length;

    return {
      completed: completedLessons,
      inProgress: inProgress,
      total: totalLessons,
      totalCourses: totalCourses,
      progressPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
  }

  async completeLesson(userId: string, courseId: string, lessonId: string) {
    // Проверяем, что урок существует
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId: courseId,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Проверяем, не завершен ли уже урок
    const existingCompletion = await this.prisma.courseCompletion.findFirst({
      where: {
        userId: userId,
        lessonId: lessonId,
      },
    });

    if (existingCompletion) {
      return {
        message: 'Lesson already completed',
        completion: existingCompletion,
      };
    }

    // Создаем запись о завершении урока
    const completion = await this.prisma.courseCompletion.create({
      data: {
        userId: userId,
        courseId: courseId,
        lessonId: lessonId,
        completed: true,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
    });

    return {
      message: 'Lesson completed successfully',
      completion: completion,
    };
  }
}

