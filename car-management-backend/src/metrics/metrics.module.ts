import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { TerminusModule } from '@nestjs/terminus/dist/terminus.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TerminusModule,HttpModule], // ← Import TerminusModule
  controllers: [MetricsController],
  providers: [],
})
export class MetricsModule {}
