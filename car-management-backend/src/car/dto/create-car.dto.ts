import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CarStatus } from '../schemas/car.schema';

class LocationDto {
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;
}

export class CreateCarDto {
  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsNumber()
  @IsNotEmpty()
  year: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specifications?: string[];

  @IsNumber()
  @IsNotEmpty()
  totalKilometers: number;

  @IsNumber()
  @IsOptional()
  kilometersSinceLastMaintenance?: number;

  @IsOptional()
  lastMaintenanceDate?: Date;

  @IsEnum(CarStatus)
  @IsOptional()
  status?: CarStatus;

  @IsString()
  @IsOptional()
  image?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  currentLocation?: LocationDto;
}