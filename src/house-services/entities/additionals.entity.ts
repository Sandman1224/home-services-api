import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity({ name: 'employment-invoices-additionals' })
export class InvoiceAdditionals {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  concept: string;

  @Column()
  amount: number;

  @Column('int', {
    default: 1,
  })
  status: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.additionals)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
