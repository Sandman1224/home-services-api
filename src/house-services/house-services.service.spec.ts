import { Test } from '@nestjs/testing';
import { HouseServicesService } from './house-services.service';
import { EmployeesService } from '../employees/employees.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceAdditionals } from './entities/additionals.entity';
import { NotFoundException } from '@nestjs/common';

describe('houseService', () => {
  let houseService: HouseServicesService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HouseServicesService, EmployeesService],
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'services_default',
          port: 3306,
          username: 'root',
          password: 'mg751224',
          database: 'home_services',
          entities: [Invoice, InvoiceAdditionals],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Invoice, InvoiceAdditionals]),
      ],
    }).compile();

    houseService = moduleRef.get<HouseServicesService>(HouseServicesService);
  });

  describe('Data validation', () => {
    it('Date selected is bigger than actual date', () => {
      expect(
        houseService.validateInvoiceDate({
          year: 2024,
          month: 8,
        }),
      ).toBeFalsy();
    });

    it('Date selected is minor than actual date', () => {
      expect(
        houseService.validateInvoiceDate({
          year: 2024,
          month: 4,
        }),
      ).toBe(true);
    });

    it('Invoice exists on year and month selected for specified employee id', async () => {
      expect(await houseService.isMonthInvoiceExists('12345', 2, 2023)).toBe(
        true,
      );
    });

    it('Invoice does not exists for an employee id in month and year specified', async () => {
      expect(await houseService.isMonthInvoiceExists('12345', 1, 2025)).toBe(
        false,
      );
    });
  });

  describe('Getting one invoice', () => {
    it('Not found invoice by their id', async () => {
      await expect(
        houseService.getInvoiceById('2b3e6cb7-6b34-404d-b5d7-676ec3469bcd'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Getting many invoices (with pagination)', () => {
    it('Not found month invoices', async () => {
      expect(
        await houseService.findInvoicesByYear({
          employeeId: '123',
          limit: 20,
          offset: 0,
          year: 2026,
        }),
      ).toStrictEqual([]);
    });

    it('Getting 2023 month invoices', async () => {
      expect(
        await houseService.findInvoicesByYear({
          employeeId: '12345',
          limit: 20,
          offset: 0,
          year: 2023,
        }),
      ).toBeTruthy();
    });
  });
});
