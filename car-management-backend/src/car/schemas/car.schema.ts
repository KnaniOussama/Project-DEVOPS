import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CarDocument = HydratedDocument<Car>;

export enum CarStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE',
}

export class LocationSchema {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}

@Schema({ timestamps: true })
export class Car {
  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop([String]) // Array of strings for specifications
  specifications: string[];

  @Prop({ required: true })
  totalKilometers: number;

  @Prop({ default: 0 })
  kilometersSinceLastMaintenance: number;

  @Prop({ type: Date, default: Date.now })
  lastMaintenanceDate: Date;

  @Prop({
    type: String,
    enum: CarStatus,
    default: CarStatus.AVAILABLE,
  })
  status: CarStatus;

  @Prop()
  image: string; // URL or path to the image

  @Prop({ type: LocationSchema })
  currentLocation: LocationSchema;
}

export const CarSchema = SchemaFactory.createForClass(Car);