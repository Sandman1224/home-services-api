import { Body, Controller, Post } from '@nestjs/common';
import { MonthInvoice } from './dto/month-invoice.dto';
import { HouseServicesService } from './house-services.service';

@Controller('house-services')
export class HouseServicesController {
  constructor(private readonly houseServicesService: HouseServicesService) {}

  @Post()
  getEmployeeMonthInvoice(@Body() monthInvoiceData: MonthInvoice) {
    return this.houseServicesService.calculateMonthInvoice(monthInvoiceData);
  }
}
