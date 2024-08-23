import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InvoiceAdditionals } from './additionals.entity';

@Entity({ name: 'employment-invoices' })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  employeeId: string;

  @Column()
  month: number;

  @Column()
  year: number;

  @Column('float', {
    default: 0,
  })
  costPerRegularHour: number;

  @Column('float', {
    default: 0,
  })
  regularHoursMonth: number;

  @Column('float', {
    nullable: true,
  })
  costPerExtraHour: number;

  @Column('float', {
    nullable: true,
  })
  extraHours: number;

  @Column()
  status: number;

  @OneToMany(() => InvoiceAdditionals, (additional) => additional.invoiceId, {
    cascade: true,
    eager: true,
  })
  additionals?: InvoiceAdditionals[];
}
