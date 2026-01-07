import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Car, CarSchema } from './schemas/car.schema';
import { Report, ReportSchema } from './schemas/report.schema';
import { ActivityLog, ActivityLogSchema } from './schemas/activity-log.schema';
import { CarService } from './car.service';
import { CarController } from './car.controller';
import { ActivityLogService } from './activity-log/activity-log.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Car.name, schema: CarSchema },
      { name: Report.name, schema: ReportSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
  ],
  providers: [CarService, ActivityLogService],
  controllers: [CarController],
})
export class CarModule {}