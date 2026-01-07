import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Car } from './car.schema';

export type ActivityLogDocument = ActivityLog & Document;

export enum ActivityType {
  CAR_CREATED = 'CAR_CREATED',
  CAR_UPDATED = 'CAR_UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  MAINTENANCE_COMPLETED = 'MAINTENANCE_COMPLETED',
  REPORT_ADDED = 'REPORT_ADDED',
  CAR_DELETED = 'CAR_DELETED',
}
export enum ActivityType {
  // ... your existing values
  ENGINE_STARTED = 'ENGINE_STARTED',
  ENGINE_STOPPED = 'ENGINE_STOPPED',
  DOOR_OPENED = 'DOOR_OPENED',
  DOOR_CLOSED = 'DOOR_CLOSED',
  PASSENGER_DOOR_OPENED = 'PASSENGER_DOOR_OPENED',
  TRUNK_OPENED = 'TRUNK_OPENED',
  BONNET_OPENED = 'BONNET_OPENED',
  HIGH_TEMPERATURE = 'HIGH_TEMPERATURE',
  SPEED_EXCEEDED = 'SPEED_EXCEEDED',
  SUDDEN_BRAKING = 'SUDDEN_BRAKING',
  LOW_FUEL = 'LOW_FUEL',
  LOW_BATTERY = 'LOW_BATTERY',
  HIGH_RPM = 'HIGH_RPM',
  // Add as many as you want
}
@Schema({ timestamps: true })
export class ActivityLog {
  @Prop({ type: Types.ObjectId, ref: 'Car', required: true })
  car: Types.ObjectId;

  @Prop({ type: String, enum: ActivityType, required: true })
  activityType: ActivityType;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
