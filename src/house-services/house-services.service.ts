import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EmployeesService } from '../employees/employees.service';
import { InvoiceQueryParams, MonthInvoice } from './interfaces/month-invoice';
import { AdditionalConcepts } from './interfaces/additional-concepts';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Repository } from 'typeorm';
import { MonthInvoiceDto } from './dto/month-invoice.dto';
import { InvoiceAdditionals } from './entities/additionals.entity';
import { PaginationDto } from 'src/house-services/dto/pagination.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ValidationUpdateError } from './interfaces/validations';

@Injectable()
export class HouseServicesService {
  private readonly logger = new Logger('InvoiceService');
  private readonly ACTIVE_STATUS = 1;

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

  async getInvoiceById(invoiceId: string): Promise<Invoice> {
    const invoiceData = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect(
        'invoice.additionals',
        'additionals',
        'additionals.status = :status',
        { status: this.ACTIVE_STATUS },
      )
      .where('invoice.id = :id', { id: invoiceId })
      .andWhere('invoice.status = :status', { status: this.ACTIVE_STATUS })
      .getOne();

    if (!invoiceData)
      throw new NotFoundException(`Invoice with id: ${invoiceId} not found`);

    return invoiceData;
  }

  async findInvoiceById(invoiceId: string): Promise<Invoice> {
    return await this.invoiceRepository.findOneBy({
      id: invoiceId,
      status: this.ACTIVE_STATUS,
    });
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
    const monthDeviceExists = await this.hasInvoiceForEmployeeInMonthAndYear(
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

  async hasInvoiceForEmployeeInMonthAndYear(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<boolean> {
    const queryParams: InvoiceQueryParams = {
      employeeId,
      month,
      year,
      status: this.ACTIVE_STATUS,
    };

    return (await this.findMonthInvoices(queryParams)).length > 0;
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

  async updateInvoiceById(invoiceId: string, updatedData: UpdateInvoiceDto) {
    // 1- Buscar los datos del recibo
    const invoiceStored = await this.findInvoiceById(invoiceId);
    const existsInvoiceStored = !!invoiceStored;
    if (!existsInvoiceStored) {
      throw new NotFoundException(
        `Invoice with id "${invoiceId}" could not be found`,
      );
    }

    // 2- Validar datos
    const processErrors = await this.validateUpdateProcess(
      updatedData,
      invoiceStored,
    );
    const processHasErrors = processErrors.length > 0;
    if (processHasErrors) {
      throw new BadRequestException(processErrors);
    }

    // 2- Actualizar los datos
    return await this.updateInvoiceData(invoiceStored, updatedData);
  }

  async validateUpdateProcess(
    dataToUpdate: UpdateInvoiceDto,
    invoiceStored: Invoice,
  ): Promise<ValidationUpdateError[]> {
    const errors = [];

    if (!this.isValidInvoiceDate(dataToUpdate.year, dataToUpdate.month)) {
      errors.push({ key: 'invalid_date', message: 'Invalid date supplied' });
    }

    const isTheSameInvoiceOfAnEmployee =
      invoiceStored.employeeId === dataToUpdate.employeeId &&
      invoiceStored.month === dataToUpdate.month &&
      invoiceStored.year === dataToUpdate.year;
    if (
      !isTheSameInvoiceOfAnEmployee &&
      (await this.hasInvoiceForEmployeeInMonthAndYear(
        dataToUpdate.employeeId,
        dataToUpdate.month,
        dataToUpdate.year,
      ))
    ) {
      errors.push({
        key: 'invoice_exists_in_days',
        message: 'Invoice exists in specified date',
      });
    }

    return errors;
  }

  async updateInvoiceData(
    invoiceStored: Invoice,
    dataUpdated: UpdateInvoiceDto,
  ) {
    const areConceptsToUpdate = Array.isArray(dataUpdated.additionals);

    // 1- Deprecamos conceptos adicionales viejos si los hay
    if (areConceptsToUpdate) {
      await this.updateInvoiceAdditionals(invoiceStored, dataUpdated);
    }

    // 3- Actualizamos los datos del recibo
    Object.assign(invoiceStored, dataUpdated);
    delete invoiceStored.additionals;

    return await this.invoiceRepository.save(invoiceStored);
  }

  private async updateInvoiceAdditionals(
    invoiceStored: Invoice,
    dataUpdated: UpdateInvoiceDto,
  ) {
    const invoiceHasConceptsStored =
      invoiceStored.additionals && invoiceStored.additionals.length > 0;

    if (invoiceHasConceptsStored) {
      await this.deleteAdditionalsConceptsOfAnInvoice(
        invoiceStored.additionals,
      );
    }

    const newConcepts = dataUpdated.additionals.map((concept) =>
      this.invoiceAdditionalsRepository.create({
        ...concept,
        status: this.ACTIVE_STATUS,
        invoice: invoiceStored,
      }),
    );
    await this.invoiceAdditionalsRepository.save(newConcepts);
  }

  isValidInvoiceDate(invoiceYear, invoiceMonth) {
    const actualDate = new Date();
    const actualMonth = actualDate.getMonth();
    const actualYear = actualDate.getFullYear();

    if (invoiceYear > actualYear) return false;

    return !(invoiceYear === actualYear && invoiceMonth > actualMonth);
  }

  async deleteAdditionalsConceptsOfAnInvoice(
    additionalsConcepts: InvoiceAdditionals[],
  ): Promise<void> {
    const entitiesToUpdate = additionalsConcepts.map((concept) => ({
      ...concept,
      status: 0,
    }));

    await this.invoiceAdditionalsRepository.save(entitiesToUpdate);
  }

  private handleDbExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
