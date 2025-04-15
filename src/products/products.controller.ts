import { Controller } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller()
export class ProductsMicroserviceController {
  constructor(private readonly productsService: ProductsService) {}
}
