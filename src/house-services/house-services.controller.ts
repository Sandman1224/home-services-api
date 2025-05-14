import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MonthInvoiceDto } from './dto/month-invoice.dto';
import { HouseServicesService } from './house-services.service';
import { PaginationDto } from 'src/house-services/dto/pagination.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('house-services')
export class HouseServicesController {
  constructor(private readonly houseServicesService: HouseServicesService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.houseServicesService.findInvoicesByYear(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') invoiceId: string) {
    return this.houseServicesService.getInvoiceById(invoiceId);
  }

  @Post()
  getEmployeeMonthInvoice(@Body() monthInvoiceData: MonthInvoiceDto) {
    return this.houseServicesService.createMonthInvoice(monthInvoiceData);
  }

  @Patch(':id')
  updateInvoiceById(
    @Param('id') id: string,
    @Body() updatedData: UpdateInvoiceDto,
  ) {
    return this.houseServicesService.updateInvoiceById(id, updatedData);
  }
}
