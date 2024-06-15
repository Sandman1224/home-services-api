import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeesService } from '../employees/employees.service';
import { MonthInvoice } from './interfaces/month-invoice';
import { AdditionalConcepts } from './interfaces/additional-concepts';

@Injectable()
export class HouseServicesService {
  private readonly addedConcepts = ['expenses', 'additionalAmount'];

  constructor(private readonly employeesService: EmployeesService) {}

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
}
