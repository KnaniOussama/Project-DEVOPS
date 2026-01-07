import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportSeverity } from '../schemas/report.schema';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ReportSeverity)
  @IsOptional()
  severity?: ReportSeverity;
}