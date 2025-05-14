export interface MonthInvoice {
  employeeId?: string;
  employeeName?: string;
  basicSalary?: number;
  seniorityAmount?: number;
  additionals?: number;
}

export interface InvoiceQueryParams {
  employeeId: string;
  month: number;
  year: number;
  status: number;
}
