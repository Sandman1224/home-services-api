import { Test } from '@nestjs/testing';
import { HouseServicesService } from './house-services.service';
import { EmployeesService } from '../employees/employees.service';
import { BadRequestException } from '@nestjs/common';

describe('HouseServicesService', () => {
  let houseService: HouseServicesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HouseServicesService, EmployeesService],
    }).compile();

    houseService = moduleRef.get<HouseServicesService>(HouseServicesService);
  });

  describe('Correct month invoice calculation', () => {
    it('should return singular employee data', async () => {
      const params = {
        employeeId: '12345',
        costPerRegularHour: 2000,
        regularHoursMonth: 40,
      };

      expect(await houseService.calculateMonthInvoice(params)).toEqual({
        employeeId: '12345',
        employeeName: 'Yanet',
        basicSalary: 80000,
        seniorityAmount: 4800,
      });
    });

    it('Incorrect month invoice calculation', async () => {
      const params = {
        employeeId: '12345',
        costPerRegularHour: -2000,
        regularHoursMonth: 40,
        basicSalary: 80000,
      };

      try {
        await houseService.calculateMonthInvoice(params);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('Calculate basic salary', () => {
      const costPerRegularHour = 40;
      const regularHoursMonth = 2000;

      expect(
        houseService.calculateBasicSalary(
          regularHoursMonth,
          costPerRegularHour,
        ),
      ).toBe(80000);
    });

    it('Calculate negative basic salary', () => {
      const costPerRegularHour = -2;
      const regularHoursMonth = 4;

      expect(
        houseService.calculateBasicSalary(
          regularHoursMonth,
          costPerRegularHour,
        ),
      ).toBeNull();
    });

    it('Calculate seniority amount when work date start is bigger than actual date', () => {
      const startDateAtService = new Date('2025-04-01');
      const basicSalary = 250000;

      expect(
        houseService.calculateSeniorityAmount(basicSalary, startDateAtService),
      ).toBeNull();
    });

    it('Calculate seniority mount', () => {
      const startDateAtService = new Date('2024-06-09');
      const basicSalary = 250000;

      expect(
        houseService.calculateSeniorityAmount(basicSalary, startDateAtService),
      ).toBe(0);
    });

    it('Calculate additional concepts when additional concepts array is empty', () => {
      const additionalConcepts = [];

      expect(
        houseService.calculateAdditionalConceptsAmount(additionalConcepts),
      ).toBe(0);
    });

    it('calculate additional concepts when array has valid values', () => {
      const additionalConcepts = [
        {
          concept: 'viaticos',
          amount: 3000,
        },
        {
          concept: 'gratificaciones',
          amount: 2000,
        },
      ];

      expect(
        houseService.calculateAdditionalConceptsAmount(additionalConcepts),
      ).toBe(5000);
    });
  });
});
