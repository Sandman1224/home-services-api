import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MonthInvoiceDto } from './dto/month-invoice.dto';
import { HouseServicesService } from './house-services.service';

@Controller('house-services')
export class HouseServicesController {
  constructor(private readonly houseServicesService: HouseServicesService) {}

  @Get(':id')
  findOne(@Param('id') invoiceId: string) {
    return this.houseServicesService.getInvoiceById(invoiceId);
  }

  @Post()
  getEmployeeMonthInvoice(@Body() monthInvoiceData: MonthInvoiceDto) {
    return this.houseServicesService.createMonthInvoice(monthInvoiceData);
  }
}
