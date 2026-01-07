import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import {
  ActivityLog,
  ActivityLogDocument,
  ActivityType,
} from '../schemas/activity-log.schema';
import { Car, CarDocument } from '../schemas/car.schema';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectModel(ActivityLog.name)
    private activityLogModel: Model<ActivityLogDocument>,
    @InjectModel(Car.name) private carModel: Model<CarDocument>,
  ) {}

  async logActivity(
    carId: string,
    activityType: ActivityType,
    description: string,
  ): Promise<ActivityLog> {
    const createdActivityLog = new this.activityLogModel({
      car: new Types.ObjectId(carId),
      activityType,
      description,
    });
    return createdActivityLog.save();
  }

  async findActivityLogsByCarId(carId: string): Promise<ActivityLog[]> {
    return await this.activityLogModel
      .find({ car: new mongoose.Types.ObjectId(carId) })
      .exec();
  }
}
