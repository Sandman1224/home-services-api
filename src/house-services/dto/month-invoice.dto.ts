import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { AdditionalConcepts } from '../interfaces/additional-concepts';

export class MonthInvoice {
  @IsString()
  @MinLength(1)
  employeeId: string;

  @IsNumber()
  @IsPositive()
  costPerRegularHour: number;

  @IsNumber()
  @IsPositive()
  regularHoursMonth: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  costPerExtraHour: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  extraHours: number;

  @IsOptional()
  additionals: AdditionalConcepts[];
}
