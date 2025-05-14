import { OmitType, PartialType } from '@nestjs/swagger';
import { MonthInvoiceDto } from './month-invoice.dto';
import { IsNumber, IsPositive, IsString, MinLength } from 'class-validator';

export class UpdateInvoiceDto extends PartialType(
  OmitType(MonthInvoiceDto, ['month', 'year', 'employeeId'] as const),
) {
  @IsNumber()
  @IsPositive()
  month: number;

  @IsNumber()
  @IsPositive()
  year: number;

  @IsString()
  @MinLength(1)
  employeeId: string;
}
