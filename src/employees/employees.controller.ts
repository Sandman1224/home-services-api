import { Controller, Get, Param } from '@nestjs/common';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  getActiveEmployees() {
    return this.employeesService.findAllActives();
  }

  @Get(':id')
  getEmployeeById(@Param('id') employeeId: string) {
    return this.employeesService.getEmployeeById(employeeId);
  }
}
