import { IsEnum, IsNotEmpty } from 'class-validator';
import { CarStatus } from '../schemas/car.schema';

export class CarStatusDto {
  @IsEnum(CarStatus)
  @IsNotEmpty()
  status: CarStatus;
}