import { Module } from '@nestjs/common';
import { HouseServicesController } from './house-services.controller';
import { HouseServicesService } from './house-services.service';
import { EmployeesService } from 'src/employees/employees.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceAdditionals } from './entities/additionals.entity';

@Module({
  controllers: [HouseServicesController],
  providers: [HouseServicesService, EmployeesService],
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceAdditionals])],
})
export class HouseServicesModule {}
