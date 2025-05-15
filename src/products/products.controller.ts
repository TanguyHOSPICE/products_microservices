import { Controller } from '@nestjs/common';
import { ProductsService } from './products.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';

@Controller()
export class ProductsMicroserviceController {
  constructor(private readonly productsService: ProductsService) {}
  @MessagePattern('PRODUCT_CREATE')
  create(@Payload() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @MessagePattern('PRODUCT_FIND_ALL')
  findAll() {
    return this.productsService.findAll();
  }

  @MessagePattern('PRODUCT_FIND_ONE')
  findOne(@Payload() id: string) {
    return this.productsService.findOne(id);
  }

  @MessagePattern('PRODUCT_UPDATE')
  update(
    @Payload() payload: { id: string; updateProductDto: UpdateProductDto },
  ) {
    return this.productsService.update(payload.id, payload.updateProductDto);
  }

  @MessagePattern('PRODUCT_REMOVE')
  remove(@Payload() id: string) {
    return this.productsService.remove(id);
  }
}
