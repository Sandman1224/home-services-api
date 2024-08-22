import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HouseServicesModule } from './house-services/house-services.module';
import { AppService } from './app.service';
import { EmployeesModule } from './employees/employees.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './house-services/entities/invoice.entity';
import { InvoiceAdditionals } from './house-services/entities/additionals.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HouseServicesModule,
    EmployeesModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Invoice, InvoiceAdditionals],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
