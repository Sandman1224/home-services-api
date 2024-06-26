import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HouseServicesModule } from './house-services/house-services.module';
import { AppService } from './app.service';
import { EmployeesModule } from './employees/employees.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), HouseServicesModule, EmployeesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
