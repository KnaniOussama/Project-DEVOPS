import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Car, CarDocument, CarStatus } from './schemas/car.schema';
import { Report, ReportDocument } from './schemas/report.schema';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { ActivityLogService } from './activity-log/activity-log.service';
import { ActivityType } from './schemas/activity-log.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CarService {
  constructor(
    @InjectModel(Car.name) private carModel: Model<CarDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async create(createCarDto: CreateCarDto): Promise<Car> {
    const createdCar = new this.carModel(createCarDto);
    const car = await createdCar.save();
    await this.activityLogService.logActivity(
      car._id.toString(),
      ActivityType.CAR_CREATED,
      `New car "${car.brand} ${car.model}" created.`,
    );
    return car;
  }

  async findAll(status?: CarStatus): Promise<Car[]> {
    const filter: { status?: CarStatus } = {};
    if (status) {
      filter.status = status;
    }
    return this.carModel.find(filter).exec();
  }
  async findOne(id: string): Promise<Car> {
    const car = await this.carModel.findById(id).exec();
    if (!car) {
      throw new NotFoundException(`Car with ID "${id}" not found`);
    }
    return car;
  }

  async update(id: string, updateCarDto: UpdateCarDto): Promise<Car> {
    const car = await this.carModel.findById(id).exec();
    if (!car) {
      throw new NotFoundException(`Car with ID "${id}" not found`);
    }

    //const oldTotalKilometers = car.totalKilometers;

    if (
      updateCarDto.totalKilometers !== undefined &&
      updateCarDto.totalKilometers > car.totalKilometers
    ) {
      const kilometersDriven =
        updateCarDto.totalKilometers - car.totalKilometers;
      car.kilometersSinceLastMaintenance += kilometersDriven;
      car.totalKilometers = updateCarDto.totalKilometers; // Update total kilometers
    }

    // Apply other updates from DTO
    Object.assign(car, updateCarDto);

    const updatedCar = await car.save();
    await this.activityLogService.logActivity(
      id,
      ActivityType.CAR_UPDATED,
      `Car "${updatedCar.brand} ${updatedCar.model}" updated.`,
    );
    return updatedCar;
  }

  async remove(id: string): Promise<any> {
    const car = await this.carModel.findById(id).exec();
    if (!car) {
      throw new NotFoundException(`Car with ID "${id}" not found`);
    }
    const result = await this.carModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Car with ID "${id}" not found`);
    }
    await this.activityLogService.logActivity(
      id,
      ActivityType.CAR_DELETED,
      `Car "${car.brand} ${car.model}" deleted.`,
    );
    return { message: `Car with ID "${id}" successfully deleted` };
  }

  async updateStatus(id: string, status: CarStatus): Promise<Car> {
    const car = await this.carModel.findById(id).exec();
    if (!car) {
      throw new NotFoundException(`Car with ID "${id}" not found`);
    }

    const oldStatus = car.status;
    car.status = status;

    if (status === CarStatus.AVAILABLE) {
      car.kilometersSinceLastMaintenance = 0;
      car.lastMaintenanceDate = new Date();
      if (oldStatus === CarStatus.MAINTENANCE) {
        await this.activityLogService.logActivity(
          id,
          ActivityType.MAINTENANCE_COMPLETED,
          `Car "${car.brand} ${car.model}" maintenance completed and set to AVAILABLE.`,
        );
      }
    }
    await this.activityLogService.logActivity(
      id,
      ActivityType.STATUS_CHANGED,
      `Car "${car.brand} ${car.model}" status changed from ${oldStatus} to ${status}.`,
    );
    return car.save();
  }

  async simulateLocationUpdate(id: string): Promise<Car> {
    const car = await this.carModel.findById(id).exec();
    if (!car) {
      throw new NotFoundException(`Car with ID "${id}" not found`);
    }

    if (car.status !== CarStatus.RESERVED) {
      throw new BadRequestException(
        `Car with ID "${id}" is not reserved. Location tracking is only available for reserved cars.`,
      );
    }

    // Simulate random location change
    const randomLatitude = parseFloat(
      (Math.random() * (90 - -90) + -90).toFixed(6),
    );
    const randomLongitude = parseFloat(
      (Math.random() * (180 - -180) + -180).toFixed(6),
    );

    car.currentLocation = {
      latitude: randomLatitude,
      longitude: randomLongitude,
    };

    const updatedCar = await car.save();
    // No logging for location updates unless specifically required, as it can be frequent.
    return updatedCar;
  }

  async addReport(
    carId: string,
    createReportDto: CreateReportDto,
  ): Promise<Report> {
    const car = await this.carModel.findById(carId).exec();
    if (!car) {
      throw new NotFoundException(`Car with ID "${carId}" not found`);
    }

    const createdReport = new this.reportModel({
      ...createReportDto,
      car: new Types.ObjectId(carId),
    });
    const report = await createdReport.save();
    await this.activityLogService.logActivity(
      carId,
      ActivityType.REPORT_ADDED,
      `Report "${report.description}" added to car "${car.brand} ${car.model}".`,
    );
    return report;
  }

  async findReportsByCarId(carId: string): Promise<Report[]> {
    return this.reportModel
      .find({ car: new mongoose.Types.ObjectId(carId) })
      .exec();
  }

  async getCarStats(): Promise<any> {
    const allCars = await this.carModel.find().exec();

    const totalCars = allCars.length;
    const availableCars = allCars.filter(
      (car) => car.status === CarStatus.AVAILABLE,
    ).length;
    const maintenanceCars = allCars.filter(
      (car) => car.status === CarStatus.MAINTENANCE,
    ).length;
    const reservedCars = allCars.filter(
      (car) => car.status === CarStatus.RESERVED,
    ).length;
    const needsMaintenanceSoon = allCars.filter(
      (car) =>
        car.status !== CarStatus.MAINTENANCE &&
        car.kilometersSinceLastMaintenance >= 10000,
    ).length;

    return {
      totalCars,
      availableCars,
      maintenanceCars,
      reservedCars,
      needsMaintenanceSoon,
    };
  }
  @Cron(CronExpression.EVERY_MINUTE)
  async handleInUseActivitySimulation() {
    console.log('Running in-use car activity simulation cron job...');

    try {
      // Find all cars that are currently in use/rented
      const inUseCars = await this.carModel
        .find({ status: 'RESERVED' })
        .select('_id')
        .exec();

      console.log(
        `Found ${inUseCars.length} in-use car(s). Simulating telematics/usage activities...`,
      );

      // Simulate activities for each in-use car
      for (const car of inUseCars) {
        // Randomly generate 0–3 activities per minute (more realistic variation)
        const numActivities = Math.floor(Math.random() * 4); // 0 to 3

        for (let i = 0; i < numActivities; i++) {
          const activity = this.getRandomActivity();

          await this.activityLogService.logActivity(
            car._id.toString(),
            activity.type,
            activity.description,
          );
        }
      }

      console.log('In-use activity simulation completed successfully.');
    } catch (error) {
      console.error(
        'Error during in-use activity simulation cron job',
        error.stack,
      );
    }
  }
  private getRandomActivity(): { type: ActivityType; description: string } {
    const possibleActivities = [
      { type: ActivityType.ENGINE_STARTED, description: 'Engine started' },
      { type: ActivityType.ENGINE_STOPPED, description: 'Engine stopped' },
      { type: ActivityType.DOOR_OPENED, description: 'Driver door opened' },
      { type: ActivityType.DOOR_CLOSED, description: 'Driver door closed' },
      {
        type: ActivityType.PASSENGER_DOOR_OPENED,
        description: 'Passenger door opened',
      },
      { type: ActivityType.TRUNK_OPENED, description: 'Trunk opened' },
      { type: ActivityType.BONNET_OPENED, description: 'Bonnet opened' },
      {
        type: ActivityType.HIGH_TEMPERATURE,
        description: `Engine temperature high: ${95 + Math.floor(Math.random() * 15)}°C`,
      },
      {
        type: ActivityType.SPEED_EXCEEDED,
        description: `Speed exceeded limit: ${120 + Math.floor(Math.random() * 40)} km/h`,
      },
      {
        type: ActivityType.SUDDEN_BRAKING,
        description: 'Sudden braking detected',
      },
      {
        type: ActivityType.LOW_FUEL,
        description: `Low fuel level: ${5 + Math.floor(Math.random() * 20)}% remaining`,
      },
      { type: ActivityType.LOW_BATTERY, description: 'Battery voltage low' },
      {
        type: ActivityType.HIGH_RPM,
        description: `High engine RPM detected: ${5000 + Math.floor(Math.random() * 2000)} RPM`,
      },
      // Add more realistic telematics-style activities here as needed
    ];

    const randomIndex = Math.floor(Math.random() * possibleActivities.length);
    return possibleActivities[randomIndex];
  }
}
