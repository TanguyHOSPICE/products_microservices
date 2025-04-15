import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // Mongoose connection to the database with the DNS in the .env file
    MongooseModule.forRoot(process.env.NOZAMA_PRODUCTS_DNS),
    ProductsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
