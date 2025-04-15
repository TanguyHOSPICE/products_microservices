import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NatsClientModule } from 'src/nats-client/nats-client.module';
import { ProductsMicroserviceController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schema/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema, collection: 'products' },
    ]),
    NatsClientModule,
  ],
  controllers: [ProductsMicroserviceController],
  providers: [ProductsService],
})
export class ProductsModule {}
