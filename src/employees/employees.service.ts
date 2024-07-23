import { Injectable } from '@nestjs/common';

export type Employee = any;

@Injectable()
export class EmployeesService {
  private readonly ACTIVE_STATUS = 1;
  private readonly employees = [
    {
      id: '12345',
      name: 'Yanet',
      typeService: 'kidsCare',
      startDate: '03-03-2018',
      status: 1,
    },
    {
      id: '67890',
      name: 'Antonia',
      typeService: 'cleanning',
      startDate: '03-03-2016',
      status: 1,
    },
  ];

  async findOne(employeeId: string): Promise<Employee | undefined> {
    return this.employees.find((employee) => employee.id === employeeId);
  }

  async findAllActives(): Promise<Employee | []> {
    return this.employees.filter(
      (employee) => employee.status === this.ACTIVE_STATUS,
    );
  }
}
