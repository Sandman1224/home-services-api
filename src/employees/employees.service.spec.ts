import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { NotFoundException } from '@nestjs/common';

describe('EmployeesService', () => {
  let service: EmployeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeesService],
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'services_default',
          port: 3306,
          username: 'root',
          password: 'mg751224',
          database: 'home_services',
          entities: [],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Employee]),
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Getting an employee by their id', () => {
    it('Id does not exists', async () => {
      await expect(service.getEmployeeById('')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Id does exists', async () => {
      expect(service.getEmployeeById('12345')).toBeTruthy();
    });
  });
});
