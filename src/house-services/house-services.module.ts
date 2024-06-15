import { Module } from '@nestjs/common';
import { HouseServicesController } from './house-services.controller';
import { HouseServicesService } from './house-services.service';
import { EmployeesService } from 'src/employees/employees.service';

@Module({
  controllers: [HouseServicesController],
  providers: [HouseServicesService, EmployeesService],
})
export class HouseServicesModule {}
