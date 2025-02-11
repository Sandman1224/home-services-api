import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EmployeesService } from '../employees/employees.service';
import { MonthInvoice } from './interfaces/month-invoice';
import { AdditionalConcepts } from './interfaces/additional-concepts';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Repository } from 'typeorm';
import { MonthInvoiceDto } from './dto/month-invoice.dto';
import { InvoiceAdditionals } from './entities/additionals.entity';
import { PaginationDto } from 'src/house-services/dto/pagination.dto';

@Injectable()
export class HouseServicesService {
  private readonly logger = new Logger('InvoiceService');

  constructor(
    private readonly employeesService: EmployeesService,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceAdditionals)
    private readonly invoiceAdditionalsRepository: Repository<InvoiceAdditionals>,
  ) {}

  async findInvoicesByYear(paginationDto: PaginationDto) {
    const { limit = 20, offset = 0, year } = paginationDto;
    const ACTIVE_STATUS = 1;

    const [data, total] = await this.invoiceRepository.findAndCount({
      where: {
        year,
        status: ACTIVE_STATUS,
      },
      take: limit,
      skip: offset,
    });

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInvoiceById(invoiceId) {
    // 1- Find month invoice
    const invoiceData = await this.invoiceRepository.findOneBy({
      id: invoiceId,
    });

    if (!invoiceData)
      throw new NotFoundException(`Invoice with id: ${invoiceId} not found`);

    // 1- Find employee
    const employeeData = await this.employeesService.findOne(
      invoiceData.employeeId,
    );
    if (!employeeData)
      throw new NotFoundException(
        `Required employee with id ${invoiceData.employeeId} does not exists`,
      );

    // 2- Calculate basic salary
    const basicSalary = this.calculateBasicSalary(
      invoiceData.regularHoursMonth,
      invoiceData.costPerRegularHour,
    );
    if (!basicSalary)
      throw new BadRequestException(
        `Basic salary calculate is wrong. Some parameters could be bad initializated`,
      );

    // 3- Calculate antiquity
    const startWorkDate = new Date(employeeData.startDate);
    const seniorityPlus = this.calculateSeniorityAmount(
      basicSalary,
      startWorkDate,
    );
    if (seniorityPlus === null)
      throw new BadRequestException(
        `Seniority amount calculation is wrong. Work day start of employee could be wrong`,
      );

    // 4- Plus additionals concepts
    let additionalsAmount = 0;
    if (invoiceData.additionals && invoiceData.additionals.length > 0) {
      additionalsAmount = this.calculateAdditionalConceptsAmount(
        invoiceData.additionals,
      );
    }

    const regularHoursMonth = invoiceData.regularHoursMonth;
    const monthInvoice = invoiceData.month;

    return {
      basicSalary,
      seniorityPlus,
      additionalsAmount,
      regularHoursMonth,
      monthInvoice,
    };
  }

  async calculateMonthInvoice(employeeDataParams: any): Promise<any> {
    const { employeeId, costPerRegularHour, regularHoursMonth, additionals } =
      employeeDataParams;
    const invoiceData: MonthInvoice = {};

    // 1- Find employee
    const employeeData = await this.employeesService.findOne(employeeId);
    if (!employeeData)
      throw new NotFoundException(
        `Required employee with id ${employeeId} does not exists`,
      );

    invoiceData.employeeId = employeeData.id;
    invoiceData.employeeName = employeeData.name;

    // 2- Calculate basic salary
    const basicSalary = this.calculateBasicSalary(
      regularHoursMonth,
      costPerRegularHour,
    );
    if (!basicSalary)
      throw new BadRequestException(
        `Basic salary calculate is wrong. Some parameters could be bad initializated`,
      );

    invoiceData.basicSalary = basicSalary;

    // 3- Calculate antiquity
    const startWorkDate = new Date(employeeData.startDate);
    const seniorityPlus = this.calculateSeniorityAmount(
      basicSalary,
      startWorkDate,
    );
    if (seniorityPlus === null)
      throw new BadRequestException(
        `Seniority amount calculation is wrong. Work day start of employee could be wrong`,
      );

    invoiceData.seniorityAmount = seniorityPlus;

    // 4- Plus additionals concepts
    if (additionals && additionals.length > 0) {
      invoiceData.additionals =
        this.calculateAdditionalConceptsAmount(additionals);
    }

    return invoiceData;
  }

  calculateBasicSalary(monthHoursNumber: number, costPerRegularHour: number) {
    const basicSalary = monthHoursNumber * costPerRegularHour;

    return basicSalary >= 0 ? basicSalary : null;
  }

  calculateSeniorityAmount(basicSalary: number, startDateAtService: Date) {
    // 1- Get years at service
    const actualDateInMilliseconds = new Date(Date.now()).getTime();
    const startDateAsServiceInMilliseconds = startDateAtService.getTime();

    const differenceInMilliseconds =
      actualDateInMilliseconds - startDateAsServiceInMilliseconds;
    const millisecondPerAverageYear =
      365 * 24 * 60 * 60 * 1000 + (1 / 4) * 24 * 60 * 60 * 1000; // Calculated considering leap years difference
    const yearsAtService = Math.floor(
      differenceInMilliseconds / millisecondPerAverageYear,
    );

    if (yearsAtService < 0) return null; // Invalid date calculated
    if (yearsAtService === 0) return 0; // Nothing to plus

    // 2- Calculate seniority amount
    return basicSalary * (yearsAtService / 100);
  }

  calculateAdditionalConceptsAmount(
    additionalConcepts: AdditionalConcepts[],
  ): number {
    let totalAmount = 0;

    // TODO: Validar los conceptos

    for (const item of additionalConcepts) {
      const amount: number = +item.amount;
      totalAmount += amount;
    }

    return totalAmount;
  }

  async createMonthInvoice(invoiceData: MonthInvoiceDto) {
    // 1- Validate data
    const { month, year, employeeId } = invoiceData;
    if (!this.validateInvoiceDate({ month, year }))
      throw new BadRequestException(
        `Basic salary calculate is wrong. Some parameters could be bad initializated`,
      );

    // 2- Validate employee existence by their id
    const employeeData = await this.employeesService.findOne(employeeId);
    if (!employeeData)
      throw new NotFoundException(
        `Required employee with id ${employeeId} does not exists`,
      );

    // 3- Validate - Month invoice only exists once in a month and year
    const monthDeviceExists = await this.isMonthInvoiceExists(
      employeeId,
      month,
      year,
    );
    if (monthDeviceExists) {
      throw new BadRequestException(
        `An invoice exists for required employee on the month and year specified`,
      );
    }

    // 2- Create invoice
    return this.createInvoice(invoiceData);
  }

  validateInvoiceDate(invoiceDate) {
    if (!invoiceDate || Object.keys(invoiceDate).length === 0) return false;

    const actualDate = new Date();
    const actualMonth = actualDate.getMonth();
    const actualYear = actualDate.getFullYear();

    if (invoiceDate.year > actualYear) return false;
    if (invoiceDate.year === actualYear && invoiceDate.month > actualMonth)
      return false;

    return true;
  }

  async isMonthInvoiceExists(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<boolean> {
    const queryParams = {
      employeeId,
      month,
      year,
      status: 1,
    };
    const monthInvoiceDbQuery = await this.findMonthInvoices(queryParams);
    if (monthInvoiceDbQuery.length > 0) return true;

    return false;
  }

  async findMonthInvoices(query): Promise<Invoice[]> {
    return await this.invoiceRepository.find({ where: query });
  }

  async createInvoice(invoiceData: MonthInvoiceDto) {
    try {
      const invoiceDb = this.invoiceRepository.create({
        ...invoiceData,
        status: 1,
      });
      await this.invoiceRepository.save(invoiceDb);

      return {
        ...invoiceDb,
      };
    } catch (error) {
      this.handleDbExceptions(error);
    }
  }

  private handleDbExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
