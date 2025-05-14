import { Test } from '@nestjs/testing';
import { HouseServicesService } from './house-services.service';
import { EmployeesService } from '../employees/employees.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceAdditionals } from './entities/additionals.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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
      expect(
        await houseService.hasInvoiceForEmployeeInMonthAndYear(
          '12345',
          2,
          2023,
        ),
      ).toBe(true);
    });

    it('Invoice does not exists for an employee id in month and year specified', async () => {
      expect(
        await houseService.hasInvoiceForEmployeeInMonthAndYear(
          '12345',
          1,
          2025,
        ),
      ).toBe(false);
    });
  });

  describe('Getting one invoice', () => {
    it('Not found invoice by their id', async () => {
      await expect(
        houseService.getInvoiceById('2b3e6cb7-6b34-404d-b5d7-676ec3469bcd'),
      ).rejects.toThrow(NotFoundException);
    });

    it('Found invoice by their id', async () => {
      expect(
        await houseService.getInvoiceById(
          'd18fa163-3108-494c-b140-ec16d9c1a7fb',
        ),
      ).toBeTruthy();
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

  describe('Update invoice by id', () => {
    it('Invoice provided does not exists', async () => {
      const updatedInvoice = {
        employeeId: '12345',
        month: 1,
        year: 2022,
        costPerRegularHour: 2000,
        regularHoursMonth: 40,
        costPerExtraHour: 2500,
      };

      await expect(
        houseService.updateInvoiceById('abc123', updatedInvoice),
      ).rejects.toThrow(NotFoundException);
    });

    interface InvoiceUpdateData {
      employeeId: string;
      month: number;
      year: number;
      costPerRegularHour: number;
      regularHoursMonth: number;
      costPerExtraHour: number;
    }

    const TEST_INVOICE_DATA: InvoiceUpdateData = {
      employeeId: '12345',
      month: 1,
      year: 2022,
      costPerRegularHour: 2000,
      regularHoursMonth: 40,
      costPerExtraHour: 2500,
    };

    const VALID_INVOICE_ID = '019fc0ed-2b97-4340-a16b-3f7189908d21';

    it('should successfully update an existing invoice', async () => {
      await expect(
        houseService.updateInvoiceById(VALID_INVOICE_ID, TEST_INVOICE_DATA),
      ).resolves.toBeTruthy();
    });

    it('Year and month updated data greater than actual date', async () => {
      const updatedInvoice = {
        employeeId: '12345',
        month: 6,
        year: 2025,
      };

      await expect(
        houseService.updateInvoiceById('abc123', updatedInvoice),
      ).rejects.toThrow(BadRequestException);
    });

    it('Update exists in month and year for an employee', async () => {
      const existenceInvoiceId = '425f1bf9-8355-4d34-9c30-211961c53ed0';
      const updatedInvoice = {
        employeeId: '12345',
        month: 2,
        year: 2025,
      };

      await expect(
        houseService.updateInvoiceById(existenceInvoiceId, updatedInvoice),
      ).rejects.toThrow(BadRequestException);
    });

    it('Update does not exist in month and year for an employee', async () => {
      const existenceInvoiceId = '425f1bf9-8355-4d34-9c30-211961c53ed0';
      const updatedInvoice = {
        employeeId: '12345',
        month: 11,
        year: 2021,
      };
      await expect(
        houseService.updateInvoiceById(existenceInvoiceId, updatedInvoice),
      ).resolves.toBe(true);
    });

    it('Update invoice with concepts', async () => {
      const invoiceId = '578b4f6e-5eeb-44c2-b4ee-41d8403dfcb5';
      const dataToUpdate = {
        employeeId: '12345',
        month: 11,
        year: 2021,
        additionals: [
          {
            concept: 'holidays',
            amount: 3500,
          },
          {
            concept: 'expenses',
            amount: 4500,
          },
        ],
      };

      await expect(
        houseService.updateInvoiceById(invoiceId, dataToUpdate),
      ).resolves.toBeTruthy();
    });
  });
});
