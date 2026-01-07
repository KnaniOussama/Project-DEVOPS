import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { CarService } from './car.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CarStatusDto } from './dto/car-status.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { Car, CarStatus } from './schemas/car.schema'; // Import CarStatus
import { Report } from './schemas/report.schema';
import { ActivityLogService } from './activity-log/activity-log.service';
import { ActivityLog } from './schemas/activity-log.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('cars')
export class CarController {
  constructor(
    private readonly carService: CarService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) createCarDto: CreateCarDto): Promise<Car> {
    return this.carService.create(createCarDto);
  }

  @Public() // Allow public access to this route
  @Get()
  async findAll(): Promise<Car[]> {
    return this.carService.findAll(CarStatus.AVAILABLE); // Filter by AVAILABLE for public view
  }

  @Get('admin')
  async findAllAdmin(): Promise<Car[]> {
    return this.carService.findAll(); 
  }

  @Get('stats')
  async getCarStats(): Promise<any> {
    return await this.carService.getCarStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Car> {
    return this.carService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCarDto: UpdateCarDto,
  ): Promise<Car> {
    return this.carService.update(id, updateCarDto);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body(ValidationPipe) carStatusDto: CarStatusDto,
  ): Promise<Car> {
    return this.carService.updateStatus(id, carStatusDto.status);
  }

  @Put(':id/simulate-location')
  async simulateLocationUpdate(@Param('id') id: string): Promise<Car> {
    return this.carService.simulateLocationUpdate(id);
  }

  @Post(':id/reports')
  @HttpCode(HttpStatus.CREATED)
  async addReport(
    @Param('id') carId: string,
    @Body(ValidationPipe) createReportDto: CreateReportDto,
  ): Promise<Report> {
    return this.carService.addReport(carId, createReportDto);
  }

  @Get(':id/reports')
  async findReportsByCarId(@Param('id') carId: string): Promise<Report[]> {
    return this.carService.findReportsByCarId(carId);
  }

  @Get(':id/activity-logs')
  async findActivityLogsByCarId(@Param('id') carId: string): Promise<ActivityLog[]> {
    return this.activityLogService.findActivityLogsByCarId(carId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<any> {
    return this.carService.remove(id);
  }
}