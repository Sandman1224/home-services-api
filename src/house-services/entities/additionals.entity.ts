import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity({ name: 'employment-invoices-additionals' })
export class InvoiceAdditionals {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  concept: string;

  @Column()
  amount: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.additionals)
  invoiceId: Invoice;
}
