import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'employees' })
export class Employee {
  @PrimaryColumn()
  id: string;

  @Column('text')
  name: string;

  @Column('text')
  lastname: string;

  @Column('text')
  typeService: string;

  @Column('text')
  startDate: string;

  @Column()
  status: number;
}
