export interface ValidationUpdateError {
  key: 'invalid_date' | 'invoice_exists_in_days';
  message: string;
}
