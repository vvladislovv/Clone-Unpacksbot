import { Controller, Get, Logger, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { AcademyService } from './academy.service';

@ApiTags('Academy')
@Controller('academy')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AcademyController {
  private readonly logger = new Logger(AcademyController.name);
  constructor(private readonly academyService: AcademyService) {}

  @Get('courses')
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get All Courses', 'AcademyController')
  async getCourses() {
    this.logger.log(`🎓 Getting all courses`);
    return this.academyService.getCourses();
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Get course by id' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Course Details', 'AcademyController')
  async getCourse(@Param('id') courseId: string) {
    this.logger.log(`🎓 Getting course details: ${courseId}`);
    return this.academyService.getCourse(courseId);
  }

  @Get('courses/:id/lessons')
  @ApiOperation({ summary: 'Get course lessons' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Course Lessons', 'AcademyController')
  async getCourseLessons(@Param('id') courseId: string) {
    this.logger.log(`📚 Getting lessons for course: ${courseId}`);
    return this.academyService.getCourseLessons(courseId);
  }

  @Get('courses/:id/lessons/:lessonId')
  @ApiOperation({ summary: 'Get lesson by id' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Lesson Details', 'AcademyController')
  async getLesson(@Param('id') courseId: string, @Param('lessonId') lessonId: string) {
    this.logger.log(`📖 Getting lesson: ${lessonId} from course: ${courseId}`);
    return this.academyService.getLesson(courseId, lessonId);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get user progress' })
  @ApiResponse({ status: 200, description: 'Progress retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get User Progress', 'AcademyController')
  async getProgress(@Request() req) {
    this.logger.log(`📊 Getting progress for user: ${req.user.id}`);
    return this.academyService.getProgress(req.user.id);
  }

  @Post('courses/:id/lessons/:lessonId/complete')
  @ApiOperation({ summary: 'Complete lesson' })
  @ApiResponse({ status: 200, description: 'Lesson completed successfully' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Complete Lesson', 'Lesson')
  async completeLesson(@Request() req, @Param('id') courseId: string, @Param('lessonId') lessonId: string) {
    this.logger.log(`✅ Completing lesson: ${lessonId} from course: ${courseId} by user: ${req.user.userId}`);
    return this.academyService.completeLesson(req.user.id, courseId, lessonId);
  }
}
