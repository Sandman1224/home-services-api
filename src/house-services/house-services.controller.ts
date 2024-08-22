import { Body, Controller, Post } from '@nestjs/common';
import { MonthInvoiceDto } from './dto/month-invoice.dto';
import { HouseServicesService } from './house-services.service';

@Controller('house-services')
export class HouseServicesController {
  constructor(private readonly houseServicesService: HouseServicesService) {}

  @Post()
  getEmployeeMonthInvoice(@Body() monthInvoiceData: MonthInvoiceDto) {
    return this.houseServicesService.createMonthInvoice(monthInvoiceData);
  }
}
